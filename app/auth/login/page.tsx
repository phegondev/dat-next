'use client'

import { useState } from 'react';
import Link from 'next/link';
import { apiService } from '@/lib/api-service';
import { useRouter } from 'next/navigation';


const Login = () => {


    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const router = useRouter();

    const handleChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };


    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');

        try {
            const response = await apiService.login(formData);

            if (response.data.statusCode === 200) {
                router.push('/');
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred during Login');
        }
    }




    return (
        <div className="container">
            <div className="form-container">
                <h2 className="form-title">Login</h2>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="form-btn"
                    >
                        Login
                    </button>
                </form>

                <div className="form-link">
                    <p>
                        Don't have an account?{' '}
                        <Link href="/auth/register">Register as Patient</Link> or{' '}
                        <Link href="/auth/doctor-register">Register as Doctor</Link>
                    </p>
                    <p>
                        Forgot Password?{' '}
                        <Link href="/auth/forgot-password">Reset Password here</Link>
                    </p>
                </div>

            </div>
        </div>
    );

}

export default Login;