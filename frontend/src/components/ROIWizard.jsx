// frontend/src/components/ROIWizard.jsx
import React, { useState, useEffect } from 'react';
import {
    Box, Stepper, Step, StepLabel, Button, Typography, Paper, Container,
    CircularProgress, Alert, useTheme, useMediaQuery, Chip
} from '@mui/material';
import { NavigateNext, NavigateBefore, Calculate, Refresh, Person } from '@mui/icons-material';
import Step1ProjectInfo from './steps/Step1ProjectInfo';
import Step2AsIsInputs from './steps/Step2AsIsInputs';
import Step3Complexity from './steps/Step3Complexity';
import Step4Strategic from './steps/Step4Strategic';
import Step5Review from './steps/Step5Review';
import { projectService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const steps = ['Projeto', 'Cenário', 'Complexidade', 'Estratégia', 'Revisão'];

export default function ROIWizard({ onComplete }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { currentUser } = useAuth();

    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estado do formulário
    const [formData, setFormData] = useState({
        projectName: '',
        ownerUid: '', // ID oculto (para o banco)
        responsibleName: '', // Nome visível (para a tela)
        inputs: {
            volume: '',
            aht: '',
            fteCost: '',
            errorRate: 0,
            annualGrowth: 0,
            peakVolume: 0
        },
        complexity: {
            numApplications: 1,
            dataType: 'structured',
            environment: 'web',
            numSteps: 10,
        },
        strategic: {
            cognitiveLevel: 'rule',
            inputVariability: 'never',
            errorCost: '',
            needs24h: false,
            turnoverRate: ''
        }
    });

    // Preenche o nome visível com o email e guarda o UID escondido
    useEffect(() => {
        if (currentUser) {
            setFormData(prev => ({
                ...prev,
                ownerUid: currentUser.uid,
                // Se o campo estiver vazio, sugere o email do usuário logado
                responsibleName: prev.responsibleName || currentUser.email
            }));
        }
    }, [currentUser]);

    const handleNext = () => {
        setError(null);
        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setError(null);
        setActiveStep((prev) => prev - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setError(null);
        setFormData({
            projectName: '',
            ownerUid: currentUser ? currentUser.uid : '',
            responsibleName: currentUser ? currentUser.email : '',
            inputs: {
                volume: '',
                aht: '',
                fteCost: '',
                errorRate: 0,
                annualGrowth: 0,
                peakVolume: 0
            },
            complexity: {
                numApplications: 1,
                dataType: 'structured',
                environment: 'web',
                numSteps: 10,
            },
            strategic: {
                cognitiveLevel: 'rule',
                inputVariability: 'never',
                errorCost: '',
                needs24h: false,
                turnoverRate: ''
            }
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            // Garante o ID correto no momento do envio
            const finalOwnerUid = currentUser ? currentUser.uid : (formData.ownerUid || 'anonymous');

            const payload = {
                projectName: formData.projectName,
                ownerUid: finalOwnerUid,
                // Opcional: Você pode salvar o responsibleName no banco se quiser exibir depois
                // responsible_name: formData.responsibleName, 
                inputs: {
                    volume: parseFloat(formData.inputs.volume) || 0,
                    aht: parseFloat(formData.inputs.aht) || 0,
                    fteCost: parseFloat(formData.inputs.fteCost) || 0,
                    errorRate: parseFloat(formData.inputs.errorRate) || 0,
                    annualGrowth: parseFloat(formData.inputs.annualGrowth) || 0,
                    peakVolume: parseFloat(formData.inputs.peakVolume) || 0
                },
                complexity: {
                    numApplications: parseInt(formData.complexity.numApplications) || 1,
                    dataType: formData.complexity.dataType || 'structured',
                    environment: formData.complexity.environment || 'web',
                    numSteps: parseInt(formData.complexity.numSteps) || 10,
                },
                strategic: {
                    cognitiveLevel: formData.strategic.cognitiveLevel || 'rule',
                    inputVariability: formData.strategic.inputVariability || 'never',
                    errorCost: parseFloat(formData.strategic.errorCost) || 0,
                    needs24h: formData.strategic.needs24h || false,
                    turnoverRate: parseFloat(formData.strategic.turnoverRate) || 0
                }
            };

            if (payload.inputs.volume <= 0 || payload.inputs.aht <= 0 || payload.inputs.fteCost <= 0) {
                throw new Error("Valores de volume, tempo e custo devem ser maiores que zero.");
            }

            console.log("Enviando projeto...", payload);

            const response = await projectService.createProject(payload);

            if (response && response.success && response.data) {
                onComplete(response.data);
            } else {
                throw new Error('O servidor não retornou os dados completos do projeto.');
            }
        } catch (err) {
            console.error('Error submitting project:', err);
            setError(err.message || 'Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const isStepValid = () => {
        switch (activeStep) {
            case 0: return formData.projectName.trim().length > 0;
            case 1: return (formData.inputs.volume > 0 && formData.inputs.aht > 0 && formData.inputs.fteCost > 0);
            case 2: return (formData.complexity.numApplications > 0 && formData.complexity.numSteps > 0);
            case 3: return true;
            case 4: return true;
            default: return false;
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0: return <Step1ProjectInfo data={formData} onChange={updateFormData} />;
            case 1: return <Step2AsIsInputs data={formData.inputs} onChange={(value) => updateFormData('inputs', value)} />;
            case 2: return <Step3Complexity data={formData.complexity} onChange={(value) => updateFormData('complexity', value)} />;
            case 3: return <Step4Strategic data={formData.strategic} onChange={(value) => updateFormData('strategic', value)} />;
            case 4: return <Step5Review data={formData} />;
            default: return <Typography>Passo desconhecido</Typography>;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4, px: isMobile ? 1 : 3 }}>

            <Paper elevation={3} sx={{ p: isMobile ? 3 : 4, borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom fontWeight={700}>
                            Nova Simulação
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            Preencha os dados abaixo para calcular o ROI
                        </Typography>
                    </Box>
                    {/* Indicador visual de quem está logado */}
                    {currentUser && (
                        <Chip
                            icon={<Person sx={{ fill: 'white' }} />}
                            label="Logado"
                            color="success"
                            variant="outlined"
                            sx={{ color: 'white', borderColor: 'white' }}
                        />
                    )}
                </Box>
            </Paper>

            <Paper elevation={2} sx={{ p: isMobile ? 2 : 4, borderRadius: 2 }}>
                <Stepper activeStep={activeStep} alternativeLabel={isMobile} sx={{ mb: 4 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ minHeight: isMobile ? 300 : 400 }}>
                    {renderStepContent(activeStep)}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, flexDirection: isMobile ? 'column-reverse' : 'row', gap: 2 }}>
                    <Button
                        disabled={activeStep === 0 || loading}
                        onClick={handleBack}
                        startIcon={<NavigateBefore />}
                        variant="outlined"
                        fullWidth={isMobile}
                        size={isMobile ? "large" : "medium"}
                    >
                        Voltar
                    </Button>

                    <Box sx={{ display: 'flex', gap: 2, width: isMobile ? '100%' : 'auto' }}>
                        {activeStep === steps.length - 1 ? (
                            <>
                                {!isMobile && (
                                    <Button onClick={handleReset} variant="outlined" disabled={loading} startIcon={<Refresh />}>
                                        Reiniciar
                                    </Button>
                                )}

                                <Button
                                    onClick={handleSubmit}
                                    variant="contained"
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Calculate />}
                                    disabled={loading}
                                    fullWidth={isMobile}
                                    size={isMobile ? "large" : "medium"}
                                    sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                                >
                                    {loading ? 'Calculando...' : 'Calcular ROI'}
                                </Button>
                            </>
                        ) : (
                            <Button
                                onClick={handleNext}
                                variant="contained"
                                endIcon={<NavigateNext />}
                                disabled={!isStepValid()}
                                fullWidth={isMobile}
                                size={isMobile ? "large" : "medium"}
                            >
                                Próximo
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}