const prisma = require('../utils/prisma');

// Crear una actividad
const crearActividad = async (req, res) => {
    try {
        const { tipo, descripcion, fecha, estado, loteId } = req.body;

        if (!tipo || !fecha || !loteId) {
            return res.status(400).json({
                error: 'Los campos tipo, fecha y loteId son obligatorios',
            });
        }

        // Revisar que el lote exista
        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
        });

        if (!loteExiste) {
            return res.status(404).json({ error: 'El lote no existe' });
        }

        const nuevaActividad = await prisma.actividad.create({
            data: {
                tipo,
                descripcion: descripcion || null,
                fecha: new Date(fecha),
                estado: estado || 'PENDIENTE',
                loteId: parseInt(loteId),
            },
            include: { lote: true },
        });

        res.status(201).json({
            mensaje: 'Actividad creada',
            actividad: nuevaActividad,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Listar todas las actividades
const listarActividades = async (req, res) => {
    try {
        const actividades = await prisma.actividad.findMany({
            include: { lote: true },
            orderBy: { fecha: 'desc' },
        });

        res.json({
            total: actividades.length,
            actividades,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Listar actividades de un lote específico
const listarPorLote = async (req, res) => {
    try {
        const { loteId } = req.params;

        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
        });

        if (!loteExiste) {
            return res.status(404).json({ error: 'El lote no existe' });
        }

        const actividades = await prisma.actividad.findMany({
            where: { loteId: parseInt(loteId) },
            orderBy: { fecha: 'desc' },
        });

        res.json({
            lote: loteExiste.nombre,
            total: actividades.length,
            actividades,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Ver una actividad por su id
const verActividad = async (req, res) => {
    try {
        const { id } = req.params;

        const actividad = await prisma.actividad.findUnique({
            where: { id: parseInt(id) },
            include: { lote: true },
        });

        if (!actividad) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        res.json({ actividad });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar una actividad
const actualizarActividad = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipo, descripcion, fecha, estado } = req.body;

        const actividadExiste = await prisma.actividad.findUnique({
            where: { id: parseInt(id) },
        });

        if (!actividadExiste) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        const actividadActualizada = await prisma.actividad.update({
            where: { id: parseInt(id) },
            data: {
                tipo: tipo || actividadExiste.tipo,
                descripcion: descripcion !== undefined ? descripcion : actividadExiste.descripcion,
                fecha: fecha ? new Date(fecha) : actividadExiste.fecha,
                estado: estado || actividadExiste.estado,
            },
            include: { lote: true },
        });

        res.json({
            mensaje: 'Actividad actualizada',
            actividad: actividadActualizada,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Eliminar una actividad
const eliminarActividad = async (req, res) => {
    try {
        const { id } = req.params;

        const actividadExiste = await prisma.actividad.findUnique({
            where: { id: parseInt(id) },
        });

        if (!actividadExiste) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        await prisma.actividad.delete({
            where: { id: parseInt(id) },
        });

        res.json({ mensaje: 'Actividad eliminada' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    crearActividad,
    listarActividades,
    listarPorLote,
    verActividad,
    actualizarActividad,
    eliminarActividad,
};