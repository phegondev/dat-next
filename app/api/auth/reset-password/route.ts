import { prisma } from "@/lib/db";
import { emailService } from "@/lib/email-service";
import { createApiResponse } from "@/lib/res";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";



export async function POST(request: NextRequest) {

    try {

        const body = await request.json()
        const { code, newPassword } = body

        const resetCode = await prisma.passwordResetCode.findFirst({
            where: {
                code,
                used: false,
                expiryDate: { gt: new Date() }
            },
            include: {
                user: true
            }
        })

        if (!resetCode) {
            return Response.json(
                createApiResponse(400, 'Invalid or expired reset code'),
                { status: 400 }
            )
        }


        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12)

        // Update password and mark code as used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: resetCode.user.id },
                data: { password: hashedPassword }
            }),
            prisma.passwordResetCode.delete({
                where: { id: resetCode.id }
            })
        ])


        // Send password change confirmation email
        await emailService.sendPasswordUpdateConfirmation(resetCode.user.email, resetCode.user.name)

        return Response.json(
            createApiResponse(200, 'Password reset successfully'),
            { status: 200 }
        )

    } catch (error) {
        console.error('Reset password error:', error)

        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }

}