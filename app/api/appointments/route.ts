import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { emailService } from "@/lib/email-service";
import { createApiResponse } from "@/lib/res";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from 'uuid';


export async function POST(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }


        const body = await request.json()
        const { doctorId, startTime, initialSymptoms, purposeOfConsultation } = body

        // Get the patient initiating the booking
        const patient = await prisma.patient.findFirst({
            where: { userId: session.user.id },
            include: { user: true }
        })

        if (!patient) {
            return Response.json(
                createApiResponse(404, 'Patient profile required for booking'),
                { status: 404 }
            )
        }


        // Get the target doctor
        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
            include: { user: true }
        })

        if (!doctor) {
            return Response.json(
                createApiResponse(404, 'Doctor not found'),
                { status: 404 }
            )
        }


        // Validation: booking must be at least 1 hour in advance
        const appointmentStart = new Date(startTime)
        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)


        if (appointmentStart < oneHourFromNow) {
            return Response.json(
                createApiResponse(400, 'Appointments must be booked at least 1 hour in advance'),
                { status: 400 }
            )
        }


        // Check for conflicting appointments
        const appointmentEnd = new Date(appointmentStart.getTime() + 60 * 60 * 1000) // 60 minutes
        const checkStart = new Date(appointmentStart.getTime() - 60 * 60 * 1000) // 1 hour before

        const conflicts = await prisma.appointment.findMany({
            where: {
                doctorId: doctor.id,
                OR: [
                    {
                        startTime: { lt: appointmentEnd },
                        endTime: { gt: checkStart }
                    }
                ],
                status: { in: ['SCHEDULED'] }
            }
        })


        if (conflicts.length > 0) {
            return Response.json(
                createApiResponse(400, 'Doctor is not available at the requested time. Please check their schedule.'),
                { status: 400 }
            )
        }


        // Generate Jitsi Meet service meeting link
        const uuid = uuidv4().replace(/-/g, '')//This method removes all hyphens (-) from the generated UUID
        const uniqueRoomName = `dat-${uuid.substring(0, 10)}`//This takes the first 10 characters of the cleaned UUID string
        const meetingLink = `https://meet.jit.si/${uniqueRoomName}`


        // Create appointment
        const appointment = await prisma.appointment.create({
            data: {
                startTime: appointmentStart,
                endTime: appointmentEnd,
                meetingLink,
                initialSymptoms,
                purposeOfConsultation,
                status: 'SCHEDULED',
                doctorId: doctor.id,
                patientId: patient.id
            },
            include: {
                doctor: { include: { user: true } },
                patient: { include: { user: true } }
            }
        })


        //Send email notifications
        await sendAppointmentConfirmation(appointment)


        return Response.json(
            createApiResponse(200, 'Appointment booked successfully', appointment),
            { status: 200 }
        )


    } catch (error) {

        console.error('Book appointment error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }
}



export async function GET() {
    try {
        const session = await getSession()

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }


        let appointments


        // Check if user is doctor
        const isDoctor = session.user.roles.includes('DOCTOR')

        if (isDoctor) {
            const doctor = await prisma.doctor.findFirst({
                where: { userId: session.user.id }
            })

            if (!doctor) {
                return Response.json(
                    createApiResponse(404, 'Doctor profile not found'),
                    { status: 404 }
                )
            }

            appointments = await prisma.appointment.findMany({
                where: { doctorId: doctor.id },
                include: {
                    doctor: { include: { user: true } },
                    patient: { include: { user: true } }
                },
                orderBy: { id: 'desc' }
            })
        } else {

            // User is patient
            const patient = await prisma.patient.findFirst({
                where: { userId: session.user.id }
            })

            if (!patient) {
                return Response.json(
                    createApiResponse(404, 'Patient profile not found'),
                    { status: 404 }
                )
            }

            appointments = await prisma.appointment.findMany({
                where: { patientId: patient.id },
                include: {
                    doctor: { include: { user: true } },
                    patient: { include: { user: true } }
                },
                orderBy: { id: 'desc' }
            })
        }


        return Response.json(
            createApiResponse(200, 'Appointments retrieved successfully', appointments),
            { status: 200 }
        )


    } catch (error) {
        console.error('Get appointments error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }
}




const sendAppointmentConfirmation = async (appointment: any) => {
    try {
        const patientUser = appointment.patient.user;
        const doctorUser = appointment.doctor.user;
        const formattedTime = formatAppointmentTime(appointment.startTime);
        // All appointments here are virtual via Jitsi
        const consultationType = 'Virtual Consultation';

        // 1. Send Patient Confirmation Email
        const patientVars = {
            patientName: patientUser.name,
            doctorName: doctorUser.name,
            dateTime: formattedTime,
            consultationType: consultationType,
            meetingLink: appointment.meetingLink,
            purposeOfConsultation: appointment.purposeOfConsultation,
        };

        await emailService.sendPatientAppointmentConfirmation(
            patientUser.email,
            patientVars
        );

        // 2. Send Doctor Notification Email
        const doctorVars = {
            doctorName: doctorUser.name,
            patientFullName: patientUser.name,
            appointmentTime: formattedTime,
            consultationType: consultationType,
            meetingLink: appointment.meetingLink,
            initialSymptoms: appointment.initialSymptoms,
            purposeOfConsultation: appointment.purposeOfConsultation,
        };

        await emailService.sendDoctorAppointmentNotification(
            doctorUser.email,
            doctorVars
        )

        console.log(`Confirmation emails dispatched for Appointment ID: ${appointment.id}`);


    } catch (error) {
        console.error('Error dispatching appointment emails:', error);

    }
}



// Helper to format the time, e.g., "Monday, Dec 31, 2026 at 10:00 AM"
const formatAppointmentTime = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };
    // Use a regex replace to insert 'at' and handle locales consistently
    return date.toLocaleDateString('en-US', options).replace(/, (\d{2}:\d{2} (AM|PM))/, ' at $1');
};
