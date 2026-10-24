const prisma = require('../utils/prisma');
const { esIdValido, esFechaValida } = require('../utils/validar');

const historialLote = async (req, res) => {
    const { loteId } = req.params;

    if (!esIdValido(loteId)) {
        return res.status(400).json({ error: 'El loteId no es valido' });
    }

    try {
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
            historial: { actividades, monitoreos },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const resumenGeneral = async (req, res) => {
    try {
        // Solo se cuenta lo que pertenece a lotes activos
        const totalLotes = await prisma.lote.count({ where: { activo: true } });
        const totalActividades = await prisma.actividad.count({ where: { lote: { activo: true } } });
        const totalMonitoreos = await prisma.monitoreo.count({ where: { lote: { activo: true } } });

        const pendientes = await prisma.actividad.count({ where: { estado: 'PENDIENTE', lote: { activo: true } } });
        const enProceso = await prisma.actividad.count({ where: { estado: 'EN_PROCESO', lote: { activo: true } } });
        const completadas = await prisma.actividad.count({ where: { estado: 'COMPLETADA', lote: { activo: true } } });
        const canceladas = await prisma.actividad.count({ where: { estado: 'CANCELADA', lote: { activo: true } } });

        const porTipo = await prisma.actividad.groupBy({
            by: ['tipo'],
            where: { lote: { activo: true } },
            _count: { tipo: true },
        });

        const costos = await prisma.actividad.aggregate({
            _sum: { costo: true },
            where: { costo: { not: null }, lote: { activo: true } },
        });

        res.json({
            totalLotes,
            totalActividades,
            totalMonitoreos,
            actividadesPorEstado: { pendientes, enProceso, completadas, canceladas },
            actividadesPorTipo: porTipo,
            costoTotal: costos._sum.costo || 0,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const reportePorFechas = async (req, res) => {
    try {
        const { fechaInicio, fechaFin, loteId } = req.query;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ error: 'Debes enviar fechaInicio y fechaFin' });
        }
        if (!esFechaValida(fechaInicio) || !esFechaValida(fechaFin)) {
            return res.status(400).json({ error: 'Las fechas no son validas' });
        }

        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);

        if (fin < inicio) {
            return res.status(400).json({ error: 'La fecha final no puede ser anterior a la inicial' });
        }
        const dias = (fin - inicio) / (1000 * 60 * 60 * 24);
        if (dias > 366) {
            return res.status(400).json({ error: 'El rango maximo es de 12 meses' });
        }

        // El filtro de lotes activos va DENTRO de cada where (una sola clave "where" por consulta)
        const whereActividades = { fechaProgramada: { gte: inicio, lte: fin }, lote: { activo: true } };
        const whereMonitoreos = { fecha: { gte: inicio, lte: fin }, lote: { activo: true } };

        if (loteId) {
            if (!esIdValido(loteId)) {
                return res.status(400).json({ error: 'El loteId no es valido' });
            }
            whereActividades.loteId = parseInt(loteId);
            whereMonitoreos.loteId = parseInt(loteId);
        }

        const actividades = await prisma.actividad.findMany({
            where: whereActividades,
            include: { lote: true },
            orderBy: { fechaProgramada: 'asc' },
        });
        const monitoreos = await prisma.monitoreo.findMany({
            where: whereMonitoreos,
            include: { lote: true, usuario: { select: { nombre: true } } },
            orderBy: { fecha: 'asc' },
        });

        res.json({
            rango: { desde: fechaInicio, hasta: fechaFin },
            totalActividades: actividades.length,
            totalMonitoreos: monitoreos.length,
            actividades,
            monitoreos,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const alertas = async (req, res) => {
    try {
        const hoy = new Date(Date.now() - 5 * 60 * 60 * 1000);
        hoy.setUTCHours(0, 0, 0, 0);
        const en3Dias = new Date(hoy);
        en3Dias.setUTCDate(en3Dias.getUTCDate() + 3);

        const vencidas = await prisma.actividad.findMany({
            where: {
                estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
                fechaProgramada: { lt: hoy },
                lote: { activo: true },
            },
            include: { lote: { select: { id: true, nombre: true } } },
            orderBy: { fechaProgramada: 'asc' },
        });

        const proximas = await prisma.actividad.findMany({
            where: {
                estado: { in: ['PENDIENTE', 'EN_PROCESO'] },
                fechaProgramada: { gte: hoy, lte: en3Dias },
                lote: { activo: true },
            },
            include: { lote: { select: { id: true, nombre: true } } },
            orderBy: { fechaProgramada: 'asc' },
        });

        const lotes = await prisma.lote.findMany({
            where: { activo: true },
            select: {
                id: true,
                nombre: true,
                monitoreos: { orderBy: { fecha: 'desc' }, take: 1 },
            },
        });

        const lotesCriticos = [];
        lotes.forEach((lote) => {
            const ultimo = lote.monitoreos[0];
            if (ultimo && ultimo.estado === 'CRITICO') {
                lotesCriticos.push({
                    loteId: lote.id,
                    nombre: lote.nombre,
                    fecha: ultimo.fecha,
                    condicion: ultimo.condicionObservada,
                });
            }
        });

        res.json({
            totalAlertas: vencidas.length + proximas.length + lotesCriticos.length,
            actividadesVencidas: vencidas,
            actividadesProximas: proximas,
            lotesCriticos,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { historialLote, resumenGeneral, reportePorFechas, alertas };