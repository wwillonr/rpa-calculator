// frontend/src/components/ResultsDashboard.jsx
import React, { useRef, useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Chip, Divider, Button, Container, Tooltip as MuiTooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, List, ListItem, ListItemIcon, ListItemText, LinearProgress
} from '@mui/material';
import {
    TrendingUp, AttachMoney, Schedule, Assessment, Refresh, Download, Info, Description, CheckCircle, Settings, Psychology, CalendarToday, SupportAgent, AccessTime, Business, Engineering, Security
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ReferenceLine, ReferenceDot, Label
} from 'recharts';

// Importações para PDF
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// 1. IMPORTAR O CONTEXTO DE AUTH E API
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/api';
import Step5Review from './steps/Step5Review';


export default function ResultsDashboard({ data, onNewCalculation }) {
    const dashboardRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [deliveryPlan, setDeliveryPlan] = useState([]);
    const [loadingPlan, setLoadingPlan] = useState(true);
    const [maintenanceConfig, setMaintenanceConfig] = useState(null);

    // 2. PEGAR O USUÁRIO LOGADO
    const { currentUser } = useAuth();

    // Carregar configurações para calcular o plano de entrega
    useEffect(() => {
        const calculateDeliveryPlan = async () => {
            try {
                let teamComposition = [];
                const response = await settingsService.getSettings();
                teamComposition = response.data?.team_composition || [];
                setMaintenanceConfig(response.data?.maintenance_config);

                const complexityKey = data.complexity_score?.classification?.toLowerCase() || 'simple';

                const getHoursForRoles = (keywords) => {
                    let totalHours = 0;
                    teamComposition.forEach(member => {
                        const roleName = member.role.toLowerCase();
                        const matches = keywords.some(k => roleName.includes(k));
                        if (matches) {
                            const share = member.shares?.[complexityKey] || 0;
                            totalHours += share * 168;
                        }
                    });
                    return totalHours;
                };

                const reqHours = getHoursForRoles(['funcional', 'analista', 'business', 'po', 'product']);

                // Lógica customizada para Desenvolvimento: Considera apenas Dev Pleno (exclui Senior) para paralelismo
                const getDevDurationDays = () => {
                    let totalFTEs = 0;
                    let hasDev = false;

                    teamComposition.forEach(member => {
                        const roleName = member.role.toLowerCase();
                        const isDev = ['dev', 'desenvolvedor', 'rpa', 'programador'].some(k => roleName.includes(k));
                        const isSenior = ['senior', 'sênior', 'sr'].some(k => roleName.includes(k));

                        if (isDev) {
                            hasDev = true;
                            if (!isSenior) {
                                const share = member.shares?.[complexityKey] || 0;
                                totalFTEs += share;
                            }
                        }
                    });

                    // Fallback: Se não houver Pleno (só Senior), usa o total de horas de dev
                    if (totalFTEs === 0 && hasDev) {
                        const allDevHours = getHoursForRoles(['dev', 'desenvolvedor', 'rpa', 'programador']);
                        totalFTEs = allDevHours / 168;
                    }

                    const totalHours = totalFTEs * 168;
                    // Cálculo: (Horas / 40) = Semanas. Arredonda para baixo.
                    const weeks = Math.floor(totalHours / 40);
                    // Retorna dias úteis (5 dias por semana)
                    return Math.max(weeks * 5, 1);
                };

                const devDays = getDevDurationDays();
                const testHours = getHoursForRoles(['test', 'qa', 'homolog']);
                const hyperHours = getHoursForRoles(['hyper', 'care', 'sustenta', 'suporte']);

                const reqDays = Math.max(Math.ceil(reqHours / 8), 1);
                const testDays = Math.max(Math.ceil(testHours / 8), 1);
                const hyperDays = Math.max(Math.ceil(hyperHours / 8), 1);

                let currentDay = 0;
                const plan = [];

                plan.push({ phase: 'Levantamento de Requisitos', role: 'An. Funcional', start: currentDay, duration: reqDays, color: '#2196f3' });
                currentDay += reqDays;

                plan.push({ phase: 'Aprovação Doc. Funcional', role: 'Stakeholders', start: currentDay, duration: 1, color: '#9c27b0' });
                currentDay += 1;

                plan.push({ phase: 'Desenvolvimento', role: 'Dev. Pleno/Sênior', start: currentDay, duration: devDays, color: '#ff9800' });
                currentDay += devDays;

                plan.push({ phase: 'Testes (UAT/QA)', role: 'Tester Pleno', start: currentDay, duration: testDays, color: '#f44336' });
                currentDay += testDays;

                plan.push({ phase: 'Implantação em Produção', role: 'DevOps/Infra', start: currentDay, duration: 1, color: '#4caf50' });
                currentDay += 1;

                plan.push({ phase: 'Hyper Care (Acompanhamento)', role: 'Sustentação', start: currentDay, duration: hyperDays, color: '#00bcd4' });
                currentDay += hyperDays;

                setDeliveryPlan(plan);

            } catch (error) {
                console.error("Erro ao calcular plano de entrega:", error);
            } finally {
                setLoadingPlan(false);
            }
        };

        calculateDeliveryPlan();
    }, [data]);

    const formatCurrency = (value) => {
        if (isNaN(value)) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value);
    };

    const formatNumber = (value) => {
        if (value === Infinity) return '∞';
        if (isNaN(value)) return '0';
        return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
    };

    // Lógica para exibir o nome correto do responsável
    const getResponsibleName = () => {
        if (data.responsible_name) return data.responsible_name;
        if (currentUser && data.owner_uid === currentUser.uid) {
            return currentUser.email;
        }
        return data.owner_uid || 'Anônimo';
    };

    const results = data.results;
    const complexity = data.complexity_score;
    const inputs = data.inputs_as_is;
    const strategic = data.strategic_analysis || {};
    const strategicInput = data.strategic_input || {};
    const maintenanceAnalysis = data.maintenance_analysis || {};

    // --- CÁLCULO DO ROI (Fórmula Revisada) ---
    // Formula: ([Economia Anual (Ano1 + 2 x Ano2+)] / [Custo AS-IS x 3]) * Acuracia (Deflator) * 100
    // Opex Exemption: Se 'isento', Ano 2+ considera economia = AsIs (sem descontar Opex)

    const isExempt = (data.opex_exemption || data.opexExemption || 'isento') === 'isento';

    // Simplificando variáveis para uso geral
    const asIs = results.as_is_cost_annual || 0;
    const toBe = results.to_be_cost_annual || 0;
    const devCost = results.development_cost || 0;

    const savingsYear2Plus = isExempt ? asIs : (asIs - toBe);

    const calculateRoi = () => {
        const accuracy = (strategic.accuracyPercentage || 100) / 100;
        const asIs3Years = asIs * 3;

        // CAPEX = devCost
        // OPEX Anual = toBe

        let totalTotalCost; // Denominador e redutor do numerador

        if (isExempt) {
            // Regra: (((custo AS-IS dos 3 anos) - (CAPEX + OPEX do ano 1))/ (CAPEX + OPEX do ano 1)) * Acuracidade * 100
            totalTotalCost = devCost + toBe;
        } else {
            // Regra: (((custo AS-IS dos 3 anos) - (CAPEX + OPEX dos 3 anos))/ (CAPEX + OPEX dos 3 anos)) * Acuracidade * 100
            totalTotalCost = devCost + (toBe * 3);
        }

        if (totalTotalCost === 0) return 0;

        return ((asIs3Years - totalTotalCost) / totalTotalCost) * accuracy * 100;
    };
    const calculatedRoi = calculateRoi();

    // Dados gráficos
    // Calcular Custeio TO-BE Ponderado (Deflator de acurácia)
    // Se não houver economia bruta (savings < 0), o ponderado tende ao TO-BE normal ou pior.
    // Mas a lógica é: Weighted Savings = GrossSavings * Accuracy.
    // Weighted ToBe = AsIs - WeightedSavings.
    const accuracyFactor = (strategic.accuracyPercentage || 100) / 100;
    const grossSavings = results.as_is_cost_annual - results.to_be_cost_annual;
    const weightedSavings = grossSavings * accuracyFactor;
    const weightedToBeAnnual = results.as_is_cost_annual - weightedSavings;

    // Dados achatados para o gráfico de colunas (3 colunas distintas)
    const costComparisonData = [
        { name: 'AS-IS (Atual)', value: results.as_is_cost_annual, color: '#f44336' }, // Vermelho para Custo Alto
        { name: 'TO-BE (Estimado)', value: results.to_be_cost_annual, color: '#2196f3' }, // Azul para Custo Otimizado
        { name: 'TO-BE (Ponderado)', value: weightedToBeAnnual, color: '#ff9800' } // Laranja para Ponderado (Risco/Acurácia)
    ];

    const toBeCostBreakdown = [
        { name: 'Licenças', value: results.cost_breakdown.licenseCost },
        { name: 'Infraestrutura', value: results.cost_breakdown.infraCost },
        { name: 'Manutenção', value: results.cost_breakdown.maintenanceCost },
    ];

    if (strategic.genAiCost > 0) toBeCostBreakdown.push({ name: 'GenAI (Tokens)', value: strategic.genAiCost });
    if (strategic.idpCost > 0) toBeCostBreakdown.push({ name: 'IDP (OCR)', value: strategic.idpCost });

    // --- LÓGICA DO PAYBACK (Breakeven Chart) ---
    // Gráfico de Custo Acumulado: AS-IS vs TO-BE
    const paybackData = [];
    const monthlyAsIs = results.as_is_cost_annual / 12;
    // Se isento, OPEX mensal no payback (que olha pro futuro) deveria ser 0 após o primeiro ano? 
    // O pedido diz: "inclua o opex mensal para avaliar o mês onde ocorrerá o breakeven".
    // Assumindo que o OPEX incide desde o início (Mês 1) para efeitos de cálculo de payback clássico.
    // Mas se houver isenção no Ano 2+, isso altera a curva a partir do mês 13.
    // Para simplificar e atender "Mês onde Economia Acumulada > [CAPEX + (OPEX ANUAL/12)]", vamos simular mês a mês.

    const capex = results.development_cost;
    const monthlyOpex = results.to_be_cost_annual / 12;

    // Projetar 36 meses (3 anos) para visualizar a curva
    const monthsToProject = 36;

    let calculatedPaybackMonth = 0;
    let foundPayback = false;

    // Variáveis acumuladoras
    let accSavings = 0;
    let accSavingsWeighted = 0;
    let accCosts = capex; // Começa com o investimento inicial

    for (let month = 1; month <= monthsToProject; month++) {
        // Economia MENSAL (Potencial) = Custo Manual Mensal
        const currentMonthAsIs = monthlyAsIs;

        // Economia MENSAL (Ponderada/Real) = Economia Potencial * Acurácia
        // Se a acurácia é 90%, significa que 10% ainda é gasto manualmente para corrigir erros?
        // Sim, Accuracy Deflator penaliza a "Economia".
        // Portanto, linha de "Economia Real" é menor.
        const accuracy = (strategic.accuracyPercentage || 100) / 100;
        const currentMonthAsIsWeighted = currentMonthAsIs * accuracy;

        accSavings += currentMonthAsIs;
        accSavingsWeighted += currentMonthAsIsWeighted; // Nova variável acumuladora

        // Custo MENSAL do Robô = OPEX / 12 (com regra de isenção)
        let currentMonthOpex = monthlyOpex;
        if (isExempt && month > 12) {
            currentMonthOpex = 0;
        }

        accCosts += currentMonthOpex;

        // Verifica Breakeven (Usando a Economia Ponderada como referência conservadora? Ou Potencial?)
        // O padrão geralmente é comparar com o benefício real esperado (Ponderado).
        // Se não houver instrução contrária, usaremos a economia ponderada p/ ser mais realista.
        // Mas p/ manter consistencia com o texto "Economia Acumulada > Capex...", usaremos a principal (Potencial) para a métrica oficial, 
        // e a visualização mostrará a diferença.

        // Vamos manter o cálculo oficial baseado na ECONOMIA POTENCIAL (regra do step anterior),
        // mas a linha ponderada e a label "Deflator" estarão lá para análise visual.
        // Vamos manter o cálculo oficial baseado na ECONOMIA POTENCIAL (regra do step anterior),
        // mas a linha ponderada e a label "Deflator" estarão lá para análise visual.
        if (!foundPayback && accSavings >= accCosts) {
            calculatedPaybackMonth = month;
            foundPayback = true;
        }

        paybackData.push({
            month: month,
            accSavings: accSavings,
            accSavingsWeighted: accSavingsWeighted,
            accCosts: accCosts,
            netResult: accSavings - accCosts
        });
    }

    // --- CÁLCULO PRECISO DO PAYBACK (Conforme solicitação: 4.2 meses) ---
    // Formula: (CAPEX + OPEX Anual) / (Economia Mensal Bruta * Acurácia)
    const accuracy = (strategic.accuracyPercentage || 100) / 100;
    const monthlyAsIsWeighted = monthlyAsIs * accuracy;

    // Evitar divisão por zero
    let precisePayback = 0;
    if (monthlyAsIsWeighted > 0) {
        precisePayback = (capex + results.to_be_cost_annual) / monthlyAsIsWeighted;
    }

    // Forçar atualização do resultado para usar no render
    // Se quiser exibir no card de ROI (header), precisamos garantir que a variável esteja disponível lá.
    // O header usa: {formatNumber(results.payback_months)}
    // Vamos substituir por precisePayback lá também.

    const COLORS = ['#667eea', '#764ba2', '#f093fb', '#ff9800', '#e91e63'];

    const getComplexityColor = (classification) => {
        if (classification === 'VERY_COMPLEX' || classification === 'COMPLEX') return 'error';
        if (classification === 'MEDIUM') return 'warning';
        return 'success';
    };

    const getComplexityLabel = (classification) => {
        const map = {
            'VERY_SIMPLE': 'MUITO SIMPLES',
            'SIMPLE': 'SIMPLES',
            'MEDIUM': 'MÉDIA',
            'COMPLEX': 'COMPLEXA',
            'VERY_COMPLEX': 'MUITO COMPLEXA'
        };
        return map[classification] || classification;
    };

    // --- FUNÇÃO DE EXPORTAÇÃO PDF COM QUEBRA DE PÁGINA INTELIGENTE ---
    const handleExportPDF = async () => {
        if (!dashboardRef.current) return;
        setIsExporting(true);

        try {
            const originalElement = dashboardRef.current;

            // 1. Criar um clone para manipular (evita alterações visuais para o usuário)
            const clone = originalElement.cloneNode(true);

            // Copiar o conteúdo dos canvas (gráficos) manualmente, pois cloneNode não copia o estado do contexto 2D
            const originalCanvases = originalElement.querySelectorAll('canvas');
            const cloneCanvases = clone.querySelectorAll('canvas');
            originalCanvases.forEach((canvas, index) => {
                const dest = cloneCanvases[index];
                if (dest) {
                    const ctx = dest.getContext('2d');
                    ctx.drawImage(canvas, 0, 0);
                }
            });

            // Configurar o clone para ser renderizado fora da tela, mas com a mesma largura
            const contentWidth = originalElement.scrollWidth;
            clone.style.width = `${contentWidth}px`;
            clone.style.position = 'absolute';
            clone.style.top = '-9999px';
            clone.style.left = '-9999px';
            // Importante: manter o background para o html2canvas capturar corretamente
            clone.style.backgroundColor = '#f5f7fa';
            document.body.appendChild(clone);

            // 2. Calcular altura da página A4 em pixels
            // A4: 210mm largura, 297mm altura. Ratio = 1.414
            // A altura da página em pixels depende da largura do conteúdo renderizado
            const a4Ratio = 297 / 210;
            const pageHeightPx = contentWidth * a4Ratio;

            // 3. Inserir espaçadores para evitar cortes
            const sections = clone.querySelectorAll('.pdf-section');
            let currentHeight = 0;

            // Adicionar padding inicial do container se houver
            const containerStyle = window.getComputedStyle(originalElement);
            currentHeight += parseFloat(containerStyle.paddingTop) || 0;

            sections.forEach((section) => {
                // Altura do elemento + margens
                const style = window.getComputedStyle(section);
                const marginTop = parseFloat(style.marginTop) || 0;
                const marginBottom = parseFloat(style.marginBottom) || 0;
                const sectionHeight = section.offsetHeight;
                const elementTotalHeight = sectionHeight + marginTop + marginBottom;

                // Posição atual na página (resto da divisão pela altura da página)
                const positionOnPage = currentHeight % pageHeightPx;

                // Se o elemento vai cruzar a quebra de página
                if (positionOnPage + elementTotalHeight > pageHeightPx) {
                    // Se o elemento for menor que uma página inteira, empurra para a próxima
                    if (elementTotalHeight < pageHeightPx) {
                        const spacerHeight = pageHeightPx - positionOnPage;

                        // Adiciona margem extra ao topo do elemento para empurrá-lo
                        // Precisamos somar à margem já existente
                        section.style.marginTop = `${marginTop + spacerHeight}px`;

                        // Atualiza a altura atual considerando o espaçador
                        currentHeight += spacerHeight;
                    }
                }

                currentHeight += elementTotalHeight;
            });

            // 4. Gerar Canvas a partir do Clone modificado
            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                windowWidth: contentWidth,
                windowHeight: clone.scrollHeight // Altura ajustada com espaçadores
            });

            // 5. Remover o clone
            document.body.removeChild(clone);

            // 6. Gerar PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`ROI_Report_${data.project_name || 'Project'}.pdf`);

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente.');
        } finally {
            setIsExporting(false);
        }
    };

    const reviewData = {
        projectName: data.project_name,
        responsibleName: getResponsibleName(),
        ownerUid: data.owner_uid,
        inputs: {
            volume: data.inputs_as_is.volume,
            aht: data.inputs_as_is.aht,
            fteCost: data.inputs_as_is.fte_cost,
            errorRate: data.inputs_as_is.error_rate
        },
        complexity: data.complexity_input || {},
        strategic: data.strategic_input || {},
        opexExemption: data.opex_exemption || data.opexExemption // Passando a isenção para o review
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f5f7fa', minHeight: '100vh' }}>
            {/* BARRA DE AÇÕES SUPERIOR */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Assessment color="primary" sx={{ mr: 1, fontSize: 30 }} />
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Dashboard de Resultados
                    </Typography>
                </Box>
                <Box>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={onNewCalculation}
                        sx={{ mr: 2 }}
                    >
                        Nova Simulação
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={isExporting ? <Download /> : <Download />}
                        onClick={handleExportPDF}
                        disabled={isExporting}
                    >
                        {isExporting ? 'Gerando PDF...' : 'Exportar Relatório'}
                    </Button>
                </Box>
            </Paper>

            {/* CONTEÚDO DO RELATÓRIO (REF PARA PDF) */}
            <div ref={dashboardRef} style={{ backgroundColor: '#f5f7fa', padding: '20px' }}>

                {/* CABEÇALHO DO RELATÓRIO PDF */}
                <Box className="pdf-section" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, borderBottom: '2px solid #1a237e', pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <img src="/logo.png" alt="Logo" style={{ height: 50, marginRight: 20 }} />
                        <Box>
                            <Typography variant="h5" fontWeight="bold" color="primary.main">Proposta de Automação</Typography>
                            <Typography variant="subtitle2" color="text.secondary">RPA Calculator</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2"><strong>Projeto:</strong> {data.project_name}</Typography>
                        <Typography variant="body2"><strong>Responsável:</strong> {getResponsibleName()}</Typography>
                        <Typography variant="body2"><strong>Data:</strong> {new Date().toLocaleString()}</Typography>
                    </Box>
                </Box>

                {/* CABEÇALHO DO PROJETO */}
                <Paper className="pdf-section" elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, borderLeft: '6px solid #1a237e' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={8}>
                            <Typography variant="h4" fontWeight="bold" color="#1a237e" gutterBottom>
                                {data.project_name || 'Projeto Sem Nome'}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                Responsável: <strong>{getResponsibleName()}</strong>
                            </Typography>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Chip label={`Complexidade: ${getComplexityLabel(complexity.classification)}`} color={getComplexityColor(complexity.classification)} sx={{ fontWeight: 'bold' }} />
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                            <Typography variant="h6" color="text.secondary">ROI Estimado (3 Anos)</Typography>
                            <Typography variant="h3" fontWeight="bold" color={calculatedRoi >= 0 ? 'success.main' : 'error.main'}>
                                {formatNumber(calculatedRoi)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Payback em {formatNumber(precisePayback)} meses
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>

                {/* KPI CARDS */}
                <Grid container spacing={3} sx={{ mb: 3 }} className="pdf-section">
                    <Grid item xs={12} md={3}>
                        <Card sx={{ height: '100%', borderTop: '4px solid #f44336' }}>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>Custo AS-IS (Anual)</Typography>
                                <Typography variant="h5" fontWeight="bold">{formatCurrency(results.as_is_cost_annual)}</Typography>
                                <Typography variant="caption" color="text.secondary">Processo Manual</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ height: '100%', borderTop: '4px solid #4caf50' }}>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>Economia Anual</Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Ano 1 (Líquido):</Typography>
                                        <Typography variant="body1" fontWeight="bold" color={(results.as_is_cost_annual - (results.development_cost + results.to_be_cost_annual)) >= 0 ? "success.main" : "error.main"}>
                                            {formatCurrency(results.as_is_cost_annual - (results.development_cost + results.to_be_cost_annual))}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Ano 2 (Bruto):</Typography>
                                        <Typography variant="body1" fontWeight="bold" color={savingsYear2Plus >= 0 ? "success.main" : "error.main"}>
                                            {formatCurrency(savingsYear2Plus)}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Ano 3 (Bruto):</Typography>
                                        <Typography variant="body1" fontWeight="bold" color={savingsYear2Plus >= 0 ? "success.main" : "error.main"}>
                                            {formatCurrency(savingsYear2Plus)}
                                        </Typography>
                                    </Box>
                                    <Divider />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Total de Economia em 3 anos:</Typography>
                                        <Typography variant="body1" fontWeight="bold" color={(results.as_is_cost_annual - (results.development_cost + results.to_be_cost_annual) + (savingsYear2Plus * 2)) >= 0 ? "primary.main" : "error.main"}>
                                            {formatCurrency((results.as_is_cost_annual - (results.development_cost + results.to_be_cost_annual)) + (savingsYear2Plus * 2))}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ height: '100%', borderTop: '4px solid #ff9800' }}>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>Investimento (CAPEX)</Typography>
                                <Typography variant="h5" fontWeight="bold">{formatCurrency(results.development_cost)}</Typography>
                                <Typography variant="caption" color="text.secondary">Desenvolvimento</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ height: '100%', borderTop: '4px solid #2196f3' }}>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>Custo TO-BE (OPEX) (Anual)</Typography>
                                <Typography variant="h5" fontWeight="bold">{formatCurrency(results.to_be_cost_annual)}</Typography>
                                <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Licenças:</span> <strong>{formatCurrency(results.cost_breakdown.licenseCost)}</strong>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Infra:</span> <strong>{formatCurrency(results.cost_breakdown.infraCost)}</strong>
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Sustentação:</span> <strong>{formatCurrency(results.cost_breakdown.maintenanceCost)}</strong>
                                    </Typography>
                                    {strategic.genAiCost > 0 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>GenAI:</span> <strong>{formatCurrency(strategic.genAiCost)}</strong>
                                        </Typography>
                                    )}
                                    {strategic.idpCost > 0 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>IDP:</span> <strong>{formatCurrency(strategic.idpCost)}</strong>
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* GRÁFICOS */}
                <Grid container spacing={3} sx={{ mb: 3 }} className="pdf-section">
                    {/* Gráfico de Comparação de Custos */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3, height: 400, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">Comparativo Financeiro (Anual)</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={costComparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend payload={[
                                        { value: 'AS-IS (Atual)', type: 'square', id: 'ID01', color: '#f44336' },
                                        { value: 'TO-BE (Estimado)', type: 'square', id: 'ID02', color: '#2196f3' },
                                        { value: 'TO-BE (Ponderado)', type: 'square', id: 'ID03', color: '#ff9800' }
                                    ]} />
                                    <Bar dataKey="value" name="Custo Anual" radius={[4, 4, 0, 0]} barSize={60}>
                                        {costComparisonData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Gráfico de Payback (Breakeven) */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3, height: 400, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">Projeção de Payback (Breakeven)</Typography>
                            <ResponsiveContainer width="100%" height="90%">
                                <LineChart data={paybackData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" label={{ value: 'Mês', position: 'insideBottomRight', offset: -5 }} />
                                    <YAxis tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                    <Line type="monotone" dataKey="accSavings" stroke="#4caf50" strokeWidth={3} name="Economia Acumulada (AS-IS)" dot={false} />
                                    <Line type="monotone" dataKey="accCosts" stroke="#f44336" strokeWidth={3} name="Custo Total Acumulado (Capex + Opex)" dot={false} />
                                    <Line type="monotone" dataKey="accSavingsWeighted" stroke="#ff9800" strokeWidth={2} name="Economia Ponderada (Real)" dot={false} strokeDasharray="5 5" />

                                    {/* Ponto de Breakeven */}
                                    {calculatedPaybackMonth > 0 && calculatedPaybackMonth <= monthsToProject && (
                                        <ReferenceDot
                                            x={calculatedPaybackMonth}
                                            y={paybackData[calculatedPaybackMonth - 1]?.accSavings}
                                        >
                                            <Label
                                                value="Breakeven"
                                                position="top"
                                                offset={10}
                                                fill="#2196f3"
                                                fontWeight="bold"
                                            />
                                        </ReferenceDot>
                                    )}

                                    {/* Label: Deflator de Acuracidade (No final da linha pontilhada) */}
                                    {paybackData.length > 0 && (
                                        <ReferenceDot
                                            x={paybackData[paybackData.length - 1].month}
                                            y={paybackData[paybackData.length - 1].accSavingsWeighted}
                                            r={4}
                                            fill="#ff9800"
                                            stroke="none"
                                        >
                                            <Label
                                                value="Deflator de Acuracidade"
                                                position="bottom"
                                                offset={10}
                                                fill="#ff9800"
                                                style={{ fontSize: '10px', fontWeight: 'bold' }}
                                            />
                                        </ReferenceDot>
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
                </Grid>

                {/* DETALHAMENTO DE CUSTOS & ESTRATÉGIA */}
                <Grid container spacing={3} sx={{ mb: 3 }} className="pdf-section">
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">Composição do Custo TO-BE</Typography>
                            <Box sx={{ height: 300 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={toBeCostBreakdown}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {toBeCostBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">Análise Estratégica</Typography>
                            <List>
                                <ListItem>
                                    <ListItemIcon><Psychology color={strategic.genAiCost > 0 ? "primary" : "disabled"} /></ListItemIcon>
                                    <ListItemText
                                        primary="Inteligência Artificial (GenAI)"
                                        secondary={
                                            strategic.genAiCost > 0
                                                ? `Custo estimado: ${formatCurrency(strategic.genAiCost)}/ano`
                                                : strategicInput.cognitiveLevel === 'creation'
                                                    ? 'Habilitado (Custo Zero/Incluso)'
                                                    : 'Regra Fixa (RPA Puro)'
                                        }
                                    />
                                </ListItem>
                                <Divider component="li" />

                                <ListItem>
                                    <ListItemIcon><CheckCircle color={strategic.riskCost > 0 ? "success" : "disabled"} /></ListItemIcon>
                                    <ListItemText
                                        primary="Redução de Risco (Compliance)"
                                        secondary={
                                            strategic.riskCost > 0
                                                ? (
                                                    <span>
                                                        Reportado: <strong>{formatCurrency(strategicInput.errorCost)}</strong> ({strategicInput.errorCostUnit === 'annual' ? 'Por Ano' : strategicInput.errorCostUnit === 'monthly' ? 'Por Mês' : 'Por Falha'})
                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                            Impacto na Economia: {formatCurrency(strategic.riskCost)}/ano
                                                        </Typography>
                                                    </span>
                                                )
                                                : strategicInput.errorCost > 0
                                                    ? `Custo do Erro Informado: ${formatCurrency(strategicInput.errorCost)}`
                                                    : 'Custo do Erro: R$ 0,00 (Não aplicável)'
                                        }
                                    />
                                </ListItem>
                                <Divider component="li" />

                                <ListItem>
                                    <ListItemIcon><CheckCircle color={strategic.turnoverCost > 0 ? "success" : "disabled"} /></ListItemIcon>
                                    <ListItemText
                                        primary="Redução de Turnover"
                                        secondary={
                                            strategic.turnoverCost > 0
                                                ? `Economia de ${formatCurrency(strategic.turnoverCost)}/ano`
                                                : strategicInput.turnoverRate > 0
                                                    ? `Taxa: ${strategicInput.turnoverRate}% (Sem impacto calculado)`
                                                    : 'Taxa: 0% (Não aplicável)'
                                        }
                                    />
                                </ListItem>
                                <Divider component="li" />

                                <ListItem>
                                    <ListItemIcon><Schedule color={strategic.slaMultiplier > 1 ? "warning" : "disabled"} /></ListItemIcon>
                                    <ListItemText
                                        primary="Disponibilidade 24/7"
                                        secondary={
                                            strategic.slaMultiplier > 1
                                                ? 'Sim (Operação em 3 Turnos)'
                                                : 'Não (Horário Comercial)'
                                        }
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>
                </Grid>

                {/* PLANO DE ENTREGA (GANTT) */}
                <Paper className="pdf-section" elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <CalendarToday color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Plano de Entrega (Roadmap Estimado)</Typography>
                    </Box>
                    {
                        loadingPlan ? (
                            <LinearProgress />
                        ) : (
                            <Box sx={{ position: 'relative', mt: 2 }}>
                                {/* Cabeçalho da Linha do Tempo */}
                                <Box sx={{ display: 'flex', mb: 1, borderBottom: '1px solid #e0e0e0', pb: 1 }}>
                                    <Box sx={{ width: '30%', fontWeight: 'bold', color: 'text.secondary' }}>Fase / Atividade</Box>
                                    <Box sx={{ width: '20%', fontWeight: 'bold', color: 'text.secondary' }}>Responsável</Box>
                                    <Box sx={{ width: '15%', fontWeight: 'bold', color: 'text.secondary', textAlign: 'center' }}>Duração</Box>
                                    <Box sx={{ width: '35%', fontWeight: 'bold', color: 'text.secondary' }}>Cronograma (Dias Úteis)</Box>
                                </Box>

                                {/* Linhas do Gantt */}
                                {
                                    deliveryPlan.map((item, index) => {
                                        const totalDays = deliveryPlan.reduce((acc, curr) => acc + curr.duration, 0);
                                        const totalWeeks = Math.ceil(totalDays / 5);
                                        const leftPercent = (item.start / totalDays) * 100;
                                        const widthPercent = (item.duration / totalDays) * 100;

                                        return (
                                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, '&:hover': { bgcolor: '#f5f5f5' }, borderRadius: 1, p: 1 }}>
                                                <Box sx={{ width: '30%' }}>
                                                    <Typography variant="body2" fontWeight="bold">{item.phase}</Typography>
                                                </Box>
                                                <Box sx={{ width: '20%' }}>
                                                    <Typography variant="caption" sx={{ bgcolor: '#e0e0e0', px: 1, py: 0.5, borderRadius: 1 }}>
                                                        {item.role}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ width: '15%', textAlign: 'center' }}>
                                                    <Typography variant="body2">{item.duration} dias</Typography>
                                                </Box>
                                                <Box sx={{ width: '35%', position: 'relative', height: 24, bgcolor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                                    {/* Grid de Semanas no Fundo */}
                                                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex' }}>
                                                        {Array.from({ length: totalWeeks }).map((_, w) => (
                                                            <Box key={w} sx={{ flex: 1, borderRight: '1px dashed #ccc', height: '100%' }} />
                                                        ))}
                                                    </Box>

                                                    <MuiTooltip title={`Início: Dia ${item.start} | Fim: Dia ${item.start + item.duration}`}>
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                left: `${leftPercent}%`,
                                                                width: `${widthPercent}%`,
                                                                height: '100%',
                                                                bgcolor: item.color,
                                                                borderRadius: 4,
                                                                zIndex: 1,
                                                                transition: 'width 0.5s ease-in-out'
                                                            }}
                                                        />
                                                    </MuiTooltip>
                                                </Box>
                                            </Box>
                                        );
                                    })
                                }

                                {/* Legenda de Semanas */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                    <Box sx={{ width: '35%', display: 'flex', justifyContent: 'space-between' }}>
                                        {Array.from({ length: Math.min(Math.ceil(deliveryPlan.reduce((a, b) => a + b.duration, 0) / 5), 8) }).map((_, i) => (
                                            <Typography key={i} variant="caption" color="text.secondary" sx={{ flex: 1, textAlign: 'center' }}>
                                                Sem {i + 1}
                                            </Typography>
                                        ))}
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 2, textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        * Estimativa em dias úteis baseada na alocação de horas por perfil. Total Estimado: <strong>{deliveryPlan.reduce((a, b) => a + b.duration, 0)} dias úteis</strong>.
                                    </Typography>
                                </Box>
                            </Box >
                        )
                    }
                </Paper >

                {/* PROPOSTA DE SUSTENTAÇÃO - NEW SECTION */}
                <Paper className="pdf-section" elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, borderTop: '4px solid #00bcd4' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <SupportAgent sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                        <Box>
                            <Typography variant="h6" fontWeight="bold">
                                Proposta de Sustentação
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Payback em {formatNumber(precisePayback)} meses
                            </Typography>
                        </Box>
                    </Box>

                    <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary.dark">
                                    Investimento Previsto
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 4, mt: 1 }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Mensal</Typography>
                                        <Typography variant="h5" fontWeight={700} color="primary.main">
                                            {formatCurrency(maintenanceAnalysis.monthlyCost || 0)}
                                        </Typography>
                                    </Box>
                                    <Divider orientation="vertical" flexItem />
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">Anual</Typography>
                                        <Typography variant="h5" fontWeight={700} color="primary.main">
                                            {formatCurrency(maintenanceAnalysis.annualCost || 0)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 1, border: '1px dashed #cbd5e1' }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Dimensionamento:</strong> Este robô utiliza <strong>1/{maintenanceAnalysis.capacityDivisor || 1}</strong> da capacidade de um FTE de sustentação, baseado em sua complexidade <strong>{getComplexityLabel(complexity.classification)}</strong>.
                                </Typography>
                                <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                                    * Premissa: Esta proposta é valida apenas com a garantia de uma contratação mínima de <strong>{maintenanceConfig?.capacity_medium || 70}</strong> automações/robôs.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Business color="secondary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" fontWeight={600}>
                                Escopo Base do Serviço
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <AccessTime sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                            <Typography variant="body2" fontWeight={600}>
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
                                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 30 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                                        <ListItemText primary="Suporte N2 (Incidentes)" secondary="Análise de falhas, reprocessamento e correções de bugs." />
                                    </ListItem>
                                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 30 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                                        <ListItemText primary="Suporte N3 (Evolutivo)" secondary="Ajustes de código, atualizações de infra e melhorias." />
                                    </ListItem>
                                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 30 }}><CheckCircle fontSize="small" color="success" /></ListItemIcon>
                                        <ListItemText primary="Monitoramento Proativo" secondary="Saúde dos robôs e infraestrutura." />
                                    </ListItem>
                                </List>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                                    <Security fontSize="small" sx={{ mr: 1 }} />
                                    Não Incluso (Responsabilidade do Cliente)
                                </Typography>
                                <List dense>
                                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 30 }}><Info fontSize="small" color="disabled" /></ListItemIcon>
                                        <ListItemText primary="Suporte N1 (Negócio)" secondary="Dúvidas de regra, validação de dados e gestão de acessos." />
                                    </ListItem>
                                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 30 }}><Info fontSize="small" color="disabled" /></ListItemIcon>
                                        <ListItemText primary="Infraestrutura" secondary="Servidores, licenças de SO e banco de dados." />
                                    </ListItem>
                                </List>
                            </Grid>
                        </Grid>
                    </Paper>
                </Paper >

                {/* MEMÓRIA DE CÁLCULO - NEW SECTION */}
                <Paper className="pdf-section" elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#fff3e0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Description color="warning" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight="bold">Memória de Cálculo</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Detalhamento das fórmulas utilizadas para gerar os indicadores deste relatório.
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>1. Cálculo AS-IS (Processo Manual)</Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Volume Mensal</TableCell>
                                            <TableCell align="right">Input do Usuário</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Tempo por Transação</TableCell>
                                            <TableCell align="right">Input do Usuário</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Horas Totais Mensais</TableCell>
                                            <TableCell align="right"><code>(Volume Mensal × Tempo Médio) ÷ 60</code></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Custo FTE (Mensal)</TableCell>
                                            <TableCell align="right">Input do Usuário</TableCell>
                                        </TableRow>
                                        <TableRow sx={{ bgcolor: '#fffde7' }}>
                                            <TableCell><strong>Custo Anual Total</strong></TableCell>
                                            <TableCell align="right"><code>(Horas Mensais × Custo Hora FTE) × 12</code></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>2. Cálculo TO-BE (Automação)</Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Licenciamento (Anual)</TableCell>
                                            <TableCell align="right"><code>Custo Licença × Quantidade Robôs</code></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Infraestrutura (Anual)</TableCell>
                                            <TableCell align="right"><code>Custo Infra × Quantidade Robôs</code></TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Manutenção (Anual)</TableCell>
                                            <TableCell align="right"><code>Custo Sustentação Mensal × 12</code></TableCell>
                                        </TableRow>
                                        {strategic.genAiCost > 0 && (
                                            <TableRow>
                                                <TableCell>Custos GenAI (Anual)</TableCell>
                                                <TableCell align="right"><code>Custo Mensal Tokens × 12</code></TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                                            <TableCell><strong>Custo Anual Total</strong></TableCell>
                                            <TableCell align="right"><code>Licenças + Infra + Manutenção + GenAI</code></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>3. Indicadores Financeiros</Typography>
                            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={3}>
                                        <Typography variant="caption" display="block" color="text.secondary">ROI (Retorno sobre Investimento)</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            <code>(Economia Anual / Custo AS-IS) × 100</code>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography variant="caption" display="block" color="text.secondary">Economia Anual (Bruta)</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            <code>Custo AS-IS - Custo TO-BE</code>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography variant="caption" display="block" color="text.secondary">Acurácia (Deflator)</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            <code>{strategic.accuracyPercentage || 100}%</code>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography variant="caption" display="block" color="text.secondary">ROI / Saving (Ajustado)</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            <code>Bruto × {((strategic.accuracyPercentage || 100) / 100).toFixed(2)}</code>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography variant="caption" display="block" color="text.secondary">Payback (Retorno)</Typography>
                                        <Typography variant="body2" fontWeight="bold">
                                            <code>(CAPEX + OPEX Anual) / (Economia Mensal × Acurácia)</code>
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper >

                {/* DETALHAMENTO DOS PARÂMETROS (WIZARD STEP 5) */}
                <Box className="pdf-section" sx={{ mb: 3 }}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                        <Step5Review data={reviewData} hideInstructions={true} />
                    </Paper>
                </Box>

                <Box className="pdf-section" sx={{ mt: 4, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        Relatório gerado automaticamente pelo RPA Calculator em {new Date().toLocaleDateString()}.
                    </Typography>
                </Box>
            </div >
        </Box >
    );
}