//app/api/auth/register/route.ts

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'
import bcrypt from 'bcryptjs'
import { emailService } from '@/lib/email-service'



export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const { name, email, password, roles = ['PATIENT'], specialization, licenseNumber } = body

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return Response.json(
                createApiResponse(400, 'User with email already exists'),
                { status: 400 }
            )
        }

        // Validate doctor registration
        const isDoctor = roles.includes('DOCTOR')
        if (isDoctor && (!licenseNumber || !specialization)) {
            return Response.json(
                createApiResponse(400, 'License number and specialization are required for doctor registration'),
                { status: 400 }
            )
        }

        // Ensure roles exist in database
        await ensureRolesExist()

        // Get roles from database
        const roleRecords = await prisma.role.findMany({
            where: {
                name: {
                    in: roles.map((role: string) => role.toUpperCase())
                }
            }
        })

        if (roleRecords.length === 0) {
            return Response.json(
                createApiResponse(400, 'Invalid roles provided'),
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user with transaction
        const result = await prisma.$transaction(async (tx: any) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    roles: {
                        connect: roleRecords.map((role: any) => ({ id: role.id }))
                    }
                },
                include: {
                    roles: true
                }
            })

            // Create profiles based on roles - handle multiple roles
            for (const role of roleRecords) {
                if (role.name === 'PATIENT') {
                    await tx.patient.create({
                        data: {
                            user: { connect: { id: user.id } }
                        }
                    })
                } else if (role.name === 'DOCTOR') {
                    await tx.doctor.create({
                        data: {
                            firstName: name.split(' ')[0] || '',
                            lastName: name.split(' ').slice(1).join(' ') || '',
                            specialization: specialization as any,
                            licenseNumber: licenseNumber!,
                            user: { connect: { id: user.id } }
                        }
                    })
                }
            }

            return user
        })


        // Send welcome email
        await emailService.sendWelcomeEmail(result.email, result.name)

        //200 The request succeeded and ok
        //201 The request succeeded and a new resource was created as a result.
        return Response.json(
            createApiResponse(200, 'Registration successful. A welcome email has been sent to you.', {
                email: result.email,
                name: result.name
            }),
            { status: 200 }
        )

    } catch (error: any) {
        console.error('Registration error:', error)
        return Response.json(
            createApiResponse(500, error.message || 'Internal server error'),
            { status: 500 }
        )
    }
}






// Ensure roles exist in database. If they don’t exist yet, it creates them. If they do, it ignors them and do nothing
async function ensureRolesExist() {
    const roles = ['PATIENT', 'DOCTOR', 'ADMIN']

    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName }
        })
    }
}
