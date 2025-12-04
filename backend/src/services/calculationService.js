import { getFirestore } from '../config/firebase.js';

// Cache Global (Module Level) para ser compartilhado entre instâncias e invalidado externamente
let globalCachedRates = null;
let globalLastCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes cache

/**
 * Função para limpar o cache financeiro.
 * Deve ser chamada sempre que as configurações globais forem atualizadas.
 */
export const clearFinancialCache = () => {
    globalCachedRates = null;
    globalLastCacheTime = 0;
    console.log('Financial cache cleared manually.');
};

/**
 * Serviço de Cálculo de Complexidade
 * Implementa a Matriz de Complexidade baseada em scoring
 */
class ComplexityService {
    /**
     * Calcula a pontuação de complexidade baseada nos critérios
     */
    calculateComplexityScore(complexity) {
        let totalPoints = 0;

        // 1. Número de Aplicações
        const numApps = complexity.numApplications || 0;
        if (numApps <= 2) totalPoints += 1;
        else if (numApps <= 4) totalPoints += 2;
        else totalPoints += 3;

        // 2. Tipo de Dados
        const dataType = complexity.dataType || 'structured';
        switch (dataType) {
            case 'structured': totalPoints += 1; break;
            case 'text': totalPoints += 2; break;
            case 'ocr': totalPoints += 5; break;
            default: totalPoints += 1;
        }

        // 3. Ambiente
        const environment = complexity.environment || 'web';
        switch (environment) {
            case 'web': totalPoints += 1; break;
            case 'sap': totalPoints += 2; break;
            case 'citrix': totalPoints += 4; break;
            default: totalPoints += 1;
        }

        // 4. Regras/Passos
        const numSteps = complexity.numSteps || 0;
        if (numSteps < 20) totalPoints += 1;
        else if (numSteps <= 50) totalPoints += 3;
        else totalPoints += 5;

        // Classificação (5 Níveis)
        // Pontuação Máxima Estimada: 3 + 5 + 4 + 5 = 17
        // Pontuação Mínima: 1 + 1 + 1 + 1 = 4
        let classification = 'VERY_SIMPLE';
        if (totalPoints >= 14) classification = 'VERY_COMPLEX';
        else if (totalPoints >= 11) classification = 'COMPLEX';
        else if (totalPoints >= 8) classification = 'MEDIUM';
        else if (totalPoints >= 6) classification = 'SIMPLE';
        else classification = 'VERY_SIMPLE';

        return {
            totalPoints,
            classification,
        };
    }
}

/**
 * Serviço de Cálculo Financeiro
 * Implementa as fórmulas de ROI, Payback e custos (Versão Enterprise)
 */
class FinancialService {
    constructor() {
        this.db = getFirestore();
    }

    /**
     * Busca as taxas globais do Firestore (com Cache)
     */
    async getGlobalRates() {
        const now = Date.now();
        if (globalCachedRates && (now - globalLastCacheTime < CACHE_TTL)) {
            console.log('Using cached global rates');
            return globalCachedRates;
        }

        try {
            const settingsDoc = await this.db.collection('settings').doc('global_config').get();
            let data;

            if (!settingsDoc.exists) {
                // Fallback de segurança se o banco estiver vazio
                data = {
                    team_composition: [{
                        role: 'Dev Padrão',
                        rate: 120.0,
                        shares: { very_simple: 0.1, simple: 0.2, medium: 0.5, complex: 1.0, very_complex: 2.0 }
                    }],
                    infra_costs: { rpa_license_annual: 15000.0, virtual_machine_annual: 5000.0 },
                    baselines: { very_simple: 16.8, simple: 33.6, medium: 84, complex: 168, very_complex: 336 },
                    strategic_config: { genai_cost_per_transaction: 0.05, idp_license_annual: 5000, turnover_replacement_cost_percentage: 20 },
                    maintenance_config: { fte_monthly_cost: 8000, capacity_low: 90, capacity_medium: 70, capacity_high: 50 }
                };
            } else {
                data = settingsDoc.data();
            }

            globalCachedRates = data;
            globalLastCacheTime = now;
            return data;

        } catch (error) {
            console.error('Error fetching global rates:', error);
            throw new Error('Failed to fetch global configuration');
        }
    }

    /**
     * Calcula o custo AS-IS (situação atual)
     */
    calculateAsIsCost(inputs) {
        const { volume, aht, fteCost, errorRate = 0 } = inputs;
        // Custo por minuto do FTE (assumindo 160h/mês = 9600min/mês)
        const costPerMinute = fteCost / 9600;
        // Custo AS-IS Anual (Operacional apenas)
        // Inclui custo de retrabalho (errorRate)
        const asIsCost = (volume * aht * 12) * costPerMinute * (1 + errorRate / 100);
        return Math.round(asIsCost * 100) / 100;
    }

    /**
     * Calcula o custo de desenvolvimento (CAPEX)
     * Nova Fórmula (v2): Soma( (Percentual_Perfil * 168) * Valor_Hora_Perfil )
     * Onde 168 é a base de horas mensal fixa.
     */
    calculateDevelopmentCost(teamComposition, complexityLevel) {
        // Fallback se não houver composição definida
        if (!teamComposition || teamComposition.length === 0) {
            return 0;
        }

        let totalCost = 0;
        let totalHours = 0;
        const levelKey = complexityLevel.toLowerCase(); // very_simple, simple, etc.

        teamComposition.forEach(member => {
            // Obtém a porcentagem de participação para a complexidade atual
            let share = 0;
            if (member.shares && typeof member.shares === 'object') {
                share = member.shares[levelKey] !== undefined ? Number(member.shares[levelKey]) : 0;
            } else if (member.share !== undefined) {
                share = Number(member.share);
            }

            // Calcula horas do perfil: Share * 168
            const roleHours = share * 168;

            // Calcula custo do perfil: Horas * Taxa
            const roleCost = roleHours * member.rate;

            totalCost += roleCost;
            totalHours += roleHours;
        });

        return {
            cost: Math.round(totalCost * 100) / 100,
            hours: Math.round(totalHours * 100) / 100
        };
    }

    /**
     * Calcula o período de payback em meses
     */
    calculatePayback(developmentCost, monthlySavings) {
        if (monthlySavings <= 0) return null; // Nunca haverá payback
        const months = developmentCost / monthlySavings;
        return Math.round(months * 10) / 10;
    }

    /**
     * Calcula todos os indicadores financeiros (Enterprise)
     */
    async calculateFullROI(inputs, complexity, strategic = {}, maintenance = {}) {
        // 1. Carregar configurações do banco
        const config = await this.getGlobalRates();
        const strategicConfig = config.strategic_config || {
            genai_cost_per_transaction: 0.05,
            idp_license_annual: 5000,
            turnover_replacement_cost_percentage: 20
        };
        const maintenanceConfig = config.maintenance_config || {
            fte_monthly_cost: 8000,
            capacity_low: 90,
            capacity_medium: 70,
            capacity_high: 50
        };

        // 2. Calcular complexidade
        const complexityService = new ComplexityService();
        const complexityScore = complexityService.calculateComplexityScore(complexity);

        // 3. Custo de Desenvolvimento e Horas Totais (Calculado dinamicamente)
        const teamComp = config.team_composition || [];
        const devResult = this.calculateDevelopmentCost(teamComp, complexityScore.classification);

        const developmentCost = devResult.cost;
        const totalHours = devResult.hours;

        // 4. Custo AS-IS (Atual) - Base Operacional
        let asIsCost = this.calculateAsIsCost(inputs);

        // --- Strategic Adjustments to AS-IS ---
        let riskCost = 0;
        let turnoverCost = 0;

        // SLA: Se 24/7, multiplica custo operacional por 3 (3 turnos)
        if (strategic.needs24h) {
            asIsCost = asIsCost * 3;
        }

        // Compliance Risk (Custo do Erro)
        if (strategic.errorCost > 0) {
            // Volume anual * Taxa de erro * Custo da multa
            riskCost = (inputs.volume * 12) * (inputs.errorRate / 100) * strategic.errorCost;
        }

        // Turnover Cost (Soft Savings)
        if (strategic.turnoverRate > 0) {
            // Estimativa: % do salário anual por contratação/treinamento (Default 20%)
            const turnoverPercentage = (strategicConfig.turnover_replacement_cost_percentage || 20) / 100;

            // FTE Count = (Volume * AHT) / 9600
            const fteCount = (inputs.volume * inputs.aht) / 9600;
            // Custo Turnover = (Custo Anual * %Reposição) * (Turnover% / 100) * FTE Count
            turnoverCost = (inputs.fteCost * 12 * turnoverPercentage) * (strategic.turnoverRate / 100) * fteCount;
        }

        // Adiciona custos estratégicos ao AS-IS total (pois a automação elimina/reduz isso)
        const totalAsIsCost = asIsCost + riskCost + turnoverCost;


        // 5. Custo TO-BE (Licenças + Infra + Manutenção)
        // Garante fallback de custos de infra
        const infraCosts = config.infra_costs || {
            rpa_license_annual: 15000,
            virtual_machine_annual: 5000,
            database_annual: 0
        };

        let annualInfraCost = Object.values(infraCosts).reduce((a, b) => a + b, 0);

        // --- Strategic Adjustments to TO-BE ---
        let genAiCost = 0;
        let idpCost = 0;

        // GenAI Cost
        if (strategic.cognitiveLevel === 'creation') {
            // Custo por transação configurável
            const costPerTransaction = strategicConfig.genai_cost_per_transaction || 0.05;
            genAiCost = (inputs.volume * 12) * costPerTransaction;
        }

        // IDP Cost
        if (strategic.inputVariability === 'always' || complexity.dataType === 'ocr') {
            // Licença adicional de IDP configurável
            idpCost = strategicConfig.idp_license_annual || 5000;
        }

        // --- Maintenance Cost Calculation (Automated via Settings) ---
        let maintenanceCost = 0;
        let capacityDivisor = maintenanceConfig.capacity_medium; // Default

        // Ajuste de capacidade baseado na complexidade
        if (complexityScore.classification === 'VERY_SIMPLE' || complexityScore.classification === 'SIMPLE') {
            capacityDivisor = maintenanceConfig.capacity_low; // Alta capacidade (mais robôs por FTE)
        } else if (complexityScore.classification === 'VERY_COMPLEX' || complexityScore.classification === 'COMPLEX') {
            capacityDivisor = maintenanceConfig.capacity_high; // Baixa capacidade (menos robôs por FTE)
        }

        if (maintenanceConfig.fte_monthly_cost && capacityDivisor) {
            // Custo Mensal Fracionado = Custo FTE / Capacidade
            // Custo Anual = Mensal * 12
            maintenanceCost = (maintenanceConfig.fte_monthly_cost / capacityDivisor) * 12;
        } else {
            // Fallback: 15% do custo de desenvolvimento
            maintenanceCost = developmentCost * 0.15;
        }

        const totalToBeCost = annualInfraCost + maintenanceCost + genAiCost + idpCost;

        // 6. ROI e Payback
        const annualSavings = totalAsIsCost - totalToBeCost;
        // ROI = (Economia Anual / Custo AS-IS Anual) * 100
        const roi = (annualSavings / totalAsIsCost) * 100;
        const monthlySavings = annualSavings / 12;
        const paybackMonths = this.calculatePayback(developmentCost, monthlySavings);

        return {
            complexity: {
                score: complexityScore.totalPoints,
                classification: complexityScore.classification,
                hours: { totalHours }
            },
            strategic: {
                riskCost,
                turnoverCost,
                genAiCost,
                idpCost,
                slaMultiplier: strategic.needs24h ? 3 : 1
            },
            maintenance: {
                monthlyCost: maintenanceCost / 12,
                annualCost: maintenanceCost,
                fteCost: maintenanceConfig.fte_monthly_cost || 0,
                capacityDivisor: capacityDivisor || 0
            },
            costs: {
                asIs: {
                    annual: totalAsIsCost,
                    operational: asIsCost,
                    risk: riskCost,
                    turnover: turnoverCost,
                    monthly: Math.round((totalAsIsCost / 12) * 100) / 100
                },
                development: developmentCost,
                toBe: {
                    licenseCost: infraCosts.rpa_license_annual,
                    infraCost: infraCosts.virtual_machine_annual + (infraCosts.database_annual || 0),
                    maintenanceCost,
                    genAiCost,
                    idpCost,
                    totalToBeCost,
                    annual: totalToBeCost
                },
            },
            roi: {
                year1: Math.round(roi * 100) / 100,
                annualSavings: Math.round(annualSavings * 100) / 100,
                monthlySavings: Math.round(monthlySavings * 100) / 100,
                paybackMonths,
            },
        };
    }
}

export { ComplexityService, FinancialService };