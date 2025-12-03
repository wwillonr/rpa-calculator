// frontend/src/components/Settings.jsx
import React, { useEffect, useState } from 'react';
import {
    Container, Paper, Typography, Grid, TextField, Button, Box, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, CircularProgress, Divider, Chip
} from '@mui/material';
import { Save, PersonAdd, Delete, Functions, HelpOutline, Settings as SettingsIcon, Psychology } from '@mui/icons-material';
import { settingsService } from '../services/api';

export default function Settings() {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        try {
            const response = await settingsService.getSettings();
            const actualData = response.data || {};

            const safeSettings = {
                team_composition: actualData.team_composition || [],
                infra_costs: {
                    rpa_license_annual: actualData.infra_costs?.rpa_license_annual || 0,
                    virtual_machine_annual: actualData.infra_costs?.virtual_machine_annual || 0,
                    database_annual: actualData.infra_costs?.database_annual || 0
                },
                baselines: actualData.baselines || { low: 104, medium: 208, high: 416 },
                maintenance_config: actualData.maintenance_config || {
                    fte_monthly_cost: 8000,
                    capacity_low: 90,
                    capacity_medium: 70,
                    capacity_high: 50
                },
                strategic_config: actualData.strategic_config || {
                    genai_cost_per_transaction: 0.05,
                    idp_license_annual: 5000,
                    turnover_replacement_cost_percentage: 20
                }
            };

            setSettings(safeSettings);
        } catch (error) {
            console.error("Erro ao carregar:", error);
            setMessage({ type: 'error', text: 'Erro ao carregar dados.' });
        } finally { setLoading(false); }
    };

    const sanitizePayload = (data) => {
        const cleanTeam = (data.team_composition || []).map(member => ({
            role: member.role || 'Novo Cargo',
            rate: Number(member.rate) || 0,
            share: Number(member.share) || 0
        }));

        const cleanInfra = {
            rpa_license_annual: Number(data.infra_costs?.rpa_license_annual) || 0,
            virtual_machine_annual: Number(data.infra_costs?.virtual_machine_annual) || 0,
            database_annual: Number(data.infra_costs?.database_annual) || 0
        };

        const cleanBaselines = {
            low: Number(data.baselines?.low) || 104,
            medium: Number(data.baselines?.medium) || 208,
            high: Number(data.baselines?.high) || 416
        };

        const cleanMaintenance = {
            fte_monthly_cost: Number(data.maintenance_config?.fte_monthly_cost) || 8000,
            capacity_low: Number(data.maintenance_config?.capacity_low) || 90,
            capacity_medium: Number(data.maintenance_config?.capacity_medium) || 70,
            capacity_high: Number(data.maintenance_config?.capacity_high) || 50
        };

        const cleanStrategic = {
            genai_cost_per_transaction: Number(data.strategic_config?.genai_cost_per_transaction) || 0.05,
            idp_license_annual: Number(data.strategic_config?.idp_license_annual) || 5000,
            turnover_replacement_cost_percentage: Number(data.strategic_config?.turnover_replacement_cost_percentage) || 20
        };

        return {
            team_composition: cleanTeam,
            infra_costs: cleanInfra,
            baselines: cleanBaselines,
            maintenance_config: cleanMaintenance,
            strategic_config: cleanStrategic
        };
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const cleanSettings = sanitizePayload(settings);
            await settingsService.updateSettings(cleanSettings);
            setSettings(cleanSettings);
            setMessage({ type: 'success', text: 'Configurações e parâmetros salvos com sucesso!' });
        } catch (error) {
            console.error("Erro no salvamento:", error);
            setMessage({ type: 'error', text: 'Erro ao salvar.' });
        } finally {
            setSaving(false);
        }
    };

    // --- Manipuladores ---
    const handleRoleChange = (index, field, value) => {
        const newTeam = [...settings.team_composition];
        if (field === 'role') { newTeam[index][field] = value; }
        else { newTeam[index][field] = value; }
        setSettings({ ...settings, team_composition: newTeam });
    };

    const handleAddRole = () => {
        setSettings(prev => ({
            ...prev,
            team_composition: [...prev.team_composition, { role: 'Novo Cargo', rate: 0, share: 0.0 }]
        }));
    };

    const handleDeleteRole = (index) => {
        setSettings(prev => ({
            ...prev,
            team_composition: prev.team_composition.filter((_, i) => i !== index)
        }));
    };

    const updateInfraCost = (field, value) => {
        setSettings(prev => ({
            ...prev,
            infra_costs: { ...prev.infra_costs, [field]: value }
        }));
    };

    const updateBaseline = (field, value) => {
        setSettings(prev => ({
            ...prev,
            baselines: { ...prev.baselines, [field]: value }
        }));
    };

    const getTotalShare = () => {
        if (!settings?.team_composition) return 0;
        return settings.team_composition.reduce((acc, curr) => acc + (parseFloat(curr.share) || 0), 0);
    };

    const getBlendedRate = () => {
        if (!settings?.team_composition) return 0;
        return settings.team_composition.reduce((acc, curr) => acc + ((parseFloat(curr.rate) || 0) * (parseFloat(curr.share) || 0)), 0);
    };

    if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (!settings) return <Box p={4}><Alert severity="error">Erro ao carregar configurações.</Alert></Box>;

    return (
        <Container maxWidth="lg">
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
                Configurações Globais
            </Typography>

            {message && <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

            {/* SEÇÃO 1: SQUAD E CUSTOS DE PESSOAL */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">1. Composição da Squad (Blended Rate)</Typography>
                    <Button variant="outlined" startIcon={<PersonAdd />} onClick={handleAddRole} size="small">
                        Adicionar Cargo
                    </Button>
                </Box>

                <TableContainer sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell>Perfil / Cargo</TableCell>
                                <TableCell width="20%">Custo Hora (R$)</TableCell>
                                <TableCell width="20%">Participação % (0.0 - 1.0)</TableCell>
                                <TableCell width="10%" align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {settings.team_composition.map((member, index) => (
                                <TableRow key={index}>
                                    <TableCell><TextField fullWidth variant="standard" value={member.role} onChange={(e) => handleRoleChange(index, 'role', e.target.value)} /></TableCell>
                                    <TableCell><TextField fullWidth type="number" variant="standard" value={member.rate} onChange={(e) => handleRoleChange(index, 'rate', e.target.value)} /></TableCell>
                                    <TableCell><TextField fullWidth type="number" step="0.1" variant="standard" value={member.share} onChange={(e) => handleRoleChange(index, 'share', e.target.value)} error={getTotalShare() > 1.01} /></TableCell>
                                    <TableCell align="center"><IconButton size="small" color="error" onClick={() => handleDeleteRole(index)}><Delete /></IconButton></TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell colSpan={2} align="right"><strong>Total Participação:</strong></TableCell>
                                <TableCell>
                                    <Typography color={Math.abs(getTotalShare() - 1) > 0.01 ? 'error' : 'success.main'} fontWeight="bold">
                                        {(getTotalShare() * 100).toFixed(0)}%
                                    </Typography>
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* SEÇÃO 2: PARÂMETROS DE ESTIMATIVA (HORAS) */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Functions color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">2. Parâmetros de Estimativa (Horas por Complexidade)</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Defina o volume de horas totais (Dev + Análise) estimado para cada nível de complexidade.
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Complexidade BAIXA" type="number"
                            value={settings.baselines.low}
                            onChange={(e) => updateBaseline('low', e.target.value)}
                            InputProps={{ endAdornment: <Typography variant="caption">horas</Typography> }}
                            helperText="4 a 6 pontos"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Complexidade MÉDIA" type="number"
                            value={settings.baselines.medium}
                            onChange={(e) => updateBaseline('medium', e.target.value)}
                            InputProps={{ endAdornment: <Typography variant="caption">horas</Typography> }}
                            helperText="7 a 11 pontos"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Complexidade ALTA" type="number"
                            value={settings.baselines.high}
                            onChange={(e) => updateBaseline('high', e.target.value)}
                            InputProps={{ endAdornment: <Typography variant="caption">horas</Typography> }}
                            helperText="12 ou mais pontos"
                        />
                    </Grid>
                </Grid>

                {/* CARD EXPLICATIVO DA MEMÓRIA DE CÁLCULO */}
                <Box sx={{ mt: 4, p: 3, bgcolor: '#e3f2fd', borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <HelpOutline color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                            Como o Sistema Decide a Complexidade?
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={7}>
                            <Typography variant="body2" paragraph>
                                A classificação (Baixa, Média, Alta) é determinada automaticamente somando pontos baseados nas respostas do formulário:
                            </Typography>
                            <Table size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Critério</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Regra de Pontuação</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Aplicações</TableCell>
                                        <TableCell>1-2 (1pt) | 3-4 (2pts) | 5+ (3pts)</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Tipo de Dados</TableCell>
                                        <TableCell>Estruturados (1pt) | Texto (2pts) | OCR (5pts)</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Ambiente</TableCell>
                                        <TableCell>Web/Local (1pt) | SAP (2pts) | Citrix (4pts)</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Passos/Regras</TableCell>
                                        <TableCell>&lt;20 (1pt) | 20-50 (3pts) | &gt;50 (5pts)</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <Typography variant="body2" paragraph>
                                <strong>Fórmula do Custo de Investimento:</strong>
                            </Typography>
                            <Box sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1.5, borderRadius: 1, mb: 2, border: '1px dashed #90caf9', fontSize: '0.85rem' }}>
                                Custo = Horas (conforme classificação) × Taxa Squad
                            </Box>

                            <Typography variant="body2" gutterBottom>
                                <strong>Taxa Atual da Squad:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(getBlendedRate())}/h
                            </Typography>

                            <Box sx={{ mt: 2 }}>
                                <Chip label="Baixa: 4-6 pts" size="small" color="success" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                                <Chip label="Média: 7-11 pts" size="small" color="warning" variant="outlined" sx={{ mr: 1, mb: 1 }} />
                                <Chip label="Alta: 12+ pts" size="small" color="error" variant="outlined" sx={{ mb: 1 }} />
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            {/* SEÇÃO 3: CUSTOS DE INFRA */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Typography variant="h6" gutterBottom>3. Custos de Infraestrutura & Licenças (Anual)</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Custos fixos recorrentes (OPEX) necessários para manter o robô rodando.
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Licença RPA (Bot Runner)" type="number"
                            value={settings.infra_costs.rpa_license_annual}
                            onChange={(e) => updateInfraCost('rpa_license_annual', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Servidor / VM" type="number"
                            value={settings.infra_costs.virtual_machine_annual}
                            onChange={(e) => updateInfraCost('virtual_machine_annual', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Banco de Dados / Storage" type="number"
                            value={settings.infra_costs.database_annual}
                            onChange={(e) => updateInfraCost('database_annual', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* SEÇÃO 4: PARÂMETROS DE SUSTENTAÇÃO (OPEX) */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SettingsIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">4. Parâmetros de Sustentação (OPEX)</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Defina o custo da equipe de sustentação e a capacidade de atendimento por complexidade.
                    O custo será fracionado: (Custo FTE / Capacidade) = Custo por Robô.
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth label="Custo Mensal FTE Sustentação" type="number"
                            value={settings.maintenance_config?.fte_monthly_cost || 8000}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                maintenance_config: { ...prev.maintenance_config, fte_monthly_cost: e.target.value }
                            }))}
                            InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 1 }}>R$</Typography> }}
                            helperText="Salário + Encargos"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth label="Capacidade (Baixa)" type="number"
                            value={settings.maintenance_config?.capacity_low || 90}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                maintenance_config: { ...prev.maintenance_config, capacity_low: e.target.value }
                            }))}
                            helperText="Robôs por FTE"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth label="Capacidade (Média)" type="number"
                            value={settings.maintenance_config?.capacity_medium || 70}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                maintenance_config: { ...prev.maintenance_config, capacity_medium: e.target.value }
                            }))}
                            helperText="Robôs por FTE"
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth label="Capacidade (Alta)" type="number"
                            value={settings.maintenance_config?.capacity_high || 50}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                maintenance_config: { ...prev.maintenance_config, capacity_high: e.target.value }
                            }))}
                            helperText="Robôs por FTE"
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* SEÇÃO 5: PARÂMETROS DE IA E ESTRATÉGIA */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Psychology color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">5. Parâmetros de IA e Estratégia</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Defina os custos unitários para tecnologias cognitivas e premissas de cálculo estratégico.
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Custo GenAI por Transação (Tokens)" type="number"
                            value={settings.strategic_config?.genai_cost_per_transaction || 0.05}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                strategic_config: { ...prev.strategic_config, genai_cost_per_transaction: e.target.value }
                            }))}
                            InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 1 }}>R$</Typography> }}
                            helperText="Custo médio de tokens LLM por item processado."
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Licença Anual IDP (OCR AI)" type="number"
                            value={settings.strategic_config?.idp_license_annual || 5000}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                strategic_config: { ...prev.strategic_config, idp_license_annual: e.target.value }
                            }))}
                            InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 1 }}>R$</Typography> }}
                            helperText="Custo fixo anual caso utilize IDP."
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Custo Reposição Turnover" type="number"
                            value={settings.strategic_config?.turnover_replacement_cost_percentage || 20}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                strategic_config: { ...prev.strategic_config, turnover_replacement_cost_percentage: e.target.value }
                            }))}
                            InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>%</Typography> }}
                            helperText="% do Salário Anual gasto para repor um funcionário."
                        />
                    </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        variant="contained"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        size="large"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Salvando...' : 'Salvar Todas as Configurações'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}