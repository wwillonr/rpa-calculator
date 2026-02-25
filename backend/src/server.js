import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase.js';
import routes from './routes/index.js';

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar Firebase
initializeFirebase();

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(helmet()); // Segurança
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'];

app.use(
    cors({
        origin: (origin, callback) => {
            // Permitir requisições sem origin (mobile apps, Postman, etc)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    })
);

// Rotas
app.use('/api', routes);

// Rota raiz
app.get('/', (req, res) => {
    res.json({
        message: 'RPA ROI Navigator API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            projects: '/api/projects',
            settings: '/api/settings',
        },
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

export default app;
