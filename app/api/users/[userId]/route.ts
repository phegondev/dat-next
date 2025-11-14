import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'
import { NextRequest } from 'next/server'

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

        // Extract the ID directly from the request URL path
        const url = new URL(request.url);

        // Split the pathname and filter out empty segments (like from leading/trailing slashes)
        const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);

        // The ID is guaranteed to be the last segment in this path structure
        const userIdString = pathSegments[pathSegments.length - 1];

        // 1. Safely parse the User ID and validate it
        const userId = parseInt(userIdString, 10);


        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: true,
                doctor: true,
                patient: true
            }
        })

        if (!user) {
            return Response.json(
                createApiResponse(404, 'User not found'),
                { status: 404 }
            )
        }

        // Return user directly
        return Response.json(
            createApiResponse(200, 'User details retrieved successfully', user),
            { status: 200 }
        )

    } catch (error) {
        console.error('Get user by ID error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}