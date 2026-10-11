const prisma = require('../utils/prisma');

// Crear una etapa
const crearEtapa = async (req, res) => {
    try {
        const { nombre, fechaInicio, fechaFin, descripcion, loteId } = req.body;

        if (!nombre || !fechaInicio || !loteId) {
            return res.status(400).json({
                error: 'Los campos nombre, fechaInicio y loteId son obligatorios',
            });
        }

        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
        });

        if (!loteExiste) {
            return res.status(404).json({ error: 'El lote no existe' });
        }

        const nuevaEtapa = await prisma.etapa.create({
            data: {
                nombre,
                fechaInicio: new Date(fechaInicio),
                fechaFin: fechaFin ? new Date(fechaFin) : null,
                descripcion: descripcion || null,
                loteId: parseInt(loteId),
            },
            include: { lote: true },
        });

        res.status(201).json({
            mensaje: 'Etapa creada',
            etapa: nuevaEtapa,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Listar todas las etapas
const listarEtapas = async (req, res) => {
    try {
        const etapas = await prisma.etapa.findMany({
            include: { lote: true },
            orderBy: { fechaInicio: 'desc' },
        });

        res.json({ total: etapas.length, etapas });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Listar etapas de un lote
const listarPorLote = async (req, res) => {
    try {
        const { loteId } = req.params;

        const lote = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
        });

        if (!lote) {
            return res.status(404).json({ error: 'Lote no encontrado' });
        }

        const etapas = await prisma.etapa.findMany({
            where: { loteId: parseInt(loteId) },
            orderBy: { fechaInicio: 'asc' },
        });

        res.json({ lote: lote.nombre, total: etapas.length, etapas });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Ver una etapa
const verEtapa = async (req, res) => {
    try {
        const { id } = req.params;

        const etapa = await prisma.etapa.findUnique({
            where: { id: parseInt(id) },
            include: { lote: true },
        });

        if (!etapa) {
            return res.status(404).json({ error: 'Etapa no encontrada' });
        }

        res.json({ etapa });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar una etapa
const actualizarEtapa = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, fechaInicio, fechaFin, descripcion } = req.body;

        const etapaExiste = await prisma.etapa.findUnique({
            where: { id: parseInt(id) },
        });

        if (!etapaExiste) {
            return res.status(404).json({ error: 'Etapa no encontrada' });
        }

        const etapaActualizada = await prisma.etapa.update({
            where: { id: parseInt(id) },
            data: {
                nombre: nombre || etapaExiste.nombre,
                fechaInicio: fechaInicio ? new Date(fechaInicio) : etapaExiste.fechaInicio,
                fechaFin: fechaFin !== undefined ? (fechaFin ? new Date(fechaFin) : null) : etapaExiste.fechaFin,
                descripcion: descripcion !== undefined ? descripcion : etapaExiste.descripcion,
            },
            include: { lote: true },
        });

        res.json({ mensaje: 'Etapa actualizada', etapa: etapaActualizada });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Eliminar una etapa
const eliminarEtapa = async (req, res) => {
    try {
        const { id } = req.params;

        const etapaExiste = await prisma.etapa.findUnique({
            where: { id: parseInt(id) },
        });

        if (!etapaExiste) {
            return res.status(404).json({ error: 'Etapa no encontrada' });
        }

        await prisma.etapa.delete({
            where: { id: parseInt(id) },
        });

        res.json({ mensaje: 'Etapa eliminada' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    crearEtapa,
    listarEtapas,
    listarPorLote,
    verEtapa,
    actualizarEtapa,
    eliminarEtapa,
}; 