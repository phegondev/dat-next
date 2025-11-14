import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'




export async function GET(
    request: NextRequest
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
        const doctorIdString = pathSegments[pathSegments.length - 1];

        // 1. Safely parse the doctorId ID and validate it
        const doctorId = parseInt(doctorIdString, 10);


        const doctor = await prisma.doctor.findUnique({
            where: { id: doctorId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        profilePictureUrl: true
                    }
                }
            }
        })


        if (!doctor) {
            return Response.json(
                createApiResponse(404, 'Doctor not found'),
                { status: 404 }
            )
        }

        return Response.json(
            createApiResponse(200, 'Doctor retrieved successfully', doctor),
            { status: 200 }
        )


    } catch (error) {
        
        console.error('Get doctor by ID error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }
}
