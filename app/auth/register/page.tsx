'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiService } from '@/lib/api-service';

const Register = () => {

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();

    const handleChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await apiService.register({
                ...formData,
                roles: ['PATIENT']
            });

            if (response.data.statusCode === 200 || response.data.statusCode === 201) {
                setSuccess('Registration successful! You can now login.');
                setFormData({ name: '', email: '', password: '' });
                setTimeout(() => {
                    router.push('/auth/login');
                }, 5000);
            }

        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred during registration');
        }
    }




    return (
        <div className="container">
            <div className="form-container">
                <h2 className="form-title">Register as Patient</h2>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

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
                            minLength={4}
                        />
                    </div>

                    <button
                        type="submit"
                        className="form-btn"
                    >
                        Register as Patient
                    </button>
                </form>

                <div className="form-link">
                    <p>
                        Already have an account? <Link href="/auth/login">Login here</Link>
                    </p>
                    <p className="mt-1">
                        Want to register as a doctor? <Link href="/auth/doctor-register">Click here</Link>
                    </p>
                </div>

            </div>
        </div>
    );


}

export default Register;

