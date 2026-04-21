import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_BASEURL,
    timeout: 60000
})

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem("token");
  
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  
    return config;
  });
console.log("API Base URL:", import.meta.env.VITE_BASEURL)
export default api

