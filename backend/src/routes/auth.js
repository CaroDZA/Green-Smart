const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

//Importar los controladores
const {
    registrar,
    login,
    listarUsuarios,
    cambiarRol,
    restablecerPassword,
    actualizarUsuario
} = require('../controllers/auth');

// Importar los middlewares de seguridad
const { verificarLogin, verificarRol } = require('../middlewares/auth');

// Configuracion del limite de intentos para el login
// skipSuccessfulRequests: los logins correctos no cuentan contra el limite
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    message: { error: 'Demasiados intentos, intenta de nuevo en 15 minutos' },
});

// Ruta publica
router.post('/login', limiteLogin, login);

// Rutas protegidas (Solo admin)
router.post('/register', verificarLogin, verificarRol('ADMINISTRADOR'), registrar);
router.get('/usuarios', verificarLogin, verificarRol('ADMINISTRADOR'), listarUsuarios);
router.put('/usuarios/:id', verificarLogin, verificarRol('ADMINISTRADOR'), actualizarUsuario);
router.put('/usuarios/:id/rol', verificarLogin, verificarRol('ADMINISTRADOR'), cambiarRol);
router.put('/usuarios/:id/password', verificarLogin, verificarRol('ADMINISTRADOR'), restablecerPassword);

module.exports = router;