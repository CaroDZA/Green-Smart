const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
    registrar,
    login,
    recuperarPassword,
    listarUsuarios,
    cambiarRol,
    actualizarDatosUsuario,
    cambiarPasswordAdmin
} = require('../controllers/auth');

const { verificarLogin, verificarRol } = require('../middlewares/auth');

const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { error: 'Demasiados intentos, intenta de nuevo en 15 minutos' },
});

//RUTAS PUBLICAS
router.post('/register', registrar);
router.post('/login', limiteLogin, login);
router.post('/recuperar', recuperarPassword);

//RUTAS PROTEGIDAS
router.get('/usuarios', verificarLogin, verificarRol('ADMINISTRADOR', 'COORDINADOR'), listarUsuarios);
router.put('/usuarios/:id/rol', verificarLogin, verificarRol('ADMINISTRADOR'), cambiarRol);
router.put('/usuarios/:id', verificarLogin, verificarRol('ADMINISTRADOR'), actualizarDatosUsuario);
router.put('/usuarios/:id/password', verificarLogin, verificarRol('ADMINISTRADOR'), cambiarPasswordAdmin);

module.exports = router;