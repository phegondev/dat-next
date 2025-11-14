
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


        // Extract the ID directly from the request URL path to bypass the problematic 'params' object.
        const url = new URL(request.url);

        // Example Pathname: /api/appointments/complete/1
        // Split the pathname and filter out empty segments (like from leading/trailing slashes)
        const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);

        // The ID is guaranteed to be the last segment in this path structure
        const appointmentIdString = pathSegments[pathSegments.length - 1];

        // 1. Safely parse the appointment ID and validate it
        const appointmentId = parseInt(appointmentIdString, 10);



        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctor: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
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
                                email: true
                            }
                        }
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

        return Response.json(
            createApiResponse(200, 'Appointment retrieved successfully', appointment),
            { status: 200 }
        )


    } catch (error) {

        console.error('Get appointment error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }
}