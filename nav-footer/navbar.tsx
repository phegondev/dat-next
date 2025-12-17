
'use client'

import { useState, useEffect, useCallback } from 'react'; // Added useCallback
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { apiService } from '@/lib/api-service';

const Navbar = () => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        isPatient: false,
        isDoctor: false,
        user: null as any,
        isLoading: true
    })

    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    // 1. Define the function BEFORE the useEffect (Fixes "accessed before declaration")
    // 2. Wrap in useCallback (Fixes "cascading rendering" by stabilizing the function)
    const checkAuthStatus = useCallback(async () => {
        try {
            setAuthState(prev => ({ ...prev, isLoading: true }));

            const response = await apiService.getMyUserDetails();

            if (response.data.statusCode === 200) {
                const userData = response.data.data;
                const userRoles = userData.roles?.map((role: any) => role.name) || [];

                setAuthState({
                    isAuthenticated: true,
                    isPatient: userRoles.includes('PATIENT'),
                    isDoctor: userRoles.includes('DOCTOR'),
                    user: userData,
                    isLoading: false
                });
            } else {
                setAuthState({
                    isAuthenticated: false,
                    isPatient: false,
                    isDoctor: false,
                    user: null,
                    isLoading: false
                });
            }
        } catch (error) {
            console.log('Auth check failed - user not authenticated');
            setAuthState({
                isAuthenticated: false,
                isPatient: false,
                isDoctor: false,
                user: null,
                isLoading: false
            });
        }
    }, []); // Empty array because apiService is an external import

    // 3. Place useEffect AFTER the function definition
    useEffect(() => {
        checkAuthStatus();
    }, [pathname, checkAuthStatus]); // Added checkAuthStatus as a dependency


    const handleLogoutClick = () => {
        setShowLogoutModal(true)
    }

    const handleConfirmLogout = async () => {
        try {
            await apiService.logout();
            setAuthState({
                isAuthenticated: false,
                isPatient: false,
                isDoctor: false,
                user: null,
                isLoading: false
            });
            setShowLogoutModal(false);
            router.push('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    const handleCancelLogout = () => {
        setShowLogoutModal(false)
    }

    const isActiveLink = (path: string) => {
        return pathname === path ? 'nav-link active' : 'nav-link';
    };

    return (
        <>
            <nav className="navbar">
                <div className="container">
                    <div className="navbar-content">
                        <Link href="/" className="logo">DAT Health</Link>

                        <div className="nav-links">
                            <Link href="/" className={isActiveLink('/')}>Home</Link>

                            {!authState.isAuthenticated ? (
                                <>
                                    <Link href="/auth/login" className={isActiveLink('/auth/login')}>Login</Link>
                                    <Link href="/auth/register" className={isActiveLink('/auth/register')}>Register as Patient</Link>
                                    <Link href="/auth/doctor-register" className={isActiveLink('/auth/doctor-register')}>Register as Doctor</Link>
                                </>
                            ) : (
                                <>
                                    {authState.isPatient && (
                                        <>
                                            <Link href="/profile" className={isActiveLink('/profile')}>Profile</Link>
                                            <Link href="/book-appointment" className={isActiveLink('/book-appointment')}>Book Appointment</Link>
                                            <Link href="/my-appointments" className={isActiveLink('/my-appointments')}>My Appointments</Link>
                                        </>
                                    )}

                                    {authState.isDoctor && (
                                        <>
                                            <Link href="/doctor/profile" className={isActiveLink('/doctor/profile')}>Doctor Profile</Link>
                                            <Link href="/doctor/appointments" className={isActiveLink('/doctor/appointments')}>My Appointments</Link>
                                        </>
                                    )}

                                    <button onClick={handleLogoutClick} className="logout-btn">Logout</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {showLogoutModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header"><h3>Confirm Logout</h3></div>
                        <div className="modal-body"><p>Are you sure you want to logout?</p></div>
                        <div className="modal-actions">
                            <button onClick={handleCancelLogout} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleConfirmLogout} className="btn btn-primary">Yes, Logout</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Navbar;
