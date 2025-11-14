import { createApiResponse } from '@/lib/res'
import { Genotype } from '@prisma/client'

export async function GET() {
    try {
        const genotypes = Object.values(Genotype)

        return Response.json(
            createApiResponse(200, 'Genotype retrieved successfully', genotypes),
            { status: 200 }
        )

    } catch (error) {
        console.error('Get genotypes error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}