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

        // Check if user has PATIENT role
        if (!session.user.roles.includes('PATIENT')) {
            return Response.json(
                createApiResponse(403, 'Only patients can access this resource'),
                { status: 403 }
            )
        }

        const patient = await prisma.patient.findFirst({
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

        if (!patient) {
            return Response.json(
                createApiResponse(404, 'Patient profile not found'),
                { status: 404 }
            )
        }

        return Response.json(
            createApiResponse(200, 'Patient profile retrieved successfully', patient),
            { status: 200 }
        )

    } catch (error) {
        console.error('Get patient profile error:', error)
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

        // Check if user has PATIENT role
        if (!session.user.roles.includes('PATIENT')) {
            return Response.json(
                createApiResponse(403, 'Only patients can update their profile'),
                { status: 403 }
            )
        }

        const body = await request.json()
        const {
            firstName,
            lastName,
            phone,
            dateOfBirth,
            knownAllergies,
            bloodGroup,
            genotype
        } = body

        // Find the patient profile
        const patient = await prisma.patient.findFirst({
            where: { userId: session.user.id }
        })

        if (!patient) {
            return Response.json(
                createApiResponse(404, 'Patient profile not found'),
                { status: 404 }
            )
        }

        // Prepare update data
        const updateData: any = {}

        // Basic fields
        if (firstName !== undefined) updateData.firstName = firstName
        if (lastName !== undefined) updateData.lastName = lastName
        if (phone !== undefined) updateData.phone = phone
        if (dateOfBirth !== undefined) updateData.dateOfBirth = new Date(dateOfBirth)

        // Medical fields
        if (knownAllergies !== undefined) updateData.knownAllergies = knownAllergies
        if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup
        if (genotype !== undefined) updateData.genotype = genotype

        // Update patient profile
        const updatedPatient = await prisma.patient.update({
            where: { id: patient.id },
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
            createApiResponse(200, 'Patient profile updated successfully', updatedPatient),
            { status: 200 }
        )

    } catch (error) {
        console.error('Update patient profile error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}