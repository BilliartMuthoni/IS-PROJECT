// Talks to the FastAPI backend's /auth endpoints.
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

function extractErrorMessage(error) {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
        // FastAPI/Pydantic validation errors come back as a list of {msg, ...}
        return detail.map((d) => d.msg).join(', ');
    }
    if (typeof detail === 'string') return detail;
    return error?.message || 'Something went wrong. Please try again.';
}

export async function register({ phoneNumber, email, password }) {
    try {
        const payload = { password };
        if (phoneNumber) payload.phone_number = phoneNumber;
        if (email) payload.email = email;
        const { data } = await client.post('/auth/register', payload);
        return data;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}

export async function login({ phoneNumber, email, password }) {
    try {
        const payload = { password };
        if (phoneNumber) payload.phone_number = phoneNumber;
        if (email) payload.email = email;
        const { data } = await client.post('/auth/login', payload);
        return data;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}

export async function verifyOtp({ phoneNumber, email, otp }) {
    try {
        const payload = { otp };
        if (phoneNumber) payload.phone_number = phoneNumber;
        if (email) payload.email = email;
        const { data } = await client.post('/auth/verify-otp', payload);
        return data;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
