

// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth'

// Export as named proxy function
export async function proxy(request: NextRequest) {
    const session = await getSessionFromRequest(request)
    const { pathname } = request.nextUrl

    console.log('Proxy processing:', pathname, 'Session:', !!session)

    // Public routes that don't require authentication
    const publicRoutes = [
        // Authentication
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/register-doctor',
        '/api/auth/forgot-password',
        '/api/auth/reset-password',
        '/api/auth/logout',

        // Public Doctor Listing (including individual doctor details)
        '/api/doctors',
        '/api/doctors/filter',
        '/api/doctors/specializations',
        '/api/doctors/', // Individual doctor details e.g get doctor by id

        // Public Enum Data
        '/api/patients/bloodgroup',
        '/api/patients/genotype',

        // Static files
        '/_next',
        '/favicon.ico',
        '/public'
    ]

    const isPublicRoute = publicRoutes.some(route =>
        pathname.startsWith(route)
    )

    // Allow public routes
    if (isPublicRoute) {
        return NextResponse.next()
    }

    // Protected API routes
    const protectedApiRoutes = [
        // User Management
        '/api/users',
        '/api/users/me',
        '/api/users/by-id',
        '/api/users/all',
        '/api/users/update-password',
        '/api/users/profile-picture',

        // Patient Management
        '/api/patients/me',
        '/api/patients/update-profile',
        '/api/patients/', // Individual patient details e.g get patient by id

        // Doctor Management 
        '/api/doctors/me',
        '/api/doctors/update-profile',

        // Appointment Management
        '/api/appointments',
        '/api/appointments/book',
        '/api/appointments/cancel',
        '/api/appointments/complete',
        '/api/appointments/my-appointments',
        '/api/appointments/', // Individual appointment details e.g appointment by id

        // Consultation Management
        '/api/consultations',
        '/api/consultations/create',
        '/api/consultations/history',
        '/api/consultations/appointment'
    ]

    const isProtectedApiRoute = protectedApiRoutes.some(route =>
        pathname.startsWith(route)
    )

    // Check if it's an API route that requires authentication
    if (isProtectedApiRoute && !session) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        )
    }

    // Role-based protection for API routes
    if (session && isProtectedApiRoute) {
        const userRoles = session.user?.roles || []

        // Doctor-only API routes
        const doctorOnlyRoutes = [
            '/api/consultations/create',
            '/api/appointments/complete',
            '/api/doctors/me',
            '/api/doctors/update-profile'
        ]

        const isDoctorOnlyRoute = doctorOnlyRoutes.some(route =>
            pathname.startsWith(route)
        )

        if (isDoctorOnlyRoute && !userRoles.includes('DOCTOR')) {
            return NextResponse.json(
                { error: 'Doctor access required' },
                { status: 403 }
            )
        }

        // Patient-only API routes
        const patientOnlyRoutes = [
            '/api/patients/me',
            '/api/patients/update-profile',
            '/api/appointments/book',
        ]

        const isPatientOnlyRoute = patientOnlyRoutes.some(route =>
            pathname.startsWith(route)
        )

        if (isPatientOnlyRoute && !userRoles.includes('PATIENT')) {
            return NextResponse.json(
                { error: 'Patient access required' },
                { status: 403 }
            )
        }

    }



    // Web page Pages
    const protectedWebRoutes = [
        // Patient Pages
        '/profile',
        '/book-appointment',
        '/my-appointments',
        '/consultation-history',

        // Doctor Pages
        '/doctor',
        '/doctor/profile',
        '/doctor/appointments',
        '/doctor/create-consultation',
        '/doctor/patient-consultation-history'
    ]

    const isProtectedWebRoute = protectedWebRoutes.some(route =>
        pathname.startsWith(route)
    )

    // Auth pages
    const authRoutes = [
        '/auth/login',
        '/auth/register',
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/register-doctor'
    ]

    const isAuthRoute = authRoutes.includes(pathname)

    // Redirect to login if accessing protected web routes without session
    if (isProtectedWebRoute && !session) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Redirect to appropriate dashboard if accessing auth pages(login, register) with active session
    if (isAuthRoute && session) {
        const userRoles = session.user?.roles || []

        let redirectPath = '/'
        if (userRoles.includes('DOCTOR')) {
            redirectPath = '/doctor/profile'
        } else if (userRoles.includes('PATIENT')) {
            redirectPath = '/profile'
        }

        return NextResponse.redirect(new URL(redirectPath, request.url))
    }

    // Role-based protection for web routes
    if (session && isProtectedWebRoute) {
        const userRoles = session.user?.roles || []

        // Doctor-only web routes
        const doctorWebRoutes = [
            '/doctor',
            '/doctor/profile',
            '/doctor/appointments',
            '/doctor/create-consultation',
            '/doctor/patient-consultation-history'
        ]

        const isDoctorWebRoute = doctorWebRoutes.some(route =>
            pathname.startsWith(route)
        )

        if (isDoctorWebRoute && !userRoles.includes('DOCTOR')) {
            return NextResponse.redirect(new URL('/unauthorized', request.url))
        }

        // Patient-only web routes
        const patientWebRoutes = [
            '/book-appointment',
            '/my-appointments',
            '/consultation-history'
        ]

        const isPatientWebRoute = patientWebRoutes.some(route =>
            pathname.startsWith(route)
        )

        if (isPatientWebRoute && !userRoles.includes('PATIENT')) {
            return NextResponse.redirect(new URL('/unauthorized', request.url))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}