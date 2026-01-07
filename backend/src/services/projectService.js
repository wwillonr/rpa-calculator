// backend/src/services/projectService.js
import { getFirestore } from '../config/firebase.js';
import { FinancialService } from './calculationService.js';

class ProjectService {
    constructor() {
        this.db = getFirestore();
        this.financialService = new FinancialService();
    }

    async createProject(projectData) {
        try {
            const { projectName, ownerUid, responsibleName, inputs, complexity, strategic, maintenance } = projectData;
            const results = await this.financialService.calculateFullROI(inputs, complexity, strategic, maintenance);

            const project = {
                project_name: projectName,
                owner_uid: ownerUid || 'anonymous',
                responsible_name: responsibleName || 'Não informado',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                inputs_as_is: {
                    volume: inputs.volume,
                    aht: inputs.aht,
                    fte_cost: inputs.fteCost,
                    error_rate: inputs.errorRate || 0,
                },
                complexity_input: complexity,
                strategic_input: strategic || {},
                maintenance_input: maintenance || {},
                complexity_score: {
                    total_points: results.complexity.score,
                    classification: results.complexity.classification,
                    hours: results.complexity.hours,
                },
                strategic_analysis: results.strategic || {},
                maintenance_analysis: results.maintenance || {},
                results: {
                    development_cost: results.costs.development,
                    as_is_cost_annual: results.costs.asIs.annual,
                    to_be_cost_annual: results.costs.toBe.annual,
                    roi_year_1: results.roi.year1,
                    annual_savings: results.roi.annualSavings,
                    monthly_savings: results.roi.monthlySavings,
                    payback_months: results.roi.paybackMonths,
                    cost_breakdown: results.costs.toBe,
                },
            };

            const docRef = await this.db.collection('projects').add(project);
            return {
                id: docRef.id,
                ...project,
            };
        } catch (error) {
            console.error('Error creating project:', error);
            throw new Error('Failed to create project');
        }
    }

    async getProject(projectId) {
        try {
            const doc = await this.db.collection('projects').doc(projectId).get();
            if (!doc.exists) {
                throw new Error('Project not found');
            }
            return {
                id: doc.id,
                ...doc.data(),
            };
        } catch (error) {
            console.error('Error fetching project:', error);
            throw error;
        }
    }

    // --- CORREÇÃO PARA ADMIN VIEW ---


    /**
     * Helper para buscar emails dos donos dos projetos
     */
    async enrichWithUserEmails(projects) {
        if (!projects.length) return [];

        const userCache = {};
        const enriched = [];

        for (const project of projects) {
            let email = 'Desconhecido';
            const uid = project.owner_uid;

            if (!uid || uid === 'anonymous') {
                email = 'Anônimo';
            } else if (userCache[uid]) {
                email = userCache[uid];
            } else {
                try {
                    const userDoc = await this.db.collection('users').doc(uid).get();
                    if (userDoc.exists) {
                        email = userDoc.data().email || 'Email não encontrado';
                    } else {
                        email = 'Usuário removido';
                    }
                } catch (err) {
                    console.warn(`Erro ao buscar user ${uid}`, err);
                    email = 'Erro ao buscar';
                }
                userCache[uid] = email;
            }

            enriched.push({ ...project, user_email: email });
        }
        return enriched;
    }

    // Método interno auxiliar para evitar duplicação de lógica (já que o try/catch separou os fluxos)
    // Vou reescrever o listProjects inteiro para ser mais limpo na próxima iteração se necessário,
    // mas por agora vou usar o replace para injetar a chamada.

    // PERA, o meu replace acima foca no catch(indexError).
    // Preciso garantir que o 'try' block (caminho feliz) TAMBÉM chame o enrich.

    async listProjects(ownerUid, limit = 50) {
        try {
            let query = this.db.collection('projects');

            if (ownerUid && ownerUid !== 'all') {
                query = query.where('owner_uid', '==', ownerUid);
            }

            let projects = [];

            try {
                // Tenta query otimizada
                const optimizedQuery = query.orderBy('created_at', 'desc').limit(limit);
                const snapshot = await optimizedQuery.get();
                snapshot.forEach((doc) => projects.push({ id: doc.id, ...doc.data() }));
            } catch (indexError) {
                console.warn('Index missing, falling back to memory sort.');
                const snapshot = await query.get();
                snapshot.forEach((doc) => projects.push({ id: doc.id, ...doc.data() }));
                projects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }

            // Enriquecer com emails
            return await this.enrichWithUserEmails(projects);

        } catch (error) {
            console.error('Error listing projects:', error);
            throw new Error(`Failed to list projects: ${error.message}`);
        }

    }

    async updateProject(projectId, updates) {
        try {
            const updateData = {
                ...updates,
                updated_at: new Date().toISOString(),
            };
            await this.db.collection('projects').doc(projectId).update(updateData);
            return await this.getProject(projectId);
        } catch (error) {
            console.error('Error updating project:', error);
            throw new Error('Failed to update project');
        }
    }

    async deleteProject(projectId) {
        try {
            await this.db.collection('projects').doc(projectId).delete();
            return { success: true, message: 'Project deleted successfully' };
        } catch (error) {
            console.error('Error deleting project:', error);
            throw new Error('Failed to delete project');
        }
    }
}

export default ProjectService;