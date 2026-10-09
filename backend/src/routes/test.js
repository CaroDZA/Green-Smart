const express = require('express');
const router = express.Router();
const { verificarLogin, verificarRol } = require('../middlewares/auth');

// Ruta de prueba: solo usuarios logueados
router.get('/perfil', verificarLogin, (req, res) => {
    res.json({ mensaje: 'Estás dentro', usuario: req.usuario });
});

// Ruta de prueba: solo administradores
router.get('/admin', verificarLogin, verificarRol('ADMINISTRADOR'), (req, res) => {
    res.json({ mensaje: 'Hola administrador', usuario: req.usuario });
});

module.exports = router;