'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiService } from '@/lib/api-service';


const PatientConsultationHistory = () => {

    const [consultations, setConsultations] = useState<any[]>([]);
    const [patient, setPatient] = useState<any | null>(null);
    const [error, setError] = useState('');
    const searchParams = useSearchParams();
    const router = useRouter();


    const patientId = searchParams.get('patientId');

    useEffect(() => {

        if (patientId) {
            fetchConsultationHistory();
            fetchPatientDetails();

        } else {

            setError('No patient ID provided');
        }

    }, [patientId])


    const fetchConsultationHistory = async () => {
        try {
            const response = await apiService.getConsultationHistoryForPatient(parseInt(patientId!));

            if (response.data.statusCode === 200) {
                setConsultations(response.data.data);
            }
        } catch (error: any) {
            setError('Failed to load consultation history');
            console.error('Error fetching consultation history:', error);
        }
    };


    const fetchPatientDetails = async () => {
        try {
            const response = await apiService.getPatientById(parseInt(patientId!));
            if (response.data.statusCode === 200) {
                setPatient(response.data.data);
            }
        } catch (error) {
            console.error('Failed to load patient details');
        }
    };

    const formatDateTime = (dateTimeString: string) => {
        return new Date(dateTimeString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (dateTimeString: string) => {
        const now = new Date();
        const consultationDate = new Date(dateTimeString);
        const diffTime = Math.abs(now.getTime() - consultationDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    };


    const groupConsultationsByDate = (consultations: any[]) => {
        const grouped: { [key: string]: any[] } = {};

        consultations.forEach(consultation => {
            const date = new Date(consultation.consultationDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            if (!grouped[date]) {
                grouped[date] = [];
            }

            grouped[date].push(consultation);
        });

        return grouped;
    };


    const calculateStatistics = (consultations: any[]) => {
        const totalConsultations = consultations.length;
        const recentConsultations = consultations.filter(consultation => {
            const consultationDate = new Date(consultation.consultationDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return consultationDate > thirtyDaysAgo;
        }).length;

        return {
            totalConsultations,
            recentConsultations
        };
    };


    const formatPatientAge = (dateOfBirth: string) => {
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };


    const formatBloodGroup = (bloodGroup: string) => {
        if (!bloodGroup) return 'Not specified';
        return bloodGroup.replace(/_/g, ' ');
    };

    const groupedConsultations = groupConsultationsByDate(consultations);
    const stats = calculateStatistics(consultations);



    if (error) {
        return (
            <div className="container">
                <div className="form-container">
                    <div className="alert alert-error">{error}</div>
                    <button onClick={() => router.push('/doctor/appointments')} className="btn btn-secondary">
                        Back to Appointments
                    </button>
                </div>
            </div>
        );
    }



    return (
        <div className="container">
            <div className="page-container">
                <div className="page-header">
                    <div className="header-content">
                        <div>
                            <h1 className="page-title">Patient Consultation History</h1>
                            {patient && (
                                <div className="patient-info-header">
                                    <p className="patient-name">
                                        {patient.firstName} {patient.lastName}
                                    </p>
                                    <div className="patient-details">
                                        <span>Email: {patient.user.email}</span>
                                        {patient.dateOfBirth && (
                                            <span>Age: {formatPatientAge(patient.dateOfBirth)}</span>
                                        )}
                                        {patient.bloodGroup && (
                                            <span>Blood Group: {formatBloodGroup(patient.bloodGroup)}</span>
                                        )}
                                        {patient.genotype && (
                                            <span>Genotype: {patient.genotype}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Link href="/doctor/appointments" className="btn btn-secondary">
                            Back to Appointments
                        </Link>
                    </div>
                </div>

                {/* Statistics Overview */}
                {consultations.length > 0 && (
                    <div className="consultation-stats">
                        <div className="stat-card">
                            <div className="stat-number">{stats.totalConsultations}</div>
                            <div className="stat-label">Total Consultations</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{stats.recentConsultations}</div>
                            <div className="stat-label">Last 30 Days</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">
                                {consultations.length > 0 ? getTimeAgo(consultations[0].consultationDate) : 'N/A'}
                            </div>
                            <div className="stat-label">Last Visit</div>
                        </div>
                    </div>
                )}

                {consultations.length === 0 ? (
                    <div className="empty-state">
                        <h3>No Consultation History</h3>
                        <p>This patient doesn't have any consultation records yet.</p>
                        <p className="mt-1">This could be their first visit or consultations haven't been documented.</p>
                    </div>
                ) : (
                    <div className="consultation-history">
                        {Object.entries(groupedConsultations).map(([date, dayConsultations]) => (
                            <div key={date} className="consultation-day-group">
                                <h3 className="day-header">{date}</h3>
                                <div className="consultations-list">
                                    {dayConsultations.map((consultation) => (
                                        <div key={consultation.id} className="consultation-card detailed">
                                            <div className="consultation-header">
                                                <div className="consultation-meta">
                                                    <span className="consultation-time">
                                                        {formatDateTime(consultation.consultationDate)}
                                                    </span>
                                                    <span className="time-ago">
                                                        ({getTimeAgo(consultation.consultationDate)})
                                                    </span>
                                                </div>
                                                <div className="consultation-id">
                                                    Appointment: #{consultation.appointmentId}
                                                </div>
                                            </div>

                                            <div className="consultation-sections">
                                                <div className="consultation-section">
                                                    <h4>📋 Subjective Notes</h4>
                                                    <div className="section-content">
                                                        {consultation.subjectiveNotes || 'No subjective notes recorded.'}
                                                    </div>
                                                </div>

                                                <div className="consultation-section">
                                                    <h4>🔍 Objective Findings</h4>
                                                    <div className="section-content">
                                                        {consultation.objectiveFindings || 'No objective findings recorded.'}
                                                    </div>
                                                </div>

                                                <div className="consultation-section">
                                                    <h4>💊 Assessment</h4>
                                                    <div className="section-content">
                                                        {consultation.assessment || 'No assessment recorded.'}
                                                    </div>
                                                </div>

                                                <div className="consultation-section">
                                                    <h4>📝 Treatment Plan</h4>
                                                    <div className="section-content">
                                                        {consultation.plan || 'No treatment plan recorded.'}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Diagnostic Assistance Section */}
                {consultations.length > 0 && (
                    <div className="diagnostic-assistance">
                        <h3>🩺 Diagnostic Insights</h3>
                        <div className="insights-grid">
                            <div className="insight-card">
                                <h4>Recurring Symptoms</h4>
                                <p>Look for patterns in subjective notes across multiple consultations</p>
                            </div>
                            <div className="insight-card">
                                <h4>Treatment Effectiveness</h4>
                                <p>Review previous treatment plans and their outcomes</p>
                            </div>
                            <div className="insight-card">
                                <h4>Progress Tracking</h4>
                                <p>Monitor changes in objective findings over time</p>
                            </div>
                            <div className="insight-card">
                                <h4>Chronic Conditions</h4>
                                <p>Identify persistent issues mentioned in assessments</p>
                            </div>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );

}

export default PatientConsultationHistory;