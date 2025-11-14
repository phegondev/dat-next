import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'


export async function PUT(request: NextRequest) {

    try {

        const session = await getSession()

        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);

        const appointmentIdString = pathSegments[pathSegments.length - 1];

        const appointmentId = parseInt(appointmentIdString, 10);


        // Check if the ID is NaN or 0 (which is likely invalid for a primary key)
        if (isNaN(appointmentId) || appointmentId <= 0) {
            console.error('Missing or invalid appointment ID in URL path:', appointmentIdString);
            return Response.json(
                createApiResponse(400, 'Invalid appointment ID format'),
                { status: 400 }
            );
        }

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }

        // Check if user is doctor
        if (!session.user.roles.includes('DOCTOR')) {
            return Response.json(
                createApiResponse(403, 'Only doctors can complete appointments'),
                { status: 403 }
            )
        }


        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                doctor: { include: { user: true } }
            }
        })


        if (!appointment) {
            return Response.json(
                createApiResponse(404, 'Appointment not found'),
                { status: 404 }
            )
        }


        // Security check: only assigned doctor can complete
        if (appointment.doctor.userId !== session.user.id) {
            return Response.json(
                createApiResponse(403, 'Only the assigned doctor can mark this appointment as complete'),
                { status: 403 }
            )
        }


        // Update appointment status and end time
        await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: 'COMPLETED',
                endTime: new Date()
            }
        })


        return Response.json(
            createApiResponse(200, 'Appointment successfully marked as completed. You may now proceed to create the consultation notes.'),
            { status: 200 }
        )


    } catch (error) {

        console.error('Complete appointment error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }
}