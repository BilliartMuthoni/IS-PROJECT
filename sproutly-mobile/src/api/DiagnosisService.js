// Talks to the FastAPI backend's /diagnose endpoints.
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { watchForExpiredSession } from './session';

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // uploads over rural connections need room
});
watchForExpiredSession(client);

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

/**
 * Several photos at once. crop is 'maize' | 'tomato' | 'potato' for all photos, or null to
 * let the backend detect each photo's crop. Resolves to { results: [{ index, result, error }] }.
 */
export async function submitBatch({ token, crop, imageUris }) {
    try {
        const formData = new FormData();
        if (crop) formData.append('crop', crop);
        imageUris.forEach((uri, i) => {
            formData.append('images', { uri, name: `leaf-${i + 1}.jpg`, type: 'image/jpeg' });
        });

        const { data } = await client.post('/diagnose/batch', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
            // Up to 10 photos in one upload: give slow connections more time than one photo.
            timeout: 120000,
        });
        return data;
    } catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}

/** The farmer corrects a detected crop: the same photo is checked again with their crop. */
export async function correctCrop({ token, diagnosisId, crop }) {
    try {
        const { data } = await client.post(
            `/diagnose/${diagnosisId}/crop`,
            { crop },
            { headers: { Authorization: `Bearer ${token}` } }
        );
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
