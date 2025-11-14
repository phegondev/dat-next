// Fetch consultations for this doctor
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

        // Check if user is doctor
        if (!session.user.roles.includes('DOCTOR')) {
            return Response.json(
                createApiResponse(403, 'Only doctors can access this resource'),
                { status: 403 }
            )
        }

        // Get doctor profile
        const doctor = await prisma.doctor.findFirst({
            where: { userId: session.user.id }
        })

        if (!doctor) {
            return Response.json(
                createApiResponse(404, 'Doctor profile not found'),
                { status: 404 }
            )
        }

        // Fetch consultations for this doctor
        const consultations = await prisma.consultation.findMany({
            where: {
                appointment: {
                    doctorId: doctor.id
                }
            },
            include: {
                appointment: {
                    include: {
                        patient: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        profilePictureUrl: true
                                    }
                                }
                            }
                        },
                        doctor: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        profilePictureUrl: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { consultationDate: 'desc' }
        })

        return Response.json(
            createApiResponse(200, 'Doctor consultations retrieved successfully', consultations),
            { status: 200 }
        )

    } catch (error) {
        console.error('Get doctor consultations error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}