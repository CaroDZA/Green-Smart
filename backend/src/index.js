const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
    console.log('Faltan variables en el .env (JWT_SECRET o DATABASE_URL)');
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Green Smart funcionando' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/lotes', require('./routes/lotes'));
app.use('/api/actividades', require('./routes/actividades'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/etapas', require('./routes/etapas'));
app.use('/api/monitoreos', require('./routes/monitoreos'));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});