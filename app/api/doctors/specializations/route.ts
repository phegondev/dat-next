import { createApiResponse } from '@/lib/res'
import { Specialization } from '@prisma/client'



export async function GET() {
    try {

        const specializations = Object.values(Specialization)

        return Response.json(
            createApiResponse(200, 'Specializations retrieved successfully', specializations),
            { status: 200 }
        )

    } catch (error) {

        console.error('Get specializations error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}