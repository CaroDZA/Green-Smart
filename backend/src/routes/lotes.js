const express = require('express');
const router = express.Router();
const { verificarLogin, verificarRol } = require('../middlewares/auth');
const {
    crearLote,
    listarLotes,
    verLote,
    actualizarLote,
    eliminarLote,
} = require('../controllers/lotes');

// Todas las rutas necesitan estar logueado
router.use(verificarLogin);

// Cualquier usuario logueado puede ver
router.get('/', listarLotes);
router.get('/:id', verLote);

// Solo el administrador puede crear, actualizar o eliminar
router.post('/', verificarRol('ADMINISTRADOR'), crearLote);
router.put('/:id', verificarRol('ADMINISTRADOR'), actualizarLote);
router.delete('/:id', verificarRol('ADMINISTRADOR'), eliminarLote);

module.exports = router;