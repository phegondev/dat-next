import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'


export async function POST(request: NextRequest) {
    try {

        const session = await getSession()

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }

        // Check if user is doctor
        if (!session.user.roles.includes('DOCTOR')) {
            return Response.json(
                createApiResponse(403, 'Only doctors can create consultation notes'),
                { status: 403 }
            )
        }

        const body = await request.json()
        const {
            appointmentId,
            subjectiveNotes,
            objectiveFindings,
            assessment,
            plan
        } = body



        // Get the appointment with doctor and patient relations
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctor: {
                    include: {
                        user: true
                    }
                },
                patient: {
                    include: {
                        user: true
                    }
                }
            }
        })
        if (!appointment) {
            return Response.json(
                createApiResponse(404, 'Appointment not found'),
                { status: 404 }
            )
        }


        // Security Check: Must be the doctor linked to the appointment
        if (appointment.doctor.userId !== session.user.id) {
            return Response.json(
                createApiResponse(403, 'You are not authorized to create notes for this consultation'),
                { status: 403 }
            )
        }

        // Check if consultation already exists for this appointment
        const existingConsultation = await prisma.consultation.findUnique({
            where: { appointmentId }
        })

        if (existingConsultation) {
            return Response.json(
                createApiResponse(400, 'Consultation notes already exist for this appointment'),
                { status: 400 }
            )
        }


        // Complete the appointment first
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: 'COMPLETED',
                endTime: new Date() // Set end time when completing
            }
        })


        // Create consultation
        const consultation = await prisma.consultation.create({
            data: {
                consultationDate: new Date(),
                subjectiveNotes,
                objectiveFindings,
                assessment,
                plan,
                appointmentId
            },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            include: {
                                user: true
                            }
                        },
                        patient: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        })


        return Response.json(
            createApiResponse(200, 'Consultation notes saved successfully', consultation),
            { status: 200 }
        )


    } catch (error) {

        console.error('Create consultation error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }

}

