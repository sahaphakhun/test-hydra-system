import axios from 'axios';

// Base URL ของ backend API ต้องกำหนดผ่าน env var NEXT_PUBLIC_API_URL
const baseURL = process.env.NEXT_PUBLIC_API_URL;
if (!baseURL) {
  throw new Error('Environment variable NEXT_PUBLIC_API_URL ต้องกำหนดเป็น URL ของ backend API');
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api; 