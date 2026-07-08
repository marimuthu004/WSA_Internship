import axios from 'axios';
import qs from 'qs';

const api = axios.create({
    // Use the live Render URL in production, or fallback to localhost for local testing
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' }),
});

export default api;