import axios from "axios";

const API_BASE_URL = "/api";

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // Important for cookies
});

export const apiService = {
    // Check authentication by making a request to the server
    isAuthenticated: async (): Promise<boolean> => {
        try {
            const response = await api.get("/users/me");
            return response.status === 200;
        } catch (error) {
            return false;
        }
    },

    // Check roles by making a request to the server
    hasRole: async (role: string): Promise<boolean> => {
        try {
            const response = await api.get("/users/me");
            if (response.status === 200) {
                const userRoles = response.data.data?.roles?.map((r: any) => r.name) || [];
                return userRoles.includes(role);
            }
            return false;
        } catch (error) {
            return false;
        }
    },

    isDoctor: async (): Promise<boolean> => {
        return apiService.hasRole('DOCTOR');
    },

    isPatient: async (): Promise<boolean> => {
        return apiService.hasRole('PATIENT');
    },

    // AUTH & USERS MANAGEMENT METHODS
    login: (body: any) => {
        return api.post('/auth/login', body);
    },

    register: (body: any) => {
        return api.post('/auth/register', body);
    },

    logout: () => {
        return api.post('/auth/logout');
    },

    forgetPassword: (body: any) => {
        return api.post('/auth/forgot-password', body);
    },

    resetPassword: (body: any) => {
        return api.post('/auth/reset-password', body);
    },

    getMyUserDetails: () => {
        return api.get("/users/me");
    },

    getUserById: (userId: number) => {
        return api.get(`/users/${userId}`);
    },

    getAllUsers: () => {
        return api.get("/users/all");
    },

    updatePassword: (updatePasswordRequest: any) => {
        return api.put("/users/update-password", updatePasswordRequest);
    },

    uploadProfilePicture: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        return api.put("/users/profile-picture", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },


    
    // PATIENTS ACCOUNT MANAGEMENT
    getMyPatientProfile: () => {
        return api.get("/patients/me");
    },

    updateMyPatientProfile: (body: any) => {
        return api.put('/patients/me', body);
    },

    getPatientById: (patientId: number) => {
        return api.get(`/patients/${patientId}`);
    },

    getAllGenotypeEnums: () => {
        return api.get(`/patients/genotype`);
    },

    getAllBloodGroupEnums: () => {
        return api.get(`/patients/bloodgroup`);
    },

    // DOCTORS ACCOUNT MANAGEMENT
    getMyDoctorProfile: () => {
        return api.get("/doctors/me");
    },

    updateMyDoctorProfile: (body: any) => {
        return api.put("/doctors/me", body);
    },

    getAllDoctors: () => {
        return api.get("/doctors");
    },

    getDoctorById: (doctorId: number) => {
        return api.get(`/doctors/${doctorId}`);
    },

    getAllSpecializationEnums: () => {
        return api.get("/doctors/specializations");
    },

    searchDoctorsBySpecialization: (specialization: string) => {
        return api.get(`/doctors/filter?specialization=${specialization}`);
    },


    // APPOINTMENT MANAGEMENT
    bookAppointment: (appointmentDTO: any) => {
        return api.post("/appointments", appointmentDTO);
    },

    getMyAppointments: () => {
        return api.get("/appointments");
    },

    cancelAppointment: (appointmentId: number) => {
        return api.put(`/appointments/cancel/${appointmentId}`);
    },

    completeAppointment: (appointmentId: number) => {
        return api.put(`/appointments/complete/${appointmentId}`);
    },

    getAppointmentById: (appointmentId: number) => {
        return api.get(`/appointments/${appointmentId}`);
    },


    // CONSULTATION MANAGEMENT
    createConsultation: (consultationDTO: any) => {
        return api.post("/consultations", consultationDTO);
    },

    getConsultationByAppointmentId: (appointmentId: number) => {
        return api.get(`/consultations/appointment/${appointmentId}`);
    },

    getConsultationHistoryForPatient: (patientId: number) => {
        return api.get("/consultations/history", {
            params: { patientId }
        });
    },

    getConsultationHistoryForMyself: () => {
        return api.get("/consultations/history");
    },


};

export default apiService;