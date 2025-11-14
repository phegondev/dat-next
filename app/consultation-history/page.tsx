'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiService } from '@/lib/api-service';



const ConsultationHistory = () => {

    const [consultations, setConsultations] = useState<any[]>([]);
    const [error, setError] = useState('');
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');

    useEffect(() => {
        fetchConsultationHistory()
    }, [appointmentId])



    const fetchConsultationHistory = async () => {
        try {
            let response;
            if (appointmentId) {
                // Fetch consultation for specific appointment
                response = await apiService.getConsultationByAppointmentId(parseInt(appointmentId));
                if (response.data.statusCode === 200) {
                    setConsultations([response.data.data]);
                }
            } else {
                console.log("No Appointment id passed")
                // Fetch all consultation history
                response = await apiService.getConsultationHistoryForMyself();
                if (response.data.statusCode === 200) {
                    setConsultations(response.data.data);
                }
            }
        } catch (error: any) {
            console.log(error)
            setError('Failed to load consultation history');
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


    const formatDoctorName = (doctor: any) => {
        if (doctor.firstName && doctor.lastName) {
            return `Dr. ${doctor.firstName} ${doctor.lastName}`;
        }
        return `Dr. ${doctor.user?.name}`;
    };




    return (
        <div className="container">
            <div className="page-container">

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}
                <div className="page-header">
                    <h1 className="page-title">
                        {appointmentId ? 'Consultation Notes' : 'Consultation History'}
                    </h1>
                    <Link href="/my-appointments" className="btn btn-secondary">
                        Back to Appointments
                    </Link>
                </div>

                {consultations.length === 0 ? (
                    <div className="empty-state">
                        <h3>No Consultation History</h3>
                        <p>You don't have any consultation records yet.</p>
                        <Link href="/book-appointment" className="btn btn-primary">
                            Book an Appointment
                        </Link>
                    </div>
                ) : (
                    <div className="consultations-list">
                        {consultations.map((consultation) => (
                            <div key={consultation.id} className="consultation-card">
                                <div className="consultation-header">
                                    <div className="consultation-doctor-info">
                                        <h3>{formatDoctorName(consultation.appointment.doctor)}</h3>
                                        <p className="specialization">
                                            {consultation.appointment.doctor.specialization?.replace(/_/g, ' ')}
                                        </p>
                                    </div>
                                    <span className="consultation-date">
                                        {formatDateTime(consultation.consultationDate)}
                                    </span>
                                </div>

                                <div className="consultation-details">
                                    <div className="consultation-section">
                                        <h4>Subjective Notes</h4>
                                        <div className="consultation-content">
                                            {consultation.subjectiveNotes || 'No subjective notes recorded.'}
                                        </div>
                                    </div>

                                    <div className="consultation-section">
                                        <h4>Objective Findings</h4>
                                        <div className="consultation-content">
                                            {consultation.objectiveFindings || 'No objective findings recorded.'}
                                        </div>
                                    </div>

                                    <div className="consultation-section">
                                        <h4>Assessment</h4>
                                        <div className="consultation-content">
                                            {consultation.assessment || 'No assessment recorded.'}
                                        </div>
                                    </div>

                                    <div className="consultation-section">
                                        <h4>Treatment Plan</h4>
                                        <div className="consultation-content">
                                            {consultation.plan || 'No treatment plan recorded.'}
                                        </div>
                                    </div>
                                </div>

                                {consultation.appointmentId && (
                                    <div className="consultation-footer">
                                        <Link
                                            href={`/my-appointments`}
                                            className="btn btn-outline btn-sm"
                                        >
                                            View Appointment Details
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

}
export default ConsultationHistory;