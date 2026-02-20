// frontend/src/components/steps/Step1ProjectInfo.jsx
import React from 'react';
import {
    Box,
    TextField,
    Typography,
    Paper,
    InputAdornment,
    Tooltip,
    IconButton
} from '@mui/material';
import { Business, HelpOutline } from '@mui/icons-material';

export default function Step1ProjectInfo({ data, onChange }) {
    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Business sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box>
                    <Typography variant="h5" fontWeight={600}>
                        Informações do Projeto
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Identifique o projeto de automação
                    </Typography>
                </Box>
            </Box>

            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    backgroundColor: 'grey.50',
                    borderRadius: 2,
                }}
            >
                <TextField
                    fullWidth
                    label="Nome do Projeto"
                    placeholder="Ex: Automação de Faturamento Mensal"
                    value={data.projectName}
                    onChange={(e) => onChange('projectName', e.target.value)}
                    required
                    variant="outlined"
                    sx={{ mb: 3 }}
                    helperText="Dê um nome descritivo para este projeto de automação"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title="Nome único para identificar este projeto nos relatórios e dashboard." arrow placement="top">
                                    <IconButton edge="end" size="small">
                                        <HelpOutline fontSize="small" color="action" />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        )
                    }}
                />

                <TextField
                    fullWidth
                    label="Responsável (Opcional)"
                    placeholder="Ex: João Silva ou seu@email.com"
                    value={data.responsibleName || ''}
                    onChange={(e) => onChange('responsibleName', e.target.value)}
                    variant="outlined"
                    helperText="Nome ou E-mail do responsável (editável)"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title="Pessoa de contato ou dono do processo que será responsável pela automação." arrow placement="top">
                                    <IconButton edge="end" size="small">
                                        <HelpOutline fontSize="small" color="action" />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        )
                    }}
                />
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
                    <strong>Dica:</strong> Use um nome que facilite a identificação deste projeto
                    no futuro. Você poderá criar múltiplas simulações.
                </Typography>
            </Box>
        </Box>
    );
}