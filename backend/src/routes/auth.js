const express = require('express');
const router = express.Router();
const { registrar, login, listarUsuarios, cambiarRol } = require('../controllers/auth');
const { verificarLogin, verificarRol } = require('../middlewares/auth');

// Rutas públicas
router.post('/register', registrar);
router.post('/login', login);

// Rutas protegidas (solo Admin)
router.get('/usuarios', verificarLogin, verificarRol('ADMINISTRADOR'), listarUsuarios);
router.put('/usuarios/:id/rol', verificarLogin, verificarRol('ADMINISTRADOR'), cambiarRol);

module.exports = router;