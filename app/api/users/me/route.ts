import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'

export async function GET() {
    try {
        const session = await getSession()

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
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

        // Return user directly - no DTO!
        return Response.json(
            createApiResponse(200, 'User details retrieved successfully', user),
            { status: 200 }
        )

    } catch (error) {
        console.error('Get user error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}