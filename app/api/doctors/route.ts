import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'

export async function GET() {
    try {

        const doctors = await prisma.doctor.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        profilePictureUrl: true
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        })

        return Response.json(
            createApiResponse(200, 'All doctors retrieved successfully', doctors),
            { status: 200 }
        )

    } catch (error) {
        console.error('Get all doctors error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}