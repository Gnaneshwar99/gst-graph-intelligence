import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
});

export const getReconciliation = async () => {
    const response = await api.get('/reconcile');
    return response.data;
};

export const getSummary = async () => {
    const response = await api.get('/summary');
    return response.data;
};

export const getHighRisk = async () => {
    const response = await api.get('/high-risk');
    return response.data;
};

export const getVendorCompliance = async () => {
    const response = await api.get('/vendor-compliance');
    return response.data;
};

export const getAuditTrail = async (invoiceId) => {
    const response = await api.get(`/audit/${invoiceId}`);
    return response.data;
};

export const loadMockData = async () => {
    const response = await api.get('/load-data');
    return response.data;
};

export const triggerSyncAndEvaluate = async () => {
    const response = await api.post('/sync-and-evaluate');
    return response.data;
};

export const resetDB = async () => {
    const response = await api.get('/reset-db');
    return response.data;
};

export const getStoryteller = async (nodeId) => {
    const response = await api.get(`/storyteller/${nodeId}`);
    return response.data;
};

export const getGlobalAudit = async () => {
    const response = await api.get('/global-audit');
    return response.data;
};
