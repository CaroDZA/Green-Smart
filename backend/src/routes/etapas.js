const express = require('express');
const router = express.Router();
const { verificarLogin, verificarRol } = require('../middlewares/auth');
const {
    crearEtapa,
    listarEtapas,
    listarPorLote,
    verEtapa,
    actualizarEtapa,
    eliminarEtapa,
} = require('../controllers/etapas');

router.use(verificarLogin);

router.get('/', listarEtapas);
router.get('/lote/:loteId', listarPorLote);
router.get('/:id', verEtapa);

router.post('/', verificarRol('ADMINISTRADOR', 'COORDINADOR'), crearEtapa);
router.put('/:id', verificarRol('ADMINISTRADOR', 'COORDINADOR'), actualizarEtapa);
router.delete('/:id', verificarRol('ADMINISTRADOR'), eliminarEtapa);

module.exports = router;