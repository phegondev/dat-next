import { prisma } from "@/lib/db";
import { emailService } from "@/lib/email-service";
import { createApiResponse } from "@/lib/res";
import { NextRequest } from "next/server";


export async function POST(request: NextRequest) {
    try {

        const body = await request.json()
        const { email } = body

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return Response.json(
                createApiResponse(404, 'account not found'),
                { status: 404 }
            )
        }

        // Generate reset code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiryDate = new Date(Date.now() + 5 * 60 * 60 * 1000) // 5 hours in milisec


        // Delete existing reset codes
        await prisma.passwordResetCode.deleteMany({
            where: { userId: user.id }
        })

        // Create new reset code
        await prisma.passwordResetCode.create({
            data: {
                code,
                expiryDate,
                userId: user.id
            }
        })

        // Send password reset email
        await emailService.sendPasswordResetEmail(user.email, user.name, code)


        return Response.json(
            createApiResponse(200, 'If an account with that email exists, a reset code has been sent'),
            { status: 200 }
        )

    } catch (error) {
        console.error('Forgot password error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )

    }

}