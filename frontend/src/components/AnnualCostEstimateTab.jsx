import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Grid, TextField, Divider, Chip, Tooltip, InputAdornment, Button, CircularProgress, Alert, Snackbar
} from '@mui/material';
import { HelpOutline, Assignment, MonetizationOn, AccessTime, TrendingUp, Settings as SettingsIcon, Save } from '@mui/icons-material';
import { settingsService } from '../services/api';

export default function AnnualCostEstimateTab() {
    // 1) Entradas informadas (State)
    const [baseAnnualCost, setBaseAnnualCost] = useState(70000);
    const [robots24h, setRobots24h] = useState(33);
    const [robots12h, setRobots12h] = useState(18);
    const [markupMargin, setMarkupMargin] = useState(100);
    const [growthPerMonth, setGrowthPerMonth] = useState(15);

    // Status states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

    // Derivados simples
    const totalCurrentRobots = Number(robots24h) + Number(robots12h);

    // Cálculos - 3) Base de minutos
    const minutesPerYear24h = 24 * 60 * 365; // 525.600
    const minutesPerMonth24h = minutesPerYear24h / 12; // 43.800

    const minutesPerYear12h = 12 * 60 * 365; // 262.800
    const minutesPerMonth12h = minutesPerYear12h / 12; // 21.900

    const totalMinutesYear24h = robots24h * minutesPerYear24h;
    const totalMinutesYear12h = robots12h * minutesPerYear12h;
    const totalMinutesYear = totalMinutesYear24h + totalMinutesYear12h;

    // Cálculos - 4) Rateio
    const costPerMinute = totalMinutesYear > 0 ? baseAnnualCost / totalMinutesYear : 0;
    const costPerHour = costPerMinute * 60;

    const priceMultiplier = 1 + (markupMargin / 100); // 100% margin -> 2x multiplier
    const pricePerMinute = costPerMinute * priceMultiplier;
    const pricePerHour = costPerHour * priceMultiplier;

    // Cálculos - 5) Custo/preço por robô
    // Sem margem
    const costRobot24hYear = minutesPerYear24h * costPerMinute;
    const costRobot24hMonth = costRobot24hYear / 12;

    const costRobot12hYear = minutesPerYear12h * costPerMinute;
    const costRobot12hMonth = costRobot12hYear / 12;

    // Com margem
    const priceRobot24hYear = minutesPerYear24h * pricePerMinute;
    const priceRobot24hMonth = priceRobot24hYear / 12;

    const priceRobot12hYear = minutesPerYear12h * pricePerMinute;
    const priceRobot12hMonth = priceRobot12hYear / 12;

    // Cálculos - 6 e 7) Projeção de crescimento
    const botMonthsCurrent = Array.from({ length: 12 }, (_, i) => totalCurrentRobots + (i * growthPerMonth));
    const totalBotMonthsYear = botMonthsCurrent.reduce((acc, curr) => acc + curr, 0);
    const avgRobotsYear = totalBotMonthsYear / 12;

    const avgCostPerRobotCurrentYear = totalCurrentRobots > 0 ? baseAnnualCost / totalCurrentRobots : 0;
    const avgPricePerRobotCurrentYear = avgCostPerRobotCurrentYear * priceMultiplier;
    const avgCostPerRobotCurrentMonth = avgCostPerRobotCurrentYear / 12;

    // Projeções Totais (Unitário Constante)
    const projectedAnnualCost = avgCostPerRobotCurrentMonth * totalBotMonthsYear;
    const projectedAnnualRevenue = projectedAnnualCost * priceMultiplier;

    // Persistência com Firebase
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await settingsService.getSettings();
            if (response.success && response.data?.annual_cost_estimate) {
                const est = response.data.annual_cost_estimate;
                if (est.baseAnnualCost !== undefined) setBaseAnnualCost(Number(est.baseAnnualCost));
                if (est.robots24h !== undefined) setRobots24h(Number(est.robots24h));
                if (est.robots12h !== undefined) setRobots12h(Number(est.robots12h));
                if (est.markupMargin !== undefined) setMarkupMargin(Number(est.markupMargin));
                if (est.growthPerMonth !== undefined) setGrowthPerMonth(Number(est.growthPerMonth));
            }
        } catch (error) {
            console.error("Erro ao carregar dados de estimativa:", error);
            setFeedback({ open: true, message: 'Erro ao carregar configurações. Usando valores padrão.', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                annual_cost_estimate: {
                    baseAnnualCost,
                    robots24h,
                    robots12h,
                    markupMargin,
                    growthPerMonth,
                    projections: {
                        projectedAnnualCost,
                        projectedAnnualRevenue,
                        priceRobot24hMonth,
                        priceRobot12hMonth,
                        priceRobot24hYear,
                        priceRobot12hYear,
                        costRobot24hYear,
                        costRobot12hYear,
                        avgPricePerRobotCurrentYear
                    }
                }
            };

            const response = await settingsService.updateSettings(payload);

            if (response.success) {
                setFeedback({ open: true, message: 'Configurações e parâmetros salvos com sucesso!', severity: 'success' });
            } else {
                setFeedback({ open: true, message: 'Erro ao salvar. Tente novamente.', severity: 'error' });
            }
        } catch (error) {
            console.error("Erro ao salvar estimativa de custos:", error);
            setFeedback({ open: true, message: 'Ocorreu um erro técnico ao salvar.', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // Helpers de Formatação
    const formatCurrency = (val, maxDigits = 2) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: maxDigits }).format(val || 0);
    const formatNumber = (val) => new Intl.NumberFormat('pt-BR').format(val || 0);
    const formatPreciseNumber = (val) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 6, minimumFractionDigits: 6 }).format(val || 0);

    const handleCloseFeedback = () => setFeedback(prev => ({ ...prev, open: false }));

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* SEÇÃO DE ENTRADAS */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SettingsIcon />
                    <Typography variant="h6" sx={{ ml: 1 }}>1. Entradas e Premissas</Typography>
                </Box>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth label="Custo Anual Total (Base)" type="number"
                            value={baseAnnualCost}
                            onChange={(e) => setBaseAnnualCost(Number(e.target.value))}
                            InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth label="Qtd. Robôs 24h" type="number"
                            value={robots24h}
                            onChange={(e) => setRobots24h(Number(e.target.value))}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth label="Qtd. Robôs 12h" type="number"
                            value={robots12h}
                            onChange={(e) => setRobots12h(Number(e.target.value))}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <TextField
                            fullWidth label="Margem de Markup" type="number"
                            value={markupMargin}
                            onChange={(e) => setMarkupMargin(Number(e.target.value))}
                            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                            helperText="Ex: 100% = Preço x2"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth label="Projeção: Novos Robôs/Mês" type="number"
                            value={growthPerMonth}
                            onChange={(e) => setGrowthPerMonth(Number(e.target.value))}
                            helperText="Crescimento linear"
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* ROW 1: RATEIO E MEMÓRIA PARTE 1 */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
                {/* Rateio Custo/Minuto */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 3, height: '100%', bgcolor: '#f8f9fa' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AccessTime color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6">Métricas de Tempo (Rateio)</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Total Minutos Ano (Parque)</Typography>
                                <Typography variant="h6">{formatNumber(totalMinutesYear)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Total Atual de Robôs</Typography>
                                <Typography variant="h6">{totalCurrentRobots}</Typography>
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Custo / Minuto (Sem Margem)</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">R$ {formatPreciseNumber(costPerMinute)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Preço / Minuto (Com Margem)</Typography>
                                <Typography variant="subtitle1" fontWeight="bold" color="primary">R$ {formatPreciseNumber(pricePerMinute)}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Memória de Cálculo 1 */}
                <Grid item xs={12} md={6}>
                    <Box sx={{ height: '100%', p: 3, bgcolor: '#e3f2fd', borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <HelpOutline color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                Memória de Cálculo
                            </Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>1. Capacidade em Minutos</Typography>
                        <Box sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1.5, borderRadius: 1, mb: 2, border: '1px dashed #90caf9', fontSize: '0.85rem' }}>
                            Minutos/Ano (24h) = 24 × 60 × 365 = 525.600<br />
                            Minutos/Ano (12h) = 12 × 60 × 365 = 262.800<br />
                            Total Parque = (Qtd 24h × 525600) + (Qtd 12h × 262800)
                        </Box>

                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>2. Rateio Unitário</Typography>
                        <Box sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1.5, borderRadius: 1, mb: 2, border: '1px dashed #90caf9', fontSize: '0.85rem' }}>
                            Custo/Min = Custo Base Anual / Total Minutos do Parque<br />
                            Preço/Min = Custo/Min × (1 + (Margem / 100))
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {/* TABELA DE CUSTO/PREÇO POR PERFIL DE ROBÔ */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MonetizationOn color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Resumo por Perfil do Robô</Typography>
                </Box>
                <Grid container spacing={4}>
                    {/* Robô 24h */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Perfil: Operação 24h / 7 dias</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Custo Mês (Sem Margem)</Typography>
                                    <Typography variant="body1">{formatCurrency(costRobot24hMonth)}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Preço Mês (Com Margem)</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="primary">{formatCurrency(priceRobot24hMonth)}</Typography>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 1.5 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Custo Ano (Sem Margem)</Typography>
                                    <Typography variant="body2">{formatCurrency(costRobot24hYear)}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Preço Ano (Com Margem)</Typography>
                                    <Typography variant="body2" fontWeight="bold" color="primary">{formatCurrency(priceRobot24hYear)}</Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>
                    {/* Robô 12h */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Perfil: Operação 12h / dia</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Custo Mês (Sem Margem)</Typography>
                                    <Typography variant="body1">{formatCurrency(costRobot12hMonth)}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Preço Mês (Com Margem)</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="primary">{formatCurrency(priceRobot12hMonth)}</Typography>
                                </Grid>
                            </Grid>
                            <Divider sx={{ my: 1.5 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Custo Ano (Sem Margem)</Typography>
                                    <Typography variant="body2">{formatCurrency(costRobot12hYear)}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">Preço Ano (Com Margem)</Typography>
                                    <Typography variant="body2" fontWeight="bold" color="primary">{formatCurrency(priceRobot12hYear)}</Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* ROW 2: PROJEÇÃO E MEMÓRIA PARTE 2 */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
                {/* Projeção de Crescimento */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={3} sx={{ p: 3, height: '100%', bgcolor: '#f5f5f5' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <TrendingUp color="success" sx={{ mr: 1 }} />
                            <Typography variant="h6">Projeção Anual (Crescimento de +{growthPerMonth}/mês)</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Total Estimado "Bot-Mês" Ano</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{formatNumber(totalBotMonthsYear)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Média de Robôs no Ano</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{formatNumber(avgRobotsYear)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Custo Projetado Ano</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{formatCurrency(projectedAnnualCost)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Receita Projetada Ano (Alvo)</Typography>
                                <Typography variant="h5" fontWeight="bold" color="success.main">{formatCurrency(projectedAnnualRevenue)}</Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                            </Grid>

                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Custo Médio por Robô/Ano</Typography>
                                <Typography variant="subtitle1" fontWeight="bold">{formatCurrency(avgCostPerRobotCurrentYear)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Preço Médio por Robô/Ano</Typography>
                                <Typography variant="h5" fontWeight="bold" color="success.main">{formatCurrency(avgPricePerRobotCurrentYear)}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Memória de Cálculo 2 */}
                <Grid item xs={12} md={6}>
                    <Box sx={{ height: '100%', p: 3, bgcolor: '#e3f2fd', borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <HelpOutline color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                Memória de Cálculo
                            </Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>3. Custo por Robô no Mês</Typography>
                        <Box sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1.5, borderRadius: 1, mb: 2, border: '1px dashed #90caf9', fontSize: '0.85rem' }}>
                            Robô 24h (Ano) = 525.600 × Custo/Min<br />
                            Robô 24h (Mês) = Robô 24h (Ano) / 12<br />
                            (*Mesma lógica convertida para Preço/Min e Robôs 12h)
                        </Box>

                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>4. Modelo de Projeção</Typography>
                        <Box sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1.5, borderRadius: 1, mb: 2, border: '1px dashed #90caf9', fontSize: '0.85rem' }}>
                            Série = Qtd Atual + (Mês × Incremento)<br />
                            Total Bot-Mês = Soma da série (Mês 1 a 12)<br />
                            Custo Médio Robô/Mês = (Custo Base / Qtd Atual) / 12<br />
                            Receita Projetada = Total Bot-Mês × Custo Médio Robô/Mês × Margem
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
            </Box>

            <Snackbar
                open={feedback.open}
                autoHideDuration={6000}
                onClose={handleCloseFeedback}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseFeedback} severity={feedback.severity} sx={{ width: '100%' }}>
                    {feedback.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
