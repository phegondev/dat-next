
import { deleteSession } from '@/lib/auth'
import { createApiResponse } from '@/lib/res'

export async function POST() {
    try {
        await deleteSession() // This deletes the 'session' cookie

        return Response.json(
            createApiResponse(200, 'Logout successful'),
            { status: 200 }
        )
    } catch (error) {
        console.error('Logout error:', error)
        return Response.json(
            createApiResponse(500, 'Error logging out'),
            { status: 500 }
        )
    }
}