import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'
import bcrypt from 'bcryptjs'
import { emailService } from '@/lib/email-service'

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }

        const body = await request.json()
        const { oldPassword, newPassword } = body

        if (!oldPassword || !newPassword) {
            return Response.json(
                createApiResponse(400, 'Old and new password are required'),
                { status: 400 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return Response.json(
                createApiResponse(404, 'User not found'),
                { status: 404 }
            )
        }

        // Validate old password
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password)
        if (!isOldPasswordValid) {
            return Response.json(
                createApiResponse(400, 'Old password is incorrect'),
                { status: 400 }
            )
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 12)

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword }
        })

        // Send password change email
        await emailService.sendPassrdChangeAlert(user.email, user.name)

        return Response.json(
            createApiResponse(200, 'Password changed successfully'),
            { status: 200 }
        )

    } catch (error) {
        console.error('Update password error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}