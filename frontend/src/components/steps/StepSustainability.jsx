import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Grid, Divider, List, ListItem, ListItemIcon, ListItemText, Alert, Chip, CircularProgress } from '@mui/material';
import { SupportAgent, AccessTime, Business, CheckCircle, Info, Engineering, Security } from '@mui/icons-material';
import { settingsService } from '../../services/api';

export default function StepSustainability({ data }) {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await settingsService.getSettings();
                setSettings(response.data?.maintenance_config || {
                    fte_monthly_cost: 8000,
                    capacity_low: 90,
                    capacity_medium: 70,
                    capacity_high: 50
                });
            } catch (error) {
                console.error("Erro ao carregar configurações:", error);
                // Fallback defaults if API fails
                setSettings({
                    fte_monthly_cost: 8000,
                    capacity_low: 90,
                    capacity_medium: 70,
                    capacity_high: 50
                });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const complexity = useMemo(() => {
        let points = 0;
        const { numApplications, dataType, environment, numSteps } = data.complexity;

        if (numApplications <= 2) points += 1;
        else if (numApplications <= 4) points += 2;
        else points += 3;

        if (dataType === 'structured') points += 1;
        else if (dataType === 'text') points += 2;
        else points += 5;

        if (environment === 'web') points += 1;
        else if (environment === 'sap') points += 2;
        else points += 4;

        if (numSteps < 20) points += 1;
        else if (numSteps <= 50) points += 3;
        else points += 5;

        if (points >= 12) return { level: 'HIGH', label: 'Alta' };
        if (points >= 7) return { level: 'MEDIUM', label: 'Média' };
        return { level: 'LOW', label: 'Baixa' };
    }, [data.complexity]);

    const calculations = useMemo(() => {
        if (!settings) return { monthly: 0, annual: 0, capacity: 1, fteCost: 0 };

        const fteCost = parseFloat(settings.fte_monthly_cost) || 8000;
        let capacity = parseFloat(settings.capacity_medium) || 70;

        if (complexity.level === 'LOW') capacity = parseFloat(settings.capacity_low) || 90;
        if (complexity.level === 'HIGH') capacity = parseFloat(settings.capacity_high) || 50;

        const monthly = fteCost / capacity;
        const annual = monthly * 12;

        return { monthly, annual, capacity, fteCost };
    }, [settings, complexity]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SupportAgent sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                    <Typography variant="h5" fontWeight={600}>
                        Proposta de Sustentação
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Entenda os custos e o escopo do serviço de manutenção para este robô.
                    </Typography>
                </Box>
            </Box>

            {/* Valores Previstos */}
            <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary.dark">
                            Investimento Previsto (Sustentação)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 4, mt: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Mensal
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="primary.main">
                                    {formatCurrency(calculations.monthly)}
                                </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Anual
                                </Typography>
                                <Typography variant="h4" fontWeight={700} color="primary.main">
                                    {formatCurrency(calculations.annual)}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Alert severity="info" icon={<Info fontSize="inherit" />}>
                            <Typography variant="body2">
                                Estes valores são <strong>proporcionais</strong> a uma contratação de sustentação mínima.
                                O cálculo baseia-se no compartilhamento de recursos (FTEs) conforme a complexidade do robô.
                            </Typography>
                        </Alert>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, p: 2, bgcolor: '#fff', borderRadius: 1, border: '1px dashed #cbd5e1' }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Base de Cálculo (Settings):</strong>
                        <br />
                        Para garantir a eficiência, um FTE de sustentação é dimensionado para suportar até:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                        <Chip
                            label={`${settings.capacity_low} Robôs de Baixa Complexidade`}
                            size="small"
                            color={complexity.level === 'LOW' ? "success" : "default"}
                            variant={complexity.level === 'LOW' ? "filled" : "outlined"}
                        />
                        <Chip
                            label={`${settings.capacity_medium} Robôs de Média Complexidade`}
                            size="small"
                            color={complexity.level === 'MEDIUM' ? "warning" : "default"}
                            variant={complexity.level === 'MEDIUM' ? "filled" : "outlined"}
                        />
                        <Chip
                            label={`${settings.capacity_high} Robôs de Alta Complexidade`}
                            size="small"
                            color={complexity.level === 'HIGH' ? "error" : "default"}
                            variant={complexity.level === 'HIGH' ? "filled" : "outlined"}
                        />
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.secondary' }}>
                        * Este robô foi classificado como <strong>{complexity.label} Complexidade</strong>, portanto utiliza 1/{calculations.capacity} da capacidade de um FTE.
                    </Typography>
                </Box>
            </Paper>

            {/* Escopo do Serviço */}
            <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Business color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight={600}>
                        Escopo Base do Serviço
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccessTime sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                        Atendimento 5x8 em Horário Comercial
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: 'success.main', display: 'flex', alignItems: 'center' }}>
                            <Engineering fontSize="small" sx={{ mr: 1 }} />
                            Incluso (Responsabilidade da Sustentação)
                        </Typography>
                        <List dense>
                            <ListItem alignItems="flex-start">
                                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                                <ListItemText
                                    primary="Suporte N2 (Incidentes)"
                                    secondary="Análise de falhas, reprocessamento de transações paradas e correções de bugs em produção."
                                />
                            </ListItem>
                            <ListItem alignItems="flex-start">
                                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                                <ListItemText
                                    primary="Suporte N3 (Evolutivo/Complexo)"
                                    secondary="Ajustes de código devido a mudanças nas aplicações alvo, atualizações de infraestrutura e melhorias de performance."
                                />
                            </ListItem>
                            <ListItem alignItems="flex-start">
                                <ListItemIcon><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                                <ListItemText
                                    primary="Monitoramento Proativo"
                                    secondary="Acompanhamento da saúde dos robôs e da infraestrutura."
                                />
                            </ListItem>
                        </List>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                            <Security fontSize="small" sx={{ mr: 1 }} />
                            Não Incluso (Responsabilidade do Cliente)
                        </Typography>
                        <List dense>
                            <ListItem alignItems="flex-start">
                                <ListItemIcon><Info fontSize="small" color="disabled" /></ListItemIcon>
                                <ListItemText
                                    primary="Suporte N1 (Negócio)"
                                    secondary="Primeiro atendimento, dúvidas de regra de negócio, validação de dados de entrada e gestão de acessos."
                                />
                            </ListItem>
                            <ListItem alignItems="flex-start">
                                <ListItemIcon><Info fontSize="small" color="disabled" /></ListItemIcon>
                                <ListItemText
                                    primary="Infraestrutura Física/Cloud"
                                    secondary="Custos de servidores, licenças de SO e banco de dados (salvo se contratado à parte)."
                                />
                            </ListItem>
                        </List>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}
