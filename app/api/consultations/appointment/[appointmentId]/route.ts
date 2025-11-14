// app/api/consultations/appointment/[appointmentId]/route.ts
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'

export async function GET(
    request: NextRequest,
) {
    try {
        const session = await getSession()

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }


        // Extract the ID directly from the request URL path to bypass the problematic 'params' object.
        const url = new URL(request.url);

        // Split the pathname and filter out empty segments (like from leading/trailing slashes)
        const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);

        // The ID is guaranteed to be the last segment in this path structure
        const appointmentIdString = pathSegments[pathSegments.length - 1];


        // 1. Safely parse the appointment ID and validate it
        const appointmentId = parseInt(appointmentIdString, 10);

        const consultation = await prisma.consultation.findUnique({
            where: { appointmentId },
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
                                }
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
            }
        })

        if (!consultation) {
            return Response.json(
                createApiResponse(404, 'Consultation notes not found for this appointment'),
                { status: 404 }
            )
        }

        // Security check: only patient or doctor involved can view
        const isAuthorized =
            consultation.appointment.patient.userId === session.user.id ||
            consultation.appointment.doctor.userId === session.user.id

        if (!isAuthorized) {
            return Response.json(
                createApiResponse(403, 'You are not authorized to view these consultation notes'),
                { status: 403 }
            )
        }

        return Response.json(
            createApiResponse(200, 'Consultation notes retrieved successfully', consultation),
            { status: 200 }
        )

    } catch (error) {
        console.error('Get consultation error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}