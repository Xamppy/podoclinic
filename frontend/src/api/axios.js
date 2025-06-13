import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // URL base del backend
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Habilitar el envío de cookies
});

// Utilidad para verificar endpoints disponibles (para depuración)
export const checkEndpoint = async (endpoint, method = 'get') => {
  try {
    console.log(`Verificando endpoint: ${endpoint} (método: ${method})`);
    
    // Usar método OPTIONS para verificar la disponibilidad
    const response = await axios({
      method: method === 'get' ? 'get' : 'options',
      url: `/api${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: true
    });
    
    console.log(`Endpoint ${endpoint} disponible:`, response);
    return {
      available: true,
      status: response.status,
      headers: response.headers,
      data: response.data
    };
  } catch (error) {
    console.error(`Error al verificar endpoint ${endpoint}:`, error);
    return {
      available: false,
      status: error.response?.status,
      message: error.message,
      details: error.response?.data
    };
  }
};

// Hacer la función disponible globalmente para depuración desde la consola
window.checkEndpoint = checkEndpoint;

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
  
  // Si no se encuentra en las cookies, buscar si hay un token en el localStorage como fallback
  if (!cookieValue) {
    cookieValue = localStorage.getItem('csrfToken');
  }
  
  return cookieValue;
};

// Función para obtener un nuevo token CSRF desde el servidor
const fetchCSRFToken = async () => {
  try {
    // Hacer una solicitud al endpoint que proporciona el token CSRF
    const response = await axios.get('/api/get-csrf-token/', {
      withCredentials: true
    });
    
    // Si la respuesta tiene un token, guardarlo en localStorage como respaldo
    if (response.data && response.data.csrfToken) {
      localStorage.setItem('csrfToken', response.data.csrfToken);
      return response.data.csrfToken;
    }
    
    return null;
  } catch (error) {
    console.error('Error al obtener token CSRF:', error);
    return null;
  }
};

// Interceptor para añadir token de autenticación y CSRF
api.interceptors.request.use(
  async (config) => {
    // Añadir token de autenticación si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Añadir token CSRF para métodos no seguros
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method.toUpperCase())) {
      let csrfToken = getCSRFToken();
      
      // Si no hay token CSRF, intentar obtenerlo del servidor
      if (!csrfToken) {
        csrfToken = await fetchCSRFToken();
      }
      
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      } else {
        console.warn('No se encontró token CSRF');
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Función para renovar el token JWT
const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible');
    }
    
    const response = await axios.post('/api/usuarios/auth/refresh/', {
      refresh: refreshToken
    }, {
      withCredentials: true
    });
    
    const { access, refresh } = response.data;
    localStorage.setItem('authToken', access);
    if (refresh) {
      localStorage.setItem('refreshToken', refresh);
    }
    
    return access;
  } catch (error) {
    console.error('Error al renovar token:', error);
    // Si no se puede renovar, limpiar tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    // Redirigir al login
    window.location.href = '/login';
    throw error;
  }
};

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('Error en la petición:', error);
    
    const originalRequest = error.config;
    
    // Mejora en el manejo de errores para proporcionar más detalles
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      console.error('Datos del error:', error.response.data);
      console.error('Estado HTTP:', error.response.status);
      console.error('Cabeceras:', error.response.headers);
      
      // Si el error es 401, intentar renovar el token JWT
      if (error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const newToken = await refreshToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error('Error al renovar token:', refreshError);
          return Promise.reject(error);
        }
      }
      
      // Si el error es 403, podría ser un problema de CSRF
      if (error.response.status === 403 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // Obtener un nuevo token CSRF
          const newCSRFToken = await fetchCSRFToken();
          if (newCSRFToken) {
            // Configurar el nuevo token y reintentar
            console.log('Reintentando solicitud con nuevo token CSRF');
            originalRequest.headers['X-CSRFToken'] = newCSRFToken;
            return api(originalRequest);
          }
        } catch (retryError) {
          console.error('Error al reintentar la solicitud:', retryError);
        }
      }
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