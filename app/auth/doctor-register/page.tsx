'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiService } from '@/lib/api-service';


const DoctorRegister = () => {

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        licenseNumber: '',
        specialization: '',
        roles: ['DOCTOR']
    });

    const [specializations, setSpecializations] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();


    useEffect(() => {
        fetchSpecializations()
    }, []);


    const fetchSpecializations = async () => {
        try {

            const response = await apiService.getAllSpecializationEnums();
            if (response.data.statusCode === 200) {
                setSpecializations(response.data.data)
            }

        } catch (error) {
            setError('Failed to load specializations');

        }
    }


    const handleChange = (e: any) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };


    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.specialization) {
            setError('Please select a specialization');
            return;
        }

        if (!formData.licenseNumber) {
            setError('Please pass in your licenseNumber');
            return;
        }

        try {

            const response = await apiService.register(formData);
            if (response.data.statusCode === 200 || response.data.statusCode === 201) {
                setSuccess('Doctor registration successful! You can now login.');

                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    licenseNumber: '',
                    specialization: '',
                    roles: ['DOCTOR']
                });

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
                <h2 className="form-title">Register as Doctor</h2>

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
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">License Number</label>
                        <input
                            type="text"
                            name="licenseNumber"
                            className="form-input"
                            value={formData.licenseNumber}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Specialization</label>
                        <select
                            name="specialization"
                            className="form-select"
                            value={formData.specialization}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Specialization</option>
                            {specializations.map((spec) => (
                                <option key={spec} value={spec}>
                                    {spec.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="form-btn"
                    >
                        Register as Doctor
                    </button>
                </form>

                <div className="form-link">
                    <p>
                        Already have an account? <Link href="/auth/login">Login here</Link>
                    </p>
                    <p className="mt-1">
                        Want to register as a patient? <Link href="/auth/register">Click here</Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default DoctorRegister;