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

    // Recalcula as baselines e custos sempre que a composição do time mudar
    useEffect(() => {
        if (settings && settings.team_composition) {
            const { baselines, costs } = calculateBaselinesAndCostsFromTeam(settings.team_composition);

            setSettings(prev => ({
                ...prev,
                baselines: baselines,
                calculated_costs: costs // Novo campo no estado local
            }));
        }
    }, [settings?.team_composition]);

    const calculateBaselinesAndCostsFromTeam = (team) => {
        const complexities = ['very_simple', 'simple', 'medium', 'complex', 'very_complex'];
        const baselines = {};
        const costs = {};

        complexities.forEach(key => {
            let totalHours = 0;
            let totalCost = 0;

            team.forEach(member => {
                const share = parseFloat(member.shares?.[key]) || 0;
                const rate = parseFloat(member.rate) || 0;

                // Fórmula Horas: Share * 168
                const hours = share * 168;

                // Fórmula Custo: Horas * Rate
                const cost = hours * rate;

                totalHours += hours;
                totalCost += cost;
            });

            baselines[key] = Math.round(totalHours * 100) / 100;
            costs[key] = Math.round(totalCost * 100) / 100;
        });

        return { baselines, costs };
    };

    const loadSettings = async () => {
        try {
            const response = await settingsService.getSettings();
            const actualData = response.data || {};

            // Normaliza a composição do time para o novo formato (shares por complexidade)
            const normalizedTeam = (actualData.team_composition || []).map(member => {
                const shares = member.shares || {
                    very_simple: member.share || 0,
                    simple: member.share || 0,
                    medium: member.share || 0,
                    complex: member.share || 0,
                    very_complex: member.share || 0
                };
                return {
                    role: member.role || 'Novo Cargo',
                    rate: Number(member.rate) || 0,
                    shares: shares
                };
            });

            // Calcula baselines e custos iniciais
            const { baselines, costs } = calculateBaselinesAndCostsFromTeam(normalizedTeam);

            const safeSettings = {
                team_composition: normalizedTeam,
                infra_costs: {
                    rpa_license_annual: actualData.infra_costs?.rpa_license_annual || 0,
                    virtual_machine_annual: actualData.infra_costs?.virtual_machine_annual || 0,
                    database_annual: actualData.infra_costs?.database_annual || 0
                },
                baselines: baselines,
                calculated_costs: costs, // Inicializa custos
                maintenance_config: actualData.maintenance_config || {
                    fte_monthly_cost: 8000,
                    capacity_low: 90,
                    capacity_medium: 70,
                    capacity_high: 50
                },
                strategic_config: actualData.strategic_config || {
                    genai_cost_per_transaction: 0.05,
                    turnover_replacement_cost_percentage: 20,
                    roi_accuracy_percentage: 100
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
            shares: {
                very_simple: Number(member.shares?.very_simple) || 0,
                simple: Number(member.shares?.simple) || 0,
                medium: Number(member.shares?.medium) || 0,
                complex: Number(member.shares?.complex) || 0,
                very_complex: Number(member.shares?.very_complex) || 0
            }
        }));

        const cleanInfra = {
            rpa_license_annual: Number(data.infra_costs?.rpa_license_annual) || 0,
            virtual_machine_annual: Number(data.infra_costs?.virtual_machine_annual) || 0,
            database_annual: Number(data.infra_costs?.database_annual) || 0
        };

        // Baselines são recalculadas apenas para salvar, custos não precisam ir pro banco (são derivados)
        const { baselines } = calculateBaselinesAndCostsFromTeam(cleanTeam);

        const cleanMaintenance = {
            fte_monthly_cost: Number(data.maintenance_config?.fte_monthly_cost) || 8000,
            capacity_low: Number(data.maintenance_config?.capacity_low) || 90,
            capacity_medium: Number(data.maintenance_config?.capacity_medium) || 70,
            capacity_high: Number(data.maintenance_config?.capacity_high) || 50
        };

        const cleanStrategic = {
            genai_cost_per_transaction: Number(data.strategic_config?.genai_cost_per_transaction) || 0.05,
            idp_license_annual: Number(data.strategic_config?.idp_license_annual) || 5000,
            turnover_replacement_cost_percentage: Number(data.strategic_config?.turnover_replacement_cost_percentage) || 20,
            roi_accuracy_percentage: Number(data.strategic_config?.roi_accuracy_percentage) || 100
        };

        return {
            team_composition: cleanTeam,
            infra_costs: cleanInfra,
            baselines: baselines,
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
            // Ao salvar, atualizamos o estado com o que foi limpo, mas precisamos recalcular os custos para exibição
            const { costs } = calculateBaselinesAndCostsFromTeam(cleanSettings.team_composition);
            setSettings({ ...cleanSettings, calculated_costs: costs });

            setMessage({ type: 'success', text: 'Configurações e parâmetros salvos com sucesso!' });
        } catch (error) {
            console.error("Erro no salvamento:", error);
            setMessage({ type: 'error', text: 'Erro ao salvar.' });
        } finally {
            setSaving(false);
        }
    };

    // --- Manipuladores ---
    const handleRoleChange = (index, field, value, complexityKey = null) => {
        const newTeam = [...settings.team_composition];
        if (complexityKey) {
            newTeam[index].shares = {
                ...newTeam[index].shares,
                [complexityKey]: value
            };
        } else {
            newTeam[index][field] = value;
        }
        // A atualização do estado disparará o useEffect para recalcular baselines
        setSettings({ ...settings, team_composition: newTeam });
    };

    const handleAddRole = () => {
        setSettings(prev => ({
            ...prev,
            team_composition: [...prev.team_composition, {
                role: 'Novo Cargo',
                rate: 0,
                shares: { very_simple: 0, simple: 0, medium: 0, complex: 0, very_complex: 0 }
            }]
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

    if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (!settings) return <Box p={4}><Alert severity="error">Erro ao carregar configurações.</Alert></Box>;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    return (
        <Container maxWidth="xl">
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#1a237e' }}>
                Configurações Globais
            </Typography>

            {message && <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>{message.text}</Alert>}

            {/* SEÇÃO 1: SQUAD E CUSTOS DE PESSOAL */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                        <Typography variant="h6">1. Composição da Squad (Matriz de Participação)</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Defina o percentual de alocação de cada perfil (base 168h) para cada complexidade.
                            <br />
                            Ex: 0.5 = 50% de 168h = 84h.
                        </Typography>
                    </Box>
                    <Button variant="outlined" startIcon={<PersonAdd />} onClick={handleAddRole} size="small">
                        Adicionar Cargo
                    </Button>
                </Box>

                <TableContainer sx={{ mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell width="20%">Perfil / Cargo</TableCell>
                                <TableCell width="10%">Custo/h (R$)</TableCell>
                                <TableCell align="center">M. Simples</TableCell>
                                <TableCell align="center">Simples</TableCell>
                                <TableCell align="center">Média</TableCell>
                                <TableCell align="center">Complexa</TableCell>
                                <TableCell align="center">M. Complexa</TableCell>
                                <TableCell width="5%" align="center">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {settings.team_composition.map((member, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <TextField fullWidth variant="standard" value={member.role} onChange={(e) => handleRoleChange(index, 'role', e.target.value)} />
                                    </TableCell>
                                    <TableCell>
                                        <TextField fullWidth type="number" variant="standard" value={member.rate} onChange={(e) => handleRoleChange(index, 'rate', e.target.value)} />
                                    </TableCell>
                                    {['very_simple', 'simple', 'medium', 'complex', 'very_complex'].map((key) => (
                                        <TableCell key={key} align="center">
                                            <TextField
                                                fullWidth
                                                type="number"
                                                variant="standard"
                                                inputProps={{ style: { textAlign: 'center' } }}
                                                value={member.shares[key]}
                                                onChange={(e) => handleRoleChange(index, 'shares', e.target.value, key)}
                                                placeholder="0.0"
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell align="center">
                                        <IconButton size="small" color="error" onClick={() => handleDeleteRole(index)}><Delete /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* SEÇÃO 2: PARÂMETROS DE ESTIMATIVA (HORAS) - READONLY */}
            <Paper elevation={3} sx={{ p: 4, mb: 4, bgcolor: '#f8f9fa' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Functions color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">2. Parâmetros de Estimativa (Horas Calculadas)</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Volume total de horas calculado automaticamente: <strong>Σ (Percentual × 168h)</strong>.
                </Typography>

                <Grid container spacing={3}>
                    {['very_simple', 'simple', 'medium', 'complex', 'very_complex'].map((key) => {
                        const labels = {
                            very_simple: 'Muito Simples',
                            simple: 'Simples',
                            medium: 'Média',
                            complex: 'Complexa',
                            very_complex: 'Muito Complexa'
                        };
                        return (
                            <Grid item xs={12} md={2} key={key}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        fullWidth
                                        label={labels[key]}
                                        value={settings.baselines[key]}
                                        InputProps={{ readOnly: true, endAdornment: <Typography variant="caption">h</Typography> }}
                                        variant="filled"
                                    />
                                    <TextField
                                        fullWidth
                                        label="Valor Estimado"
                                        value={formatCurrency(settings.calculated_costs?.[key])}
                                        InputProps={{ readOnly: true, style: { fontWeight: 'bold', color: '#2e7d32' } }}
                                        variant="outlined"
                                        size="small"
                                    />
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* CARD EXPLICATIVO DA MEMÓRIA DE CÁLCULO */}
                <Box sx={{ mt: 4, p: 3, bgcolor: '#e3f2fd', borderRadius: 2, borderLeft: '4px solid #1976d2' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <HelpOutline color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold" color="primary">
                            Como o Sistema Calcula o Investimento?
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        <Grid item xs={12} md={7}>
                            <Typography variant="body2" paragraph>
                                O sistema multiplica o percentual de cada perfil por <strong>168 horas</strong> (base mensal) para encontrar as horas dedicadas.
                                Em seguida, multiplica pelo valor hora do perfil.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip label="Base Mensal: 168h" size="small" color="primary" variant="outlined" />
                                <Chip label="Custo = Horas × Rate" size="small" color="primary" variant="outlined" />
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <Typography variant="body2" paragraph>
                                <strong>Fórmula do CAPEX:</strong>
                            </Typography>
                            <Box sx={{ fontFamily: 'monospace', bgcolor: 'white', p: 1.5, borderRadius: 1, mb: 2, border: '1px dashed #90caf9', fontSize: '0.85rem' }}>
                                Σ ((%Perfil × 168) × Taxa_Perfil)
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {/* CARD EXPLICATIVO DA MATRIZ DE COMPLEXIDADE */}
                <Box sx={{ mt: 4, p: 3, bgcolor: '#fff3e0', borderRadius: 2, borderLeft: '4px solid #ed6c02' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Functions color="warning" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold" color="warning.main">
                            Matriz de Classificação de Complexidade (Sistema de Pontos)
                        </Typography>
                    </Box>
                    <Typography variant="body2" paragraph>
                        A complexidade é determinada pela soma de pontos de 4 critérios técnicos.
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Critérios de Pontuação:</Typography>
                            <Table size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                                <TableBody>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>1. Nº Aplicações</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>Até 2 (+1) | Até 4 (+2) | 5+ (+3)</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>2. Tipo de Dados</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>Estruturado (+1) | Texto (+2) | OCR/Imagem (+5)</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>3. Ambiente</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>Web (+1) | SAP/ERP (+2) | Citrix/Remoto (+4)</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>4. Nº Passos</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>&lt;20 (+1) | 20-50 (+3) | &gt;50 (+5)</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Faixas de Classificação:</Typography>
                            <Table size="small" sx={{ bgcolor: 'white', borderRadius: 1 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Pontos Totais</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>Nível Resultante</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>&lt; 6 pontos</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}><Chip label="MUITO SIMPLES" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>6 a 8 pontos</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}><Chip label="SIMPLES" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>9 a 11 pontos</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}><Chip label="MÉDIA" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>12 a 14 pontos</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}><Chip label="COMPLEXA" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontSize: '0.75rem' }}>&gt; 14 pontos</TableCell>
                                        <TableCell sx={{ fontSize: '0.75rem' }}><Chip label="MUITO COMPLEXA" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} /></TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
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
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Custo GenAI por Transação" type="number"
                            value={settings.strategic_config?.genai_cost_per_transaction || 0.05}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                strategic_config: { ...prev.strategic_config, genai_cost_per_transaction: e.target.value }
                            }))}
                            InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 1 }}>R$</Typography> }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Licença Anual IDP" type="number"
                            value={settings.strategic_config?.idp_license_annual || 5000}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                strategic_config: { ...prev.strategic_config, idp_license_annual: e.target.value }
                            }))}
                            InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 1 }}>R$</Typography> }}
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
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Deflator de Acurácia (ROI)" type="number"
                            value={settings.strategic_config?.roi_accuracy_percentage || 100}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                strategic_config: { ...prev.strategic_config, roi_accuracy_percentage: e.target.value }
                            }))}
                            helperText="Percentual de confiança aplicado à economia projetada (ex: 90%)"
                            InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 1 }}>%</Typography> }}
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