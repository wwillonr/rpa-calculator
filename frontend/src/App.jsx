// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './components/Home';
import ROIWizard from './components/ROIWizard';
import ResultsDashboard from './components/ResultsDashboard';
import ProjectHistory from './components/ProjectHistory';
import Settings from './components/Settings';
import ReloadPrompt from './components/ReloadPrompt';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ForgotPassword from './components/ForgotPassword';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { healthCheck } from './services/api';

const theme = createTheme({
    palette: {
        primary: { main: '#667eea' },
        secondary: { main: '#764ba2' },
        background: { default: '#f4f6f8' }
    },
    typography: { fontFamily: '"Inter", sans-serif' },
    shape: { borderRadius: 8 },
});

function AppContent() {
    const { currentUser, isAdmin } = useAuth();
    const [currentView, setCurrentView] = useState('home');
    const [settingsTab, setSettingsTab] = useState(0);
    const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
    const [selectedProject, setSelectedProject] = useState(null);

    // Se não estiver logado, gerencia entre Login e Cadastro
    if (!currentUser) {
        if (authMode === 'signup') {
            return <SignUp onSwitchToLogin={() => setAuthMode('login')} />;
        }
        if (authMode === 'forgot') {
            return <ForgotPassword onBack={() => setAuthMode('login')} />;
        }
        return <Login
            onSwitchToRegister={() => setAuthMode('signup')}
            onSwitchToForgot={() => setAuthMode('forgot')}
        />;
    }

    // ... lógica do app logado ...
    const handleCalculationComplete = (data) => {
        setSelectedProject(data);
        setCurrentView('results');
    };
    const handleNewCalculation = () => {
        setSelectedProject(null);
        setCurrentView('wizard');
    };
    const handleViewProject = (project) => {
        setSelectedProject(project);
        setCurrentView('results');
    };

    const handleNavigate = (view, tabIndex = 0) => {
        if (view === 'settings' && !isAdmin) {
            console.error("Acesso negado: Perfil de administrador exigido.");
            return; // Bloqueia navegação
        }
        setCurrentView(view);
        if (view === 'settings') {
            setSettingsTab(tabIndex);
        }
    };

    return (
        <>
            <Navbar currentView={currentView} onViewChange={(v) => handleNavigate(v, 0)} />
            <Box sx={{ pb: 8 }}>
                {currentView === 'home' && <Home onStart={handleNewCalculation} onViewProject={handleViewProject} />}
                {currentView === 'wizard' && <ROIWizard onComplete={handleCalculationComplete} onNavigate={handleNavigate} />}
                {currentView === 'results' && selectedProject && <ResultsDashboard data={selectedProject} onNewCalculation={handleNewCalculation} />}
                {currentView === 'history' && <ProjectHistory onViewProject={handleViewProject} />}
                {currentView === 'settings' && isAdmin && <Settings initialTab={settingsTab} />}
            </Box>
            <ReloadPrompt />
        </>
    );
}

function App() {
    useEffect(() => {
        // Wake-up call para o backend (Render Free Tier)
        // Faz um ping silencioso ao iniciar o app para acordar o servidor
        healthCheck()
            .then(() => console.log('Backend is awake!'))
            .catch(() => console.log('Waking up backend...'));
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;