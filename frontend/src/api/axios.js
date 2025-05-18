import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // URL base del backend
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Habilitar el envío de cookies
});

// Función para obtener el token CSRF
const getCSRFToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

// Interceptor para añadir token de autenticación y CSRF
api.interceptors.request.use(
  (config) => {
    // Añadir token de autenticación si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Añadir token CSRF para métodos no seguros
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method.toUpperCase())) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Error en la petición:', error);
    
    // Mejora en el manejo de errores para proporcionar más detalles
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Datos del error:', error.response.data);
      console.error('Estado HTTP:', error.response.status);
      console.error('Cabeceras:', error.response.headers);
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.error('No se recibió respuesta del servidor');
      console.error('Solicitud:', error.request);
    } else {
      // Algo sucedió al configurar la solicitud que desencadenó un error
      console.error('Error al configurar la solicitud:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;