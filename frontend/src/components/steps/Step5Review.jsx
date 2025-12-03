// frontend/src/components/steps/Step5Review.jsx
import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Divider,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    CheckCircle,
    Business,
    TrendingUp,
    Settings,
    Psychology,
    Calculate,
    Info
} from '@mui/icons-material';
import { settingsService } from '../../services/api';

export default function Step5Review({ data }) {
    const [settings, setSettings] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsService.getSettings();
                setSettings(response.data);
            } catch (error) {
                console.error("Erro ao carregar configurações para revisão:", error);
            }
        };
        fetchSettings();
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const complexity = React.useMemo(() => {
        let points = 0;
        if (data.complexity.numApplications <= 2) points += 1;
        else if (data.complexity.numApplications <= 4) points += 2;
        else points += 3;

        if (data.complexity.dataType === 'structured') points += 1;
        else if (data.complexity.dataType === 'text') points += 2;
        else points += 5;

        if (data.complexity.environment === 'web') points += 1;
        else if (data.complexity.environment === 'sap') points += 2;
        else points += 4;

        if (data.complexity.numSteps < 20) points += 1;
        else if (data.complexity.numSteps <= 50) points += 3;
        else points += 5;

        if (points >= 12) return { level: 'ALTA', color: 'error' };
        if (points >= 7) return { level: 'MÉDIA', color: 'warning' };
        return { level: 'BAIXA', color: 'success' };
    }, [data.complexity]);

    // Estimativas para Memória de Cálculo (Sincronizado com Backend/Settings)
    const memory = React.useMemo(() => {
        const vol = parseFloat(data.inputs.volume) || 0;
        const errRate = parseFloat(data.inputs.errorRate) || 0;
        const errCost = parseFloat(data.strategic?.errorCost) || 0;
        const turnover = parseFloat(data.strategic?.turnoverRate) || 0;
        const fteCost = parseFloat(data.inputs.fteCost) || 0;
        const aht = parseFloat(data.inputs.aht) || 0;

        // Configurações Globais (Fallbacks)
        const genAiRate = settings?.strategic_config?.genai_cost_per_transaction || 0.05;
        const idpAnnual = settings?.strategic_config?.idp_license_annual || 5000;
        const turnoverReplacementPct = settings?.strategic_config?.turnover_replacement_cost_percentage || 20;

        // 1. Custo de Risco (Evitado)
        const riskCost = (vol * (errRate / 100)) * errCost;

        // 2. Soft Savings (Turnover)
        // Fórmula: (Custo Anual FTE * %Reposição) * (Turnover% / 100) * FTE Count
        const fteCount = (vol * aht) / 9600; // 9600 min/mês
        const turnoverSavings = (fteCost * 12 * (turnoverReplacementPct / 100)) * (turnover / 100) * fteCount;

        // 3. Multiplicador SLA
        const slaMultiplier = data.strategic?.needs24h ? 3 : 1;

        // 4. Custos Adicionais TO-BE
        let genAiCost = 0;
        if (data.strategic?.cognitiveLevel === 'creation') {
            genAiCost = vol * genAiRate;
        }

        let idpCost = 0;
        if (data.strategic?.inputVariability === 'always' || data.complexity.dataType === 'ocr') {
            idpCost = idpAnnual / 12; // Mostrando mensal para consistência visual
        }

        return { riskCost, turnoverSavings, slaMultiplier, genAiCost, idpCost, genAiRate, idpAnnual, turnoverReplacementPct };
    }, [data, settings]);

    const dataTypeLabels = {
        structured: 'Estruturados (Excel, CSV)',
        text: 'Texto/E-mail',
        ocr: 'Imagem/OCR',
    };

    const environmentLabels = {
        web: 'Web/Local',
        sap: 'SAP/Mainframe',
        citrix: 'Citrix/Remoto',
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
                <Box>
                    <Typography variant="h5" fontWeight={600}>
                        Revisão dos Dados
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Confira as informações antes de calcular o ROI
                    </Typography>
                </Box>
            </Box>

            {/* Informações do Projeto */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 2,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight={600}>
                        Informações do Projeto
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                            Nome do Projeto
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {data.projectName}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                            Responsável
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {data.responsibleName || data.ownerUid || 'Não informado'}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Cenário AS-IS */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 2,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUp color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight={600}>
                        Cenário AS-IS (Atual)
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                            Volume Mensal
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {parseFloat(data.inputs.volume).toLocaleString('pt-BR')} transações
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                            AHT
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {data.inputs.aht} minutos
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                            Custo FTE
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {formatCurrency(data.inputs.fteCost)}/mês
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                            Taxa de Erro
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {data.inputs.errorRate}%
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Complexidade */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 2,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Settings color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                        Análise de Complexidade
                    </Typography>
                    <Chip
                        label={`Complexidade: ${complexity.level}`}
                        color={complexity.color}
                        sx={{ fontWeight: 600 }}
                    />
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                            Nº de Aplicações
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {data.complexity.numApplications}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                            Tipo de Dados
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {dataTypeLabels[data.complexity.dataType]}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                            Ambiente
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {environmentLabels[data.complexity.environment]}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">
                            Nº de Passos
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {data.complexity.numSteps}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Estratégia & Cognitivo */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 2,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                    border: '1px solid #e0e0e0'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Psychology color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight={600}>
                        Estratégia & Cognitivo
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" color="text.secondary">
                            Nível Cognitivo
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {data.strategic?.cognitiveLevel === 'rule' && 'Regra Fixa'}
                            {data.strategic?.cognitiveLevel === 'interpretation' && 'Interpretação'}
                            {data.strategic?.cognitiveLevel === 'creation' && 'Criação (GenAI)'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" color="text.secondary">
                            Variabilidade
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {data.strategic?.inputVariability === 'never' && 'Baixa'}
                            {data.strategic?.inputVariability === 'occasionally' && 'Média'}
                            {data.strategic?.inputVariability === 'always' && 'Alta'}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" color="text.secondary">
                            Disponibilidade 24/7
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                            {data.strategic?.needs24h ? 'Sim' : 'Não'}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

            {/* Metodologia e Memória de Cálculo */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 2,
                    backgroundColor: '#f8fafc',
                    borderRadius: 2,
                    border: '1px dashed #94a3b8'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Calculate color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                        Memória de Cálculo (Estimativa)
                    </Typography>
                    <Tooltip title="Estes valores são calculados com base nos parâmetros definidos em Configurações Globais.">
                        <IconButton size="small" sx={{ ml: 1 }}>
                            <Info fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Baseado nos parâmetros estratégicos e nas <strong>Configurações Globais</strong>, o sistema considerará os seguintes impactos:
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <List dense>
                            <ListItem>
                                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                                <ListItemText
                                    primary="Custo de Risco Evitado"
                                    secondary={`${formatCurrency(memory.riskCost)} / mês (Multas e Perdas)`}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                                <ListItemText
                                    primary="Soft Savings (Turnover)"
                                    secondary={
                                        <span>
                                            {formatCurrency(memory.turnoverSavings)} / ano
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                (Baseado em {memory.turnoverReplacementPct}% do custo anual de reposição)
                                            </Typography>
                                        </span>
                                    }
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                                <ListItemText
                                    primary="Multiplicador de Turno (SLA)"
                                    secondary={memory.slaMultiplier > 1 ? `3x (Cobre 3 turnos de trabalho humano)` : '1x (Horário Comercial)'}
                                />
                            </ListItem>
                        </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <List dense>
                            <ListItem>
                                <ListItemIcon><Settings fontSize="small" color="action" /></ListItemIcon>
                                <ListItemText
                                    primary="Custo Estimado GenAI"
                                    secondary={
                                        memory.genAiCost > 0 ? (
                                            <span>
                                                {formatCurrency(memory.genAiCost)} / mês
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    ({formatCurrency(memory.genAiRate)} por transação - Configurações)
                                                </Typography>
                                            </span>
                                        ) : 'N/A (Não utiliza GenAI)'
                                    }
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemIcon><Settings fontSize="small" color="action" /></ListItemIcon>
                                <ListItemText
                                    primary="Custo Estimado IDP"
                                    secondary={
                                        memory.idpCost > 0 ? (
                                            <span>
                                                {formatCurrency(memory.idpCost)} / mês
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    (Licença Anual de {formatCurrency(memory.idpAnnual)} rateada)
                                                </Typography>
                                            </span>
                                        ) : 'N/A (Não utiliza IDP)'
                                    }
                                />
                            </ListItem>
                        </List>
                    </Grid>
                </Grid>
            </Paper>

            <Box
                sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: 'success.lighter',
                    borderLeft: 4,
                    borderColor: 'success.main',
                    borderRadius: 1,
                }}
            >
                <Typography variant="body2" color="success.dark">
                    <strong>Tudo pronto!</strong> Clique em "Calcular ROI" para processar os dados
                    e visualizar os resultados financeiros da automação.
                </Typography>
            </Box>
        </Box>
    );
}