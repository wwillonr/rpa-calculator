import { getFirestore } from '../config/firebase.js';
import { clearFinancialCache } from '../services/calculationService.js';

class SettingsController {
    constructor() {
        this.db = getFirestore();
    }

    async getSettings(req, res) {
        try {
            const doc = await this.db.collection('settings').doc('global_config').get();

            if (!doc.exists) {
                // CORREÇÃO: Padrão Enterprise atualizado
                const defaultSettings = {
                    team_composition: [],
                    infra_costs: {
                        rpa_license_annual: 0,
                        virtual_machine_annual: 0,
                        database_annual: 0
                    },
                    annual_cost_estimate: {
                        baseAnnualCost: 70000,
                        robots24h: 33,
                        robots12h: 18,
                        markupMargin: 100,
                        growthPerMonth: 15
                    },
                    baselines: { low: 104, medium: 208, high: 416 },
                    updated_at: new Date().toISOString()
                };
                return res.status(200).json({ success: true, data: defaultSettings });
            }

            res.status(200).json({ success: true, data: doc.data() });
        } catch (error) {
            console.error('Error fetching settings:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateSettings(req, res) {
        try {
            const updates = req.body;

            // Log para debug no servidor
            console.log('Recebendo update:', JSON.stringify(updates, null, 2));

            // Firestore não aceita undefined. Vamos garantir que campos opcionais existam.
            // O frontend já deve tratar, mas garantimos aqui também.
            if (!updates.team_composition) updates.team_composition = [];

            // Salvamos com merge: true para não apagar campos que não foram enviados
            await this.db.collection('settings').doc('global_config').set(updates, { merge: true });

            // Invalida o cache financeiro para garantir que a próxima simulação use os novos valores
            clearFinancialCache();

            // Lemos de volta para confirmar a gravação
            const updatedDoc = await this.db.collection('settings').doc('global_config').get();

            res.status(200).json({
                success: true,
                data: updatedDoc.data(),
            });
        } catch (error) {
            console.error('Error updating settings:', error);
            // Retorna o erro exato para o frontend
            res.status(500).json({
                success: false,
                error: error.message || 'Erro interno ao salvar configurações',
            });
        }
    }
}

export default new SettingsController();