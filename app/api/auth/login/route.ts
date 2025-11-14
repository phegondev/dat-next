import { NextRequest } from 'next/server'
import { createSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, password } = body

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                roles: true,
                doctor: true,
                patient: true
            }
        })

        if (!user) {
            return Response.json(
                createApiResponse(404, 'Invalid Email'),
                { status: 404 }
            )
        }

        const passwordValid = await bcrypt.compare(password, user.password)
        if (!passwordValid) {
            return Response.json(
                createApiResponse(401, 'Invalid Password'),
                { status: 401 }
            )
        }

        // Create session - THIS SETS THE COOKIE
        await createSession({
            id: user.id,
            email: user.email,
            name: user.name,
            roles: user.roles.map((role: any) => role.name),
            doctor: user.doctor,
            patient: user.patient
        })

        const result = createApiResponse(200, 'Login successful', {
            roles: user.roles.map((role: any) => role.name),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roles: user.roles
            }
        })

        return Response.json(result, { status: 200 })

    } catch (error) {
        console.error('Login error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}