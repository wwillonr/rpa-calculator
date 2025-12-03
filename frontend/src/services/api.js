import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 60000, // 60 segundos para lidar com Cold Start do Render
});

/**
 * Serviço de API para projetos
 */
export const projectService = {
    /**
     * Cria um novo projeto
     */
    async createProject(data) {
        const response = await api.post('/projects', data);
        return response.data;
    },

    /**
     * Busca um projeto por ID
     */
    async getProject(id) {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    },

    /**
     * Lista projetos de um usuário
     */
    async listProjects(ownerUid) {
        const response = await api.get('/projects', {
            params: { ownerUid },
        });
        return response.data;
    },

    /**
     * Atualiza um projeto
     */
    async updateProject(id, data) {
        const response = await api.put(`/projects/${id}`, data);
        return response.data;
    },

    /**
     * Deleta um projeto
     */
    async deleteProject(id) {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    },
};

/**
 * Serviço de API para configurações
 */
export const settingsService = {
    /**
     * Busca configurações globais
     */
    async getSettings() {
        const response = await api.get('/settings');
        return response.data;
    },

    /**
     * Atualiza configurações globais
     */
    async updateSettings(data) {
        const response = await api.put('/settings', data);
        return response.data;
    },
};

/**
 * Health check
 */
export const healthCheck = async () => {
    const response = await api.get('/health');
    return response.data;
};

export default api;
