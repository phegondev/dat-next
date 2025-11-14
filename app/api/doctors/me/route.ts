import { NextRequest } from 'next/server'
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

        // Check if user has DOCTOR role
        if (!session.user.roles.includes('DOCTOR')) {
            return Response.json(
                createApiResponse(403, 'Only doctors can access this resource'),
                { status: 403 }
            )
        }

        const doctor = await prisma.doctor.findFirst({
            where: { userId: session.user.id },
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
                createApiResponse(404, 'Doctor profile not found'),
                { status: 404 }
            )
        }

        return Response.json(
            createApiResponse(200, 'Doctor profile retrieved successfully', doctor),
            { status: 200 }
        )


    } catch (error) {
        console.error('Get doctor profile error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }
}








export async function PUT(request: NextRequest) {

    try {

        const session = await getSession()

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }


        // Check if user has DOCTOR role
        if (!session.user.roles.includes('DOCTOR')) {
            return Response.json(
                createApiResponse(403, 'Only doctors can update their profile'),
                { status: 403 }
            )
        }


        const body = await request.json()
        const {
            firstName,
            lastName,
            specialization
        } = body



        // Find the doctor profile
        const doctor = await prisma.doctor.findFirst({
            where: { userId: session.user.id }
        })



        if (!doctor) {
            return Response.json(
                createApiResponse(404, 'Doctor profile not found'),
                { status: 404 }
            )
        }

        // Prepare update data
        const updateData: any = {}

        // Basic fields
        if (firstName !== undefined) updateData.firstName = firstName
        if (lastName !== undefined) updateData.lastName = lastName
        if (specialization !== undefined) updateData.specialization = specialization


        // Update doctor profile
        const updatedDoctor = await prisma.doctor.update({
            where: { id: doctor.id },
            data: updateData,
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


        return Response.json(
            createApiResponse(200, 'Doctor profile updated successfully', updatedDoctor),
            { status: 200 }
        )


    } catch (error) {

        console.error('Update doctor profile error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }

}