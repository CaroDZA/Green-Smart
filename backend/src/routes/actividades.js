const express = require('express');
const router = express.Router();
const { verificarLogin, verificarRol } = require('../middlewares/auth');
const {
    crearActividad,
    listarActividades,
    listarPorLote,
    verActividad,
    actualizarActividad,
    eliminarActividad,
} = require('../controllers/actividades');

// Todas las rutas necesitan estar logueado
router.use(verificarLogin);

// Cualquier usuario logueado puede ver
router.get('/', listarActividades);
router.get('/lote/:loteId', listarPorLote);
router.get('/:id', verActividad);

// Solo Coordinador y Administrador pueden crear y actualizar
router.post('/', verificarRol('ADMINISTRADOR', 'COORDINADOR'), crearActividad);
router.put('/:id', verificarRol('ADMINISTRADOR', 'COORDINADOR'), actualizarActividad);

// Solo Administrador puede eliminar
router.delete('/:id', verificarRol('ADMINISTRADOR'), eliminarActividad);

module.exports = router;