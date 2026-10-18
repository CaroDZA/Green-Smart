const express = require('express');
const router = express.Router();
const { verificarLogin, verificarRol } = require('../middlewares/auth');
const {
    crearMonitoreo,
    listarMonitoreos,
    listarPorLote,
    verMonitoreo,
    eliminarMonitoreo,
    estadoPorLote,
    actualizarMonitoreo,
} = require('../controllers/monitoreos');

router.use(verificarLogin);

// Panel de estado (va ANTES de /:id)
router.get('/estado/panel', estadoPorLote);

router.get('/', listarMonitoreos);
router.get('/lote/:loteId', listarPorLote);
router.get('/:id', verMonitoreo);

router.post('/', verificarRol('ADMINISTRADOR', 'COORDINADOR'), crearMonitoreo);
router.put('/:id', verificarRol('ADMINISTRADOR', 'COORDINADOR'), actualizarMonitoreo);
router.delete('/:id', verificarRol('ADMINISTRADOR'), eliminarMonitoreo);

module.exports = router;