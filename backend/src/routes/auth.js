const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// 1. Importar los controladores (incluyendo el nuevo de recuperar)
const {
    registrar,
    login,
    listarUsuarios,
    cambiarRol,
    restablecerPassword
} = require('../controllers/auth');

// 2. Importar los middlewares de seguridad
const { verificarLogin, verificarRol } = require('../middlewares/auth');

// Configuracion del limite de intentos para el login
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: 'Demasiados intentos, intenta de nuevo en 15 minutos' },
});

// --- RUTAS PUBLICAS ---
router.post('/register', registrar);
router.post('/login', limiteLogin, login);
router.post('/recuperar', restablecerPassword); // <-- NUEVA RUTA PÚBLICA

// --- RUTAS PROTEGIDAS (Solo Administrador) ---
router.get('/usuarios', verificarLogin, verificarRol('ADMINISTRADOR'), listarUsuarios);
router.put('/usuarios/:id/rol', verificarLogin, verificarRol('ADMINISTRADOR'), cambiarRol);

module.exports = router;