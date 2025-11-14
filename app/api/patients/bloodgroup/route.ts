import { createApiResponse } from '@/lib/res'
import { BloodGroup } from '@prisma/client'

export async function GET() {
    try {
        const bloodGroups = Object.values(BloodGroup)

        return Response.json(
            createApiResponse(200, 'BloodGroups retrieved successfully', bloodGroups),
            { status: 200 }
        )

    } catch (error) {
        console.error('Get blood groups error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}