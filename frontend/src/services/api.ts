import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const api = axios.create({ baseURL });

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization;
    }
    return config;
});

api.interceptors.response.use(
    res => res,
    async err => {
        const originalRequest = err.config;
        
        // Don't retry on auth endpoints
        if (originalRequest.url?.includes('/auth/login') || 
            originalRequest.url?.includes('/auth/login-master') ||
            originalRequest.url?.includes('/auth/refresh')) {
            return Promise.reject(err);
        }

        if (err.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(err);
            }
            
            try {
                const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch {
                localStorage.clear();
                window.location.href = '/login';
            }
        }
        return Promise.reject(err);
    }
);

export default api;
