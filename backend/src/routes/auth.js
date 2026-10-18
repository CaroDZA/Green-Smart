const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { registrar, login, listarUsuarios, cambiarRol } = require('../controllers/auth');
const { verificarLogin, verificarRol } = require('../middlewares/auth');

// Configuracion del limite de intentos para el login
// Permite maximo 10 intentos cada 15 minutos por direccion IP
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: 'Demasiados intentos, intenta de nuevo en 15 minutos' },
});

// Rutas publicas
router.post('/register', registrar);
router.post('/login', limiteLogin, login);

// Rutas protegidas (solo Administrador)
router.get('/usuarios', verificarLogin, verificarRol('ADMINISTRADOR'), listarUsuarios);
router.put('/usuarios/:id/rol', verificarLogin, verificarRol('ADMINISTRADOR'), cambiarRol);

module.exports = router;