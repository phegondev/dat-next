import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'



export async function GET(request: NextRequest) {

    try {
        const session = await getSession()

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }


        const { searchParams } = new URL(request.url)
        const patientId = searchParams.get('patientId') ? parseInt(searchParams.get('patientId')!) : null

        let targetPatientId = patientId

        // If patientId is null, retrieve the ID of the current authenticated patient
        if (targetPatientId === null) {
            const currentPatient = await prisma.patient.findFirst({
                where: { userId: session.user.id }
            })

            if (!currentPatient) {
                return Response.json(
                    createApiResponse(404, 'Patient profile not found for the current user'),
                    { status: 404 }
                )
            }
            targetPatientId = currentPatient.id
        }

        // Find the patient to ensure they exist
        const patient = await prisma.patient.findUnique({
            where: { id: targetPatientId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })


        if (!patient) {
            return Response.json(
                createApiResponse(404, 'Patient not found'),
                { status: 404 }
            )
        }


        // Security check: patients can only view their own history, doctors can view any
        const isDoctor = session.user.roles.includes('DOCTOR')
        const isOwnPatient = patient.userId === session.user.id

        console.log("isOwnPatient: ", isOwnPatient)

        if (!isDoctor && !isOwnPatient) {
            return Response.json(
                createApiResponse(403, 'You are not authorized to view this patient consultation history'),
                { status: 403 }
            )
        }


        // Fetch consultation history with proper relations
        const history = await prisma.consultation.findMany({
            where: {
                appointment: {
                    patientId: targetPatientId
                }
            },
            include: {
                appointment: {
                    include: {
                        doctor: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        profilePictureUrl: true
                                    }
                                },
                            }
                        },
                        patient: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        profilePictureUrl: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { consultationDate: 'desc' }
        })


        if (history.length === 0) {
            return Response.json(
                createApiResponse(200, 'No consultation history found for this patient', []),
                { status: 200 }
            )
        }

        return Response.json(
            createApiResponse(200, 'Consultation history retrieved successfully', history),
            { status: 200 }
        )

    } catch (error) {

        console.error('Get consultation history error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }
}