
// Import functions for creating and verifying JWT tokens
import { jwtVerify, SignJWT } from 'jose'
import { NextRequest } from 'next/server'

// Get secret key from environment variables (used to sign and verify tokens)
const secretKey = process.env.JWT_SECRET
const key = new TextEncoder().encode(secretKey)



// -----------------------------
// 🔐 CREATE (Encrypt) JWT Token
// -----------------------------
export async function encrypt(payload: any) {
    // Create a signed JWT with the given payload
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' }) // Algorithm used to sign the token
        .setIssuedAt()                        // Add issued time (iat)
        .setExpirationTime('24h')             // Token expires in 24 hours
        .sign(key)                            // Sign the token with our secret key
}


// -----------------------------
// 🔓 VERIFY (Decrypt) JWT Token
// -----------------------------
export async function decrypt(input: string): Promise<any> {
    // Verify and decode the JWT token
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    })
    return payload // Return the original payload (user info, etc.)
}


// -------------------------------------------------
// ✨ Create a new session and store it in a cookie
// -------------------------------------------------
export async function createSession(user: any) {
    // Set cookie expiration time (72 hours)
    const expires = new Date(Date.now() + 72 * 60 * 60 * 1000)

    // Encrypt user info into a JWT
    const sessionToken = await encrypt({ user, expires })

    // Access Next.js cookie API
    const { cookies } = await import('next/headers')
    const cookieStore = cookies();

    // Save the token in a secure cookie
    (await cookieStore).set('session', sessionToken, {
        expires,
        httpOnly: true, // Not accessible from JS (more secure)
        secure: process.env.NODE_ENV === 'production', // Only HTTPS in prod
        sameSite: 'lax',
        path: '/',
    })
}



// -------------------------------------------------
// 🧠 Get session for server components or API routes
// -------------------------------------------------
export async function getSession() {
    // Use Next.js headers API to access cookies
    const { cookies } = await import('next/headers')
    const cookieStore = cookies()

    // Get the session token from cookies
    const session = (await cookieStore).get('session')?.value
    if (!session) return null

    try {
        return await decrypt(session)
    } catch (error) {
        return null
    }
}


// -------------------------------------------------
// ❌ Delete session cookie (log out user)
// -------------------------------------------------
export async function deleteSession() {
    const { cookies } = await import('next/headers')
    const cookieStore = cookies()
        ; (await cookieStore).delete('session')
}



// -------------------------------------------------
// 🍪 Get user session from cookies (Middleware use)
// -------------------------------------------------
export async function getSessionFromRequest(request: NextRequest) {
    // Read cookies from the incoming request
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) return null

    const cookies = parseCookies(cookieHeader)
    const session = cookies.session // Get 'session' cookie
    if (!session) return null

    try {
        // Try decrypting the session token
        return await decrypt(session)
    } catch (error) {
        // If token is invalid or expired, return null
        return null
    }
}


// -------------------------------------------------
// 🍪 Helper: Parse cookie header into key-value pairs
// -------------------------------------------------
function parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {}

    // Split all cookies by ';' and then each cookie into name=value
    cookieHeader.split(';').forEach(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=')
        if (name) {
            cookies[name] = valueParts.join('=') // Handles values containing '='
        }
    })

    return cookies
}

