const express = require('express');
const router = express.Router();
const { verificarLogin } = require('../middlewares/auth');
const {
    historialLote,
    resumenGeneral,
    reportePorFechas,
} = require('../controllers/reportes');
const { generarPDFLote } = require('../controllers/pdf');

router.use(verificarLogin);

router.get('/resumen', resumenGeneral);
router.get('/historial/:loteId', historialLote);
router.get('/fechas', reportePorFechas);
router.get('/pdf/:loteId', generarPDFLote);

module.exports = router;