import React from 'react';
import { Box, TextField, Typography, Paper, Grid, InputAdornment, Slider, Tooltip, IconButton } from '@mui/material';
import { TrendingUp, AccessTime, AttachMoney, ErrorOutline, Info, HelpOutline } from '@mui/icons-material';

export default function Step2AsIsInputs({ data, onChange }) {
    const handleChange = (field, value) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <TrendingUp sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                    <Typography variant="h5" fontWeight={600}>Análise do Processo (AS-IS)</Typography>
                    <Typography variant="body2" color="text.secondary">Detalhe as métricas operacionais para cálculo de baseline.</Typography>
                </Box>
            </Box>

            <Paper elevation={0} sx={{ p: 3, backgroundColor: 'grey.50', borderRadius: 2 }}>
                <Grid container spacing={3}>
                    {/* Seção 1: Volumetria */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>MÉTRICAS DE VOLUMETRIA</Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth label="Volume Mensal Médio" type="number"
                            value={data.volume} onChange={(e) => handleChange('volume', e.target.value)}
                            required
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><TrendingUp color="action" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Tooltip title="Quantidade média de processos executados do inicio ao fim no mês." arrow placement="top">
                                            <IconButton edge="end" size="small"><HelpOutline fontSize="small" color="action" /></IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }}
                            helperText="Total de processos executados por mês em média"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth label="Pico Sazonal (%)" type="number"
                            placeholder="0"
                            value={data.peakVolume || ''} onChange={(e) => handleChange('peakVolume', e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Typography variant="caption" sx={{ mr: 1 }}>%</Typography>
                                        <Tooltip title="Percentual de aumento de volume em períodos de pico (ex: Black Friday, Fechamento). Importante para dimensionar a capacidade do robô." arrow placement="top">
                                            <IconButton edge="end" size="small"><HelpOutline fontSize="small" color="action" /></IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }}
                            helperText="Quanto o volume aumenta em épocas de pico?"
                        />
                    </Grid>

                    {/* Seção 2: Tempo e Custo */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>TEMPO E CUSTO HUMANO</Typography>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="TMT (Tempo Médio Tratativa)" type="number"
                            value={data.aht} onChange={(e) => handleChange('aht', e.target.value)}
                            required
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><AccessTime color="action" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Typography variant="caption" sx={{ mr: 1 }}>min</Typography>
                                        <Tooltip title="Tempo médio que um humano leva para processar um único item do início ao fim." arrow placement="top">
                                            <IconButton edge="end" size="small"><HelpOutline fontSize="small" color="action" /></IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }}
                            helperText="Tempo por item (minutos)"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Custo Mensal FTE (Encargos)" type="number"
                            value={data.fteCost} onChange={(e) => handleChange('fteCost', e.target.value)}
                            required
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><AttachMoney color="action" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Typography variant="caption" sx={{ mr: 1 }}>R$</Typography>
                                        <Tooltip title="Custo total mensal de um funcionário (Salário + Encargos + Benefícios + Infraestrutura)." arrow placement="top">
                                            <IconButton edge="end" size="small"><HelpOutline fontSize="small" color="action" /></IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }}
                            helperText="Custo total do funcionário"
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth label="Crescimento Anual Esperado" type="number"
                            value={data.annualGrowth || ''} onChange={(e) => handleChange('annualGrowth', e.target.value)}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Typography variant="caption" sx={{ mr: 1 }}>%</Typography>
                                        <Tooltip title="Projeção de crescimento do volume para os próximos anos. O robô absorve esse crescimento sem custo linear." arrow placement="top">
                                            <IconButton edge="end" size="small"><HelpOutline fontSize="small" color="action" /></IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }}
                            helperText="Projeção de aumento de demanda"
                        />
                    </Grid>

                    {/* Seção 3: Qualidade */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle2" color="primary" sx={{ mr: 1 }}>QUALIDADE E RETRABALHO</Typography>
                            <Tooltip title="O retrabalho afeta diretamente o custo oculto. Automação tende a zerar isso.">
                                <IconButton size="small"><HelpOutline fontSize="small" color="action" /></IconButton>
                            </Tooltip>
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <ErrorOutline color="action" />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" gutterBottom>
                                    Taxa de Erro Humano / Retrabalho
                                    <Tooltip title="Porcentagem de itens que precisam ser refeitos devido a erros manuais." arrow placement="top">
                                        <IconButton size="small" sx={{ ml: 1 }}><HelpOutline fontSize="small" color="action" /></IconButton>
                                    </Tooltip>
                                </Typography>
                                <Slider
                                    value={parseFloat(data.errorRate) || 0}
                                    onChange={(e, value) => handleChange('errorRate', value)}
                                    min={0} max={20} step={0.5}
                                    marks={[{ value: 0, label: '0%' }, { value: 10, label: '10%' }, { value: 20, label: '20%' }]}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={(value) => `${value}%`}
                                />
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
}