const express = require('express');
const router = express.Router();
const { verificarLogin } = require('../middlewares/auth');
const {
    historialLote,
    resumenGeneral,
    reportePorFechas,
} = require('../controllers/reportes');

router.use(verificarLogin);

router.get('/resumen', resumenGeneral);
router.get('/historial/:loteId', historialLote);
router.get('/fechas', reportePorFechas);

module.exports = router;