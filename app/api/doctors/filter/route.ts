import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'
import { Specialization } from '@prisma/client'



export async function GET(request: NextRequest) {
    try {

        const session = await getSession()

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }



        const { searchParams } = new URL(request.url)
        const specialization = searchParams.get('specialization') as Specialization

        if (!specialization) {
            return Response.json(
                createApiResponse(400, 'Specialization parameter is required'),
                { status: 400 }
            )
        }

        // Validate specialization enum value
        if (!Object.values(Specialization).includes(specialization)) {
            return Response.json(
                createApiResponse(400, 'Invalid specialization value'),
                { status: 400 }
            )
        }

        const doctors = await prisma.doctor.findMany({
            where: { specialization },
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


        const message = doctors.length === 0
            ? `No doctors found for specialization: ${specialization}`
            : `Doctors retrieved successfully for specialization: ${specialization}`

        return Response.json(
            createApiResponse(200, message, doctors),
            { status: 200 }
        )



    } catch (error) {

        console.error('Search doctors by specialization error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }
}


