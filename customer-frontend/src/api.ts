import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // TODO: Replace with your backend URL
  withCredentials: true, // if you use cookies for auth
});

export default api; 