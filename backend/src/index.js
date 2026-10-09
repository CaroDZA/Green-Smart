const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta de inicio
app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Green Smart funcionando' });
});

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/test', require('./routes/test'));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});