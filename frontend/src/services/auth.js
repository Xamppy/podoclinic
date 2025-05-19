import axiosInstance from '../api/axios';

export const authService = {
    getCsrfToken: async () => {
        try {
            await axiosInstance.get('/api/get-csrf-token/');
        } catch (error) {
            console.error('Error obteniendo token CSRF:', error);
        }
    },

    login: async (credentials) => {
        try {
            // Primero obtener el token CSRF
            await authService.getCsrfToken();
            
            // Luego hacer el login
            const response = await axiosInstance.post('/api/login/', credentials);
            return response.data;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }
}; 