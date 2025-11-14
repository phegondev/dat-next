'use client'


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiService } from '@/lib/api-service';


const Profile = () => {

    const [userData, setUserData] = useState<any>(null)
    const [patientData, setPatientData] = useState<any>(null)
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchUserData()
    }, [])


    const fetchUserData = async () => {
        try {

            const userResponse = await apiService.getMyUserDetails();

            if (userResponse.data.statusCode === 200) {
                setUserData(userResponse.data.data);

                // Fetch patient profile if user is a patient
                if (userResponse.data.data.roles.some((role: any) => role.name === 'PATIENT')) {
                    const patientResponse = await apiService.getMyPatientProfile();
                    if (patientResponse.data.statusCode === 200) {
                        setPatientData(patientResponse.data.data);
                    } else {
                        setPatientData([])
                    }
                }
            }


        } catch (error) {
            setError('Failed to load profile data');
            console.error('Error fetching profile:', error);

        }
    }

    const handleUpdateProfile = () => {
        router.push('/update-profile');
    };

    const handleUpdatePassword = () => {
        router.push('/update-password');
    };




    const handleProfilePictureChange = async (event: any) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            setUploadError('Please select a valid image file (JPEG, PNG, GIF)');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('File size must be less than 10MB');
            return;
        }

        setUploading(true);
        setUploadError('');
        setUploadSuccess('');

        try {
            const response = await apiService.uploadProfilePicture(file);
            if (response.data.statusCode === 200) {
                setUploadSuccess('Profile picture updated successfully!');
                // Refresh user data to get the new profile picture URL
                fetchUserData();
                // Clear the file input
                event.target.value = '';
            }
        } catch (error: any) {
            setUploadError(error.response?.data?.message || 'An error occurred while uploading the picture');
        } finally {
            setUploading(false);
        }
    };


    const formatDate = (dateString: string) => {
        if (!dateString) return 'Not provided';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatBloodGroup = (bloodGroup: string) => {
        if (!bloodGroup) return 'Not provided';
        return bloodGroup.replace('_', ' ');
    };


    const getProfilePictureUrl = () => {
        if (!userData?.profilePictureUrl) return null;
        return userData.profilePictureUrl;
    };


    return (

        <div className="container">
            <div className="profile-container">

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}


                <div className="profile-header">
                    <div className="profile-header-main">
                        <div className="profile-picture-section">
                            <div className="profile-picture-container">
                                {getProfilePictureUrl() ? (
                                    <img
                                        src={getProfilePictureUrl()}
                                        alt="Profile"
                                        className="profile-picture"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const nextSibling = target.nextSibling as HTMLElement;
                                            if (nextSibling) nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className={`profile-picture-placeholder ${getProfilePictureUrl() ? 'hidden' : ''}`}>
                                    {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="profile-picture-overlay">
                                    <label htmlFor="profile-picture-upload" className="upload-label">
                                        {uploading ? 'Uploading...' : 'Change Photo'}
                                    </label>
                                    <input
                                        id="profile-picture-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePictureChange}
                                        disabled={uploading}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                            {uploadError && (
                                <div className="alert alert-error mt-1">
                                    {uploadError}
                                </div>
                            )}
                            {uploadSuccess && (
                                <div className="alert alert-success mt-1">
                                    {uploadSuccess}
                                </div>
                            )}
                        </div>
                        <div className="profile-title-section">
                            <h1 className="profile-title">My Profile</h1>
                            <p className="profile-subtitle">{userData?.name}</p>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <button onClick={handleUpdateProfile} className="btn btn-primary">
                            Update Profile
                        </button>
                        <button onClick={handleUpdatePassword} className="btn btn-secondary">
                            Update Password
                        </button>
                        <Link href="/book-appointment" className="btn btn-primary">
                            Book Appointment
                        </Link>
                        <Link href="/my-appointments" className="btn btn-secondary">
                            My Appointments
                        </Link>
                        <Link href="/consultation-history" className="btn btn-outline">
                            Consultation History
                        </Link>
                    </div>
                </div>

                <div className="profile-content">
                    {/* User Information Section */}
                    <div className="profile-section">
                        <h2 className="section-title">Account Information</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <label className="info-label">Name</label>
                                <div className="info-value">{userData?.name || 'Not provided'}</div>
                            </div>
                            <div className="info-item">
                                <label className="info-label">Email</label>
                                <div className="info-value">{userData?.email || 'Not provided'}</div>
                            </div>

                            <div className="info-item">
                                <label className="info-label">Roles</label>
                                <div className="info-value">
                                    {userData?.roles?.map((role: any) => role.name).join(', ') || 'Not provided'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Patient Information Section */}
                    {patientData && (
                        <div className="profile-section">
                            <h2 className="section-title">Medical Information</h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label className="info-label">First Name</label>
                                    <div className="info-value">{patientData.firstName || 'Not provided'}</div>
                                </div>
                                <div className="info-item">
                                    <label className="info-label">Last Name</label>
                                    <div className="info-value">{patientData.lastName || 'Not provided'}</div>
                                </div>
                                <div className="info-item">
                                    <label className="info-label">Phone</label>
                                    <div className="info-value">{patientData.phone || 'Not provided'}</div>
                                </div>
                                <div className="info-item">
                                    <label className="info-label">Date of Birth</label>
                                    <div className="info-value">{formatDate(patientData.dateOfBirth)}</div>
                                </div>
                                <div className="info-item">
                                    <label className="info-label">Blood Group</label>
                                    <div className="info-value">{formatBloodGroup(patientData.bloodGroup)}</div>
                                </div>
                                <div className="info-item">
                                    <label className="info-label">Genotype</label>
                                    <div className="info-value">{patientData.genotype || 'Not provided'}</div>
                                </div>
                                <div className="info-item full-width">
                                    <label className="info-label">Known Allergies</label>
                                    <div className="info-value">
                                        {patientData.knownAllergies || 'No known allergies'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!patientData && (
                        <div className="profile-section">
                            <div className="alert alert-info">
                                <p>No patient profile found. Please update your profile to add medical information.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )


}

export default Profile;