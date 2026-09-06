// Talks to the FastAPI backend's /diagnose endpoints.
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // uploads over rural connections need room
});

function extractErrorMessage(error) {
    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
        return detail.map((d) => d.msg).join(', ');
    }
    if (typeof detail === 'string') return detail;
    if (error?.code === 'ECONNABORTED') {
        return 'The upload timed out. Check your connection and try again.';
    }
    return error?.message || 'Something went wrong. Please try again.';
}

export async function submitDiagnosis({ token, crop, imageUri, symptoms }) {
    try {
        const formData = new FormData();
        formData.append('crop', crop);
        if (symptoms?.trim()) formData.append('symptoms_text', symptoms.trim());
        formData.append('image', {
            uri: imageUri,
            name: 'leaf.jpg',
            type: 'image/jpeg',
        });

        const { data } = await client.post('/diagnose', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}

export async function fetchHistory({ token }) {
    try {
        const { data } = await client.get('/diagnose/history', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return data;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
