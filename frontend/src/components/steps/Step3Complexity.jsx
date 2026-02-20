import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    MenuItem,
    Chip,
    InputAdornment,
    Tooltip,
    IconButton,
    Checkbox
} from '@mui/material';
import {
    Settings,
    Apps,
    Storage,
    Cloud,
    AccountTree,
    HelpOutline
} from '@mui/icons-material';

export default function Step3Complexity({ data, onChange }) {
    const handleChange = (field, value) => {
        onChange({
            ...data,
            [field]: value,
        });
    };

    const getComplexityEstimate = () => {
        let points = 0;

        // Número de aplicações
        if (data.numApplications <= 2) points += 1;
        else if (data.numApplications <= 4) points += 2;
        else points += 3;

        // Tipo de dados
        if (data.dataType === 'structured') points += 1;
        else if (data.dataType === 'text') points += 2;
        else points += 5;

        // Ambiente
        // Ambiente (Multi-seleção)
        const envs = Array.isArray(data.environment) ? data.environment : [data.environment];
        envs.forEach(env => {
            if (env === 'web') points += 1;
            else if (env === 'sap') points += 2;
            else if (env === 'citrix') points += 4;
            else points += 1; // Default fallback
        });

        // Passos
        if (data.numSteps < 20) points += 1;
        else if (data.numSteps <= 50) points += 3;
        else points += 5;

        // Customização (Sem Licença RPA)
        // Se for customizado (Python puro, etc), tende a ser mais complexo de manter/criar do zero sem framework, 
        // ou requer arquitetura mais robusta. Adiciona complexidade.
        if (data.useRpaLicense === 'no') {
            points += 3; // Penalidade de complexidade significativa
        }

        // Classificação (5 Níveis)
        if (points >= 14) return { level: 'MUITO COMPLEXA', color: 'error', label: 'Muito Complexa' };
        if (points >= 11) return { level: 'COMPLEXA', color: 'error', label: 'Complexa' }; // Usando error (vermelho) para alta complexidade
        if (points >= 8) return { level: 'MÉDIA', color: 'warning', label: 'Média' };
        if (points >= 6) return { level: 'SIMPLES', color: 'success', label: 'Simples' };
        return { level: 'MUITO SIMPLES', color: 'success', label: 'Muito Simples' };
    };

    const complexity = getComplexityEstimate();

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Settings sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" fontWeight={600}>
                        Análise de Complexidade
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Avalie as características técnicas da automação
                    </Typography>
                </Box>
                <Chip
                    label={`Complexidade: ${complexity.label}`}
                    color={complexity.color}
                    sx={{ fontWeight: 600 }}
                />
            </Box>

            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                }}
            >
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Número de Aplicações"
                            type="number"
                            value={data.numApplications}
                            onChange={(e) => handleChange('numApplications', e.target.value)}
                            required
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Apps color="action" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Tooltip title="Número de sistemas distintos que o robô precisará acessar (Ex: SAP, Excel, Site Web = 3)." arrow placement="top">
                                            <IconButton edge="end" size="small"><HelpOutline fontSize="small" color="action" /></IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }}
                            helperText="Quantos sistemas diferentes o robô irá integrar?"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            select
                            fullWidth
                            label="Tipo de Dados"
                            value={data.dataType}
                            onChange={(e) => handleChange('dataType', e.target.value)}
                            required
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Storage color="action" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ mr: 2 }}>
                                        <Tooltip title="Formato dos dados de entrada. Dados estruturados (Excel) são mais fáceis. Imagens (OCR) são mais complexas." arrow placement="top">
                                            <IconButton size="small" onMouseDown={(e) => e.stopPropagation()}>
                                                <HelpOutline fontSize="small" color="action" />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }}
                        >
                            <MenuItem value="structured">
                                <Box>
                                    <Typography variant="body1">Estruturados</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Excel, CSV, Banco de Dados
                                    </Typography>
                                </Box>
                            </MenuItem>
                            <MenuItem value="text">
                                <Box>
                                    <Typography variant="body1">Texto/E-mail</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Processamento de texto, e-mails
                                    </Typography>
                                </Box>
                            </MenuItem>
                            <MenuItem value="ocr">
                                <Box>
                                    <Typography variant="body1">Imagem/OCR</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Reconhecimento de caracteres, PDFs escaneados
                                    </Typography>
                                </Box>
                            </MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            select
                            fullWidth
                            label="Ambiente"
                            value={Array.isArray(data.environment) ? data.environment : [data.environment || 'web']}
                            onChange={(e) => handleChange('environment', e.target.value)}
                            required
                            SelectProps={{
                                multiple: true,
                                renderValue: (selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            let label = value;
                                            if (value === 'web') label = 'Web/Local';
                                            if (value === 'sap') label = 'SAP/Mainframe';
                                            if (value === 'citrix') label = 'Citrix/Remoto';
                                            return <Chip key={value} label={label} size="small" />;
                                        })}
                                    </Box>
                                )
                            }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Cloud color="action" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ mr: 2 }}>
                                        <Tooltip title="Onde o robô irá rodar. Selecione múltiplos se necessário (soma a complexidade)." arrow placement="top">
                                            <IconButton size="small" onMouseDown={(e) => e.stopPropagation()}>
                                                <HelpOutline fontSize="small" color="action" />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }}
                        >
                            <MenuItem value="web">
                                <Checkbox checked={Array.isArray(data.environment) ? data.environment.indexOf('web') > -1 : data.environment === 'web'} />
                                <Box>
                                    <Typography variant="body1">Web/Local</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Aplicações web ou desktop padrão
                                    </Typography>
                                </Box>
                            </MenuItem>
                            <MenuItem value="sap">
                                <Checkbox checked={Array.isArray(data.environment) ? data.environment.indexOf('sap') > -1 : data.environment === 'sap'} />
                                <Box>
                                    <Typography variant="body1">SAP/Mainframe</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Sistemas legados, SAP
                                    </Typography>
                                </Box>
                            </MenuItem>
                            <MenuItem value="citrix">
                                <Checkbox checked={Array.isArray(data.environment) ? data.environment.indexOf('citrix') > -1 : data.environment === 'citrix'} />
                                <Box>
                                    <Typography variant="body1">Citrix/Remoto</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Ambientes virtualizados, acesso remoto
                                    </Typography>
                                </Box>
                            </MenuItem>
                        </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Número de Passos/Regras"
                            type="number"
                            value={data.numSteps}
                            onChange={(e) => handleChange('numSteps', e.target.value)}
                            required
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><AccountTree color="action" /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Tooltip title="Quantidade aproximada de ações (cliques, digitações) ou regras de decisão no processo." arrow placement="top">
                                            <IconButton edge="end" size="small"><HelpOutline fontSize="small" color="action" /></IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }}
                            helperText="Quantos passos ou regras de negócio o processo possui?"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Uso de Licença RPA"
                            value="Sim (Licença Comercial)"
                            inputProps={{
                                readOnly: true,
                                startAdornment: <InputAdornment position="start"><Settings color="action" /></InputAdornment>
                            }}
                        />

                        {data.useRpaLicense === 'yes' && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', border: '1px dashed #ccc', borderRadius: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Custo da Licença (Proporcional)"
                                    type="number"
                                    size="small"
                                    value={data.rpaLicenseCost}
                                    onChange={(e) => handleChange('rpaLicenseCost', e.target.value)}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                    }}
                                    helperText={
                                        <span>
                                            Informe o valor anual de licença <strong>atribuído a este robô</strong>.
                                            <br />
                                            Recomendamos ajuda especializada para calcular o rateio correto (Ex: 1 licença de Run custa 20k, mas roda 4 robôs = 5k/robô).
                                            <br />
                                            Considerar 100% de margem em cima.
                                        </span>
                                    }
                                />
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            <Box
                sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: 'info.lighter',
                    borderLeft: 4,
                    borderColor: 'info.main',
                    borderRadius: 1,
                }}
            >
                <Typography variant="body2" color="info.dark">
                    <strong>Nota:</strong> A complexidade é calculada automaticamente (5 níveis: Muito Simples a Muito Complexa) com base
                    nestes critérios e impacta diretamente no tempo de desenvolvimento e custo
                    do projeto.
                </Typography>
            </Box>
        </Box>
    );
}
