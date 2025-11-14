
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

        // Check if user has ADMIN role
        const isAdmin = session.user.roles.includes('ADMIN')
        if (!isAdmin) {
            return Response.json(
                createApiResponse(403, 'Access denied. Admin role required.'),
                { status: 403 }
            )
        }

        const users = await prisma.user.findMany({
            include: {
                roles: true,
                doctor: true,
                patient: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Return users array directly
        return Response.json(
            createApiResponse(200, 'All users retrieved successfully', users),
            { status: 200 }
        )

    } catch (error) {
        console.error('Get all users error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}