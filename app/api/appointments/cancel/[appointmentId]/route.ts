
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'
import { emailService } from '@/lib/email-service'

export async function PUT(request: NextRequest) {

    try {

        const session = await getSession()

        // Extract the ID directly from the request URL path to bypass the problematic 'params' object.
        const url = new URL(request.url);

        // Example Pathname: /api/appointments/complete/1
        // Split the pathname and filter out empty segments (like from leading/trailing slashes)
        const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);

        // The ID is guaranteed to be the last segment in this path structure
        const appointmentIdString = pathSegments[pathSegments.length - 1];

        // 1. Safely parse the appointment ID and validate it
        const appointmentId = parseInt(appointmentIdString, 10);


        // Check if the ID is NaN or 0 (which is likely invalid for a primary key)
        if (isNaN(appointmentId) || appointmentId <= 0) {
            console.error('Missing or invalid appointment ID in URL path:', appointmentIdString);
            return Response.json(
                createApiResponse(400, 'Invalid appointment ID format'),
                { status: 400 }
            );
        }


        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }

        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctor: { include: { user: true } },
                patient: { include: { user: true } }
            }
        })

        if (!appointment) {
            return Response.json(
                createApiResponse(404, 'Appointment not found'),
                { status: 404 }
            )
        }

        // Security check: only patient or doctor can cancel
        const isOwner = appointment.patient.userId === session.user.id ||
            appointment.doctor.userId === session.user.id

        if (!isOwner) {
            return Response.json(
                createApiResponse(403, 'You do not have permission to cancel this appointment'),
                { status: 403 }
            )
        }


        // Update appointment status
        const updatedAppointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CANCELLED' },
            include: {
                doctor: { include: { user: true } },
                patient: { include: { user: true } }
            }
        })


        // Send cancellation emails to both parties
        const doctorUser = updatedAppointment.doctor.user
        const patientUser = updatedAppointment.patient.user

        const formattedTime = new Date(updatedAppointment.startTime).toLocaleString()


        const canceller = session.user.id === doctorUser.id ? doctorUser.name : patientUser.name


        const emailVars = {
            patientFullName: patientUser.name,
            doctorName: doctorUser.name,
            appointmentTime: formattedTime,
            cancellingPartyName: canceller,
        }


        // 1️⃣ Notify the patient
        await emailService.sendAppointmentCancellation(patientUser.email, {
            ...emailVars,
            recipientName: patientUser.name,
        })


        // 2️⃣ Notify the doctor
        await emailService.sendAppointmentCancellation(doctorUser.email, {
            ...emailVars,
            recipientName: doctorUser.name,
        })


        console.log(`Appointment ${appointmentId} cancelled — emails sent.`)


        return Response.json(
            createApiResponse(200, 'Appointment cancelled successfully'),
            { status: 200 }
        )


    } catch (error) {

        console.error('Cancel appointment error:', error)

        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }

}