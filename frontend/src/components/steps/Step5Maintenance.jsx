// frontend/src/components/steps/Step5Maintenance.jsx
import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Grid, TextField, InputAdornment, Alert, Divider, Chip
} from '@mui/material';
import { Build, Engineering, Info } from '@mui/icons-material';
import { settingsService } from '../../services/api';

export default function Step5Maintenance({ data, onChange, complexityClassification }) {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const response = await settingsService.getSettings();
                const settings = response.data || {};
                const maintenance = settings.maintenance_config || {
                    fte_monthly_cost: 8000,
                    capacity_low: 90,
                    capacity_medium: 70,
                    capacity_high: 50
                };
                setConfig(maintenance);

                // Pre-fill data if empty
                if (!data.fteMonthlyCost) {
                    onChange('fteMonthlyCost', maintenance.fte_monthly_cost);
                }

                // Determine capacity based on complexity
                if (!data.capacityDivisor) {
                    let divisor = maintenance.capacity_medium;
                    if (complexityClassification === 'LOW') divisor = maintenance.capacity_low;
                    if (complexityClassification === 'HIGH') divisor = maintenance.capacity_high;
                    onChange('capacityDivisor', divisor);
                }

            } catch (error) {
                console.error("Erro ao carregar configs:", error);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, [complexityClassification]);

    const calculateMonthlyCost = () => {
        const cost = parseFloat(data.fteMonthlyCost) || 0;
        const divisor = parseFloat(data.capacityDivisor) || 1;
        return (cost / divisor).toFixed(2);
    };

    if (loading) return <Typography>Carregando parâmetros...</Typography>;

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ color: '#1a237e', display: 'flex', alignItems: 'center' }}>
                <Build sx={{ mr: 1 }} /> Sustentação e Manutenção
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Defina como será calculado o custo recorrente de suporte (AMS) para este robô.
                O modelo considera o fracionamento de um FTE (Full Time Equivalent) baseado na complexidade.
            </Typography>

            <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Engineering color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Parâmetros de Sustentação</Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Custo Mensal FTE Suporte"
                            type="number"
                            value={data.fteMonthlyCost}
                            onChange={(e) => onChange('fteMonthlyCost', e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                            }}
                            helperText="Custo total (salário + encargos) de um analista de sustentação."
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={`Capacidade (Robôs ${complexityClassification === 'HIGH' ? 'Alta' : complexityClassification === 'LOW' ? 'Baixa' : 'Média'} Complexidade)`}
                            type="number"
                            value={data.capacityDivisor}
                            onChange={(e) => onChange('capacityDivisor', e.target.value)}
                            helperText={`Quantos robôs desta complexidade 1 FTE consegue suportar? (Sugerido: ${complexityClassification === 'HIGH' ? config.capacity_high :
                                    complexityClassification === 'LOW' ? config.capacity_low : config.capacity_medium
                                })`}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px dashed #94a3b8' }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Custo Estimado de Sustentação para este Robô:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                        <Typography variant="h4" color="primary" fontWeight="bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateMonthlyCost())}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            / mês
                        </Typography>
                    </Box>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Fórmula: (Custo FTE R$ {data.fteMonthlyCost}) ÷ ({data.capacityDivisor} Robôs)
                    </Typography>
                </Box>
            </Paper>

            <Alert severity="info" icon={<Info />}>
                Este valor será adicionado ao OPEX mensal do projeto para cálculo do ROI.
                Robôs mais complexos exigem mais horas de suporte, reduzindo a capacidade do FTE e aumentando o custo unitário.
            </Alert>
        </Box>
    );
}
