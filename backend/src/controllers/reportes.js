const prisma = require('../utils/prisma');

// Historial completo de un lote (actividades ordenadas por fecha)
const historialLote = async (req, res) => {
    try {
        const { loteId } = req.params;

        const lote = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
        });

        if (!lote) {
            return res.status(404).json({ error: 'Lote no encontrado' });
        }

        const actividades = await prisma.actividad.findMany({
            where: { loteId: parseInt(loteId) },
            orderBy: { fecha: 'asc' },
        });

        res.json({
            lote: lote.nombre,
            ubicacion: lote.ubicacion,
            totalActividades: actividades.length,
            historial: actividades,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Resumen general del sistema
const resumenGeneral = async (req, res) => {
    try {
        const totalLotes = await prisma.lote.count();
        const totalActividades = await prisma.actividad.count();

        const pendientes = await prisma.actividad.count({
            where: { estado: 'PENDIENTE' },
        });
        const completadas = await prisma.actividad.count({
            where: { estado: 'COMPLETADA' },
        });

        const porTipo = await prisma.actividad.groupBy({
            by: ['tipo'],
            _count: { tipo: true },
        });

        res.json({
            totalLotes,
            totalActividades,
            actividadesPorEstado: {
                pendientes,
                completadas,
            },
            actividadesPorTipo: porTipo,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Reporte por rango de fechas
const reportePorFechas = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({
                error: 'Debes enviar fechaInicio y fechaFin como parámetros',
            });
        }

        const actividades = await prisma.actividad.findMany({
            where: {
                fecha: {
                    gte: new Date(fechaInicio),
                    lte: new Date(fechaFin),
                },
            },
            include: { lote: true },
            orderBy: { fecha: 'asc' },
        });

        res.json({
            rango: { desde: fechaInicio, hasta: fechaFin },
            total: actividades.length,
            actividades,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { historialLote, resumenGeneral, reportePorFechas };