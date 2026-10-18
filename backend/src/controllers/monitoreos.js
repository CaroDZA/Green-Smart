const prisma = require('../utils/prisma');
const { esIdValido, esFechaValida, ESTADOS_CULTIVO, PLAGAS, ENFERMEDADES } = require('../utils/validar');

const crearMonitoreo = async (req, res) => {
    try {
        const { fecha, condicionObservada, estado, plaga, enfermedad, observaciones, loteId } = req.body;

        if (!condicionObservada || !estado || !loteId) {
            return res.status(400).json({
                error: 'Los campos condicionObservada, estado y loteId son obligatorios',
            });
        }

        if (!esIdValido(loteId)) {
            return res.status(400).json({ error: 'El loteId no es valido' });
        }
        if (!ESTADOS_CULTIVO.includes(estado)) {
            return res.status(400).json({ error: 'El estado no es valido (BUENO, REGULAR o CRITICO)' });
        }
        if (plaga && !PLAGAS.includes(plaga)) {
            return res.status(400).json({ error: 'La plaga no es valida' });
        }
        if (enfermedad && !ENFERMEDADES.includes(enfermedad)) {
            return res.status(400).json({ error: 'La enfermedad no es valida' });
        }
        if (fecha && !esFechaValida(fecha)) {
            return res.status(400).json({ error: 'La fecha no es valida' });
        }
        if (fecha && new Date(fecha) > new Date()) {
            return res.status(400).json({ error: 'La fecha del monitoreo no puede ser futura' });
        }

        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
        });

        if (!loteExiste || !loteExiste.activo) {
            return res.status(404).json({ error: 'El lote no existe o esta inactivo' });
        }

        const nuevoMonitoreo = await prisma.monitoreo.create({
            data: {
                fecha: fecha ? new Date(fecha) : new Date(),
                condicionObservada,
                estado,
                plaga: plaga || null,
                enfermedad: enfermedad || null,
                observaciones: observaciones || null,
                loteId: parseInt(loteId),
                usuarioId: req.usuario.id,
            },
            include: {
                lote: true,
                usuario: { select: { id: true, nombre: true } },
            },
        });

        res.status(201).json({ mensaje: 'Monitoreo registrado', monitoreo: nuevoMonitoreo });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const listarMonitoreos = async (req, res) => {
    try {
        const monitoreos = await prisma.monitoreo.findMany({
            include: {
                lote: true,
                usuario: { select: { id: true, nombre: true } },
            },
            orderBy: { fecha: 'desc' },
        });
        res.json({ total: monitoreos.length, monitoreos });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const listarPorLote = async (req, res) => {
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

        const monitoreos = await prisma.monitoreo.findMany({
            where: { loteId: parseInt(loteId) },
            include: { usuario: { select: { id: true, nombre: true } } },
            orderBy: { fecha: 'desc' },
        });

        res.json({ lote: lote.nombre, total: monitoreos.length, monitoreos });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const verMonitoreo = async (req, res) => {
    const { id } = req.params;

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const monitoreo = await prisma.monitoreo.findUnique({
            where: { id: parseInt(id) },
            include: {
                lote: true,
                usuario: { select: { id: true, nombre: true } },
            },
        });

        if (!monitoreo) {
            return res.status(404).json({ error: 'Monitoreo no encontrado' });
        }

        res.json({ monitoreo });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const actualizarMonitoreo = async (req, res) => {
    const { id } = req.params;

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const { fecha, condicionObservada, estado, plaga, enfermedad, observaciones } = req.body;

        const existe = await prisma.monitoreo.findUnique({ where: { id: parseInt(id) } });
        if (!existe) {
            return res.status(404).json({ error: 'Monitoreo no encontrado' });
        }

        if (estado && !ESTADOS_CULTIVO.includes(estado)) {
            return res.status(400).json({ error: 'El estado no es valido' });
        }
        if (plaga && !PLAGAS.includes(plaga)) {
            return res.status(400).json({ error: 'La plaga no es valida' });
        }
        if (enfermedad && !ENFERMEDADES.includes(enfermedad)) {
            return res.status(400).json({ error: 'La enfermedad no es valida' });
        }
        if (fecha && !esFechaValida(fecha)) {
            return res.status(400).json({ error: 'La fecha no es valida' });
        }
        if (fecha && new Date(fecha) > new Date()) {
            return res.status(400).json({ error: 'La fecha del monitoreo no puede ser futura' });
        }

        const monitoreo = await prisma.monitoreo.update({
            where: { id: parseInt(id) },
            data: {
                fecha: fecha ? new Date(fecha) : existe.fecha,
                condicionObservada: condicionObservada || existe.condicionObservada,
                estado: estado || existe.estado,
                plaga: plaga !== undefined ? (plaga || null) : existe.plaga,
                enfermedad: enfermedad !== undefined ? (enfermedad || null) : existe.enfermedad,
                observaciones: observaciones !== undefined ? observaciones : existe.observaciones,
            },
            include: { usuario: { select: { id: true, nombre: true } } },
        });

        res.json({ mensaje: 'Monitoreo actualizado', monitoreo });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const eliminarMonitoreo = async (req, res) => {
    const { id } = req.params;

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const monitoreoExiste = await prisma.monitoreo.findUnique({
            where: { id: parseInt(id) },
        });

        if (!monitoreoExiste) {
            return res.status(404).json({ error: 'Monitoreo no encontrado' });
        }

        await prisma.monitoreo.delete({ where: { id: parseInt(id) } });
        res.json({ mensaje: 'Monitoreo eliminado' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const estadoPorLote = async (req, res) => {
    try {
        const lotes = await prisma.lote.findMany({
            where: { activo: true },
            select: {
                id: true,
                nombre: true,
                ubicacion: true,
                monitoreos: {
                    orderBy: { fecha: 'desc' },
                    take: 1,
                    include: { usuario: { select: { nombre: true } } },
                },
            },
        });

        const resultado = lotes.map((lote) => ({
            loteId: lote.id,
            nombre: lote.nombre,
            ubicacion: lote.ubicacion,
            ultimoMonitoreo: lote.monitoreos[0] || null,
        }));

        res.json({ total: resultado.length, lotes: resultado });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    crearMonitoreo,
    listarMonitoreos,
    listarPorLote,
    verMonitoreo,
    actualizarMonitoreo,
    eliminarMonitoreo,
    estadoPorLote,
};