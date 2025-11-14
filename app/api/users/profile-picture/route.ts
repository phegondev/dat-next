import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createApiResponse } from '@/lib/res'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function PUT(request: NextRequest) {
    try {
        const session = await getSession()

        if (!session) {
            return Response.json(
                createApiResponse(401, 'Not authenticated'),
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return Response.json(
                createApiResponse(400, 'No file provided'),
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return Response.json(
                createApiResponse(400, 'Invalid file type. Only images are allowed.'),
                { status: 400 }
            )
        }

        // Validate file size (5MB limit)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
            return Response.json(
                createApiResponse(400, 'File too large. Maximum size is 10MB.'),
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

        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'profile-pictures')
        await mkdir(uploadDir, { recursive: true })


        const fileName = file.name
        const filePath = path.join(uploadDir, fileName)

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)

        // File URL accessible from the frontend
        const fileUrl = `/profile-pictures/${fileName}`

        // Delete old profile picture if exists
        if (user.profilePictureUrl) {
            const oldFilePath = path.join(process.cwd(), 'public', user.profilePictureUrl)
            try {
                await import('fs').then(fs =>
                    fs.promises.unlink(oldFilePath).catch(() => { })
                )
            } catch (error) {
                console.log("error deleting old profile pic")
            }
        }

        // Update user profile picture
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { profilePictureUrl: fileUrl },
            include: {
                roles: true,
                doctor: true,
                patient: true
            }
        })

        return Response.json(
            createApiResponse(200, 'Profile picture uploaded successfully', {
                profilePictureUrl: fileUrl,
                user: updatedUser
            }),
            { status: 200 }
        )

    } catch (error) {
        console.error('Upload profile picture error:', error)
        return Response.json(
            createApiResponse(500, 'Internal server error'),
            { status: 500 }
        )
    }
}