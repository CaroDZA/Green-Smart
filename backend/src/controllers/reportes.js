const prisma = require('../utils/prisma');

// Historial completo de un lote (actividades + monitoreos ordenados por fecha)
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
            orderBy: { fechaProgramada: 'asc' },
        });

        const monitoreos = await prisma.monitoreo.findMany({
            where: { loteId: parseInt(loteId) },
            include: { usuario: { select: { nombre: true } } },
            orderBy: { fecha: 'asc' },
        });

        res.json({
            lote: lote.nombre,
            ubicacion: lote.ubicacion,
            totalActividades: actividades.length,
            totalMonitoreos: monitoreos.length,
            historial: {
                actividades,
                monitoreos,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Resumen general del sistema
const resumenGeneral = async (req, res) => {
    try {
        // Solo contar lotes activos (borrado lógico)
        const totalLotes = await prisma.lote.count({
            where: { activo: true },
        });

        const totalActividades = await prisma.actividad.count();
        const totalMonitoreos = await prisma.monitoreo.count();

        // Contar actividades por estado
        const pendientes = await prisma.actividad.count({
            where: { estado: 'PENDIENTE' },
        });
        const enProceso = await prisma.actividad.count({
            where: { estado: 'EN_PROCESO' },
        });
        const completadas = await prisma.actividad.count({
            where: { estado: 'COMPLETADA' },
        });
        const canceladas = await prisma.actividad.count({
            where: { estado: 'CANCELADA' },
        });

        // Agrupar actividades por tipo
        const porTipo = await prisma.actividad.groupBy({
            by: ['tipo'],
            _count: { tipo: true },
        });

        // Suma de costos registrados
        const costos = await prisma.actividad.aggregate({
            _sum: { costo: true },
            where: { costo: { not: null } },
        });

        res.json({
            totalLotes,
            totalActividades,
            totalMonitoreos,
            actividadesPorEstado: {
                pendientes,
                enProceso,
                completadas,
                canceladas,
            },
            actividadesPorTipo: porTipo,
            costoTotal: costos._sum.costo || 0,
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

        // Convertir fechaFin al final del día (23:59:59)
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);

        const actividades = await prisma.actividad.findMany({
            where: {
                fechaProgramada: {
                    gte: inicio,
                    lte: fin,
                },
            },
            include: { lote: true },
            orderBy: { fechaProgramada: 'asc' },
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