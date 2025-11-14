'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '@/lib/api-service';




const UpdateDoctorProfile = () => {

    const [formData, setFormData] = useState<any>({
        firstName: '',
        lastName: '',
        specialization: ''
    });


    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [specializations, setSpecializations] = useState<string[]>([]);
    const router = useRouter();

    useEffect(() => {
        fetchDoctorProfile()
        fetchSpecializations()
    }, [])


    const fetchDoctorProfile = async () => {
        try {
            const response = await apiService.getMyDoctorProfile();
            if (response.data.statusCode === 200) {
                const doctorData = response.data.data;
                setFormData({
                    firstName: doctorData.firstName || '',
                    lastName: doctorData.lastName || '',
                    specialization: doctorData.specialization || ''
                });
            }
        } catch (error: any) {
            setError('Failed to load doctor profile');
        }
    };


    const fetchSpecializations = async () => {
        try {
            const response = await apiService.getAllSpecializationEnums();
            if (response.data.statusCode === 200) {
                setSpecializations(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load specializations');
        }
    };


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

        try {
            const response = await apiService.updateMyDoctorProfile(formData);
            if (response.data.statusCode === 200) {
                setSuccess('Profile updated successfully!');
                setTimeout(() => {
                    router.push('/doctor/profile');
                }, 2000);
            }
        } catch (error: any) {
            setError(error.response?.data?.message || 'An error occurred while updating profile');
        }
    };


    const handleCancel = () => {
        router.push('/doctor/profile');
    };


    const formatSpecialization = (spec: string) => {
        return spec.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };



    return (
        <div className="container">
            <div className="form-container">
                <h2 className="form-title">Update Doctor Profile</h2>

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
                        <label className="form-label">First Name</label>
                        <input
                            type="text"
                            name="firstName"
                            className="form-input"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Enter your first name"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input
                            type="text"
                            name="lastName"
                            className="form-input"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Enter your last name"
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
                                    {formatSpecialization(spec)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            Update Profile
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

}

export default UpdateDoctorProfile;