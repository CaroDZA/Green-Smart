const prisma = require('../utils/prisma');

// Crear un monitoreo
const crearMonitoreo = async (req, res) => {
    try {
        const {
            fecha,
            condicionObservada,
            estado,
            plaga,
            enfermedad,
            observaciones,
            loteId,
        } = req.body;

        if (!condicionObservada || !estado || !loteId) {
            return res.status(400).json({
                error: 'Los campos condicionObservada, estado y loteId son obligatorios',
            });
        }

        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
        });

        if (!loteExiste) {
            return res.status(404).json({ error: 'El lote no existe' });
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

        res.status(201).json({
            mensaje: 'Monitoreo registrado',
            monitoreo: nuevoMonitoreo,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Listar todos los monitoreos
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

// Listar monitoreos de un lote
const listarPorLote = async (req, res) => {
    try {
        const { loteId } = req.params;

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

// Ver un monitoreo
const verMonitoreo = async (req, res) => {
    try {
        const { id } = req.params;

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

// Eliminar un monitoreo
const eliminarMonitoreo = async (req, res) => {
    try {
        const { id } = req.params;

        const monitoreoExiste = await prisma.monitoreo.findUnique({
            where: { id: parseInt(id) },
        });

        if (!monitoreoExiste) {
            return res.status(404).json({ error: 'Monitoreo no encontrado' });
        }

        await prisma.monitoreo.delete({
            where: { id: parseInt(id) },
        });

        res.json({ mensaje: 'Monitoreo eliminado' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Panel de estado: último monitoreo de cada lote activo
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
    eliminarMonitoreo,
    estadoPorLote,
};