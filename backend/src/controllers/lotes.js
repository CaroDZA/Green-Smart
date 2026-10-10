const prisma = require('../utils/prisma');

// Crear un lote nuevo
const crearLote = async (req, res) => {
    try {
        const { nombre, ubicacion, area, descripcion, cultivo } = req.body;

        if (!nombre || !ubicacion) {
            return res.status(400).json({
                error: 'El nombre y la ubicación son obligatorios',
            });
        }

        // Revisar si ya existe un lote con ese nombre
        const loteExistente = await prisma.lote.findFirst({
            where: { nombre },
        });

        if (loteExistente) {
            return res.status(409).json({
                error: 'Ya existe un lote con ese nombre',
            });
        }

        const nuevoLote = await prisma.lote.create({
            data: {
                nombre,
                ubicacion,
                area: area ? parseFloat(area) : null,
                descripcion: descripcion || null,
                cultivo: cultivo || 'Aguacate',
            },
        });

        res.status(201).json({
            mensaje: 'Lote creado',
            lote: nuevoLote,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Listar todos los lotes
const listarLotes = async (req, res) => {
    try {
        const lotes = await prisma.lote.findMany({
            orderBy: { createdAt: 'desc' },
        });

        res.json({
            total: lotes.length,
            lotes,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Ver un lote por su id
const verLote = async (req, res) => {
    try {
        const { id } = req.params;

        const lote = await prisma.lote.findUnique({
            where: { id: parseInt(id) },
            include: { actividades: true },
        });

        if (!lote) {
            return res.status(404).json({ error: 'Lote no encontrado' });
        }

        res.json({ lote });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar un lote
const actualizarLote = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, ubicacion, area, descripcion, cultivo } = req.body;

        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(id) },
        });

        if (!loteExiste) {
            return res.status(404).json({ error: 'Lote no encontrado' });
        }

        const loteActualizado = await prisma.lote.update({
            where: { id: parseInt(id) },
            data: {
                nombre: nombre || loteExiste.nombre,
                ubicacion: ubicacion || loteExiste.ubicacion,
                area: area !== undefined ? parseFloat(area) : loteExiste.area,
                descripcion: descripcion !== undefined ? descripcion : loteExiste.descripcion,
                cultivo: cultivo || loteExiste.cultivo,
            },
        });

        res.json({
            mensaje: 'Lote actualizado',
            lote: loteActualizado,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Eliminar un lote
const eliminarLote = async (req, res) => {
    try {
        const { id } = req.params;

        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(id) },
        });

        if (!loteExiste) {
            return res.status(404).json({ error: 'Lote no encontrado' });
        }

        await prisma.lote.delete({
            where: { id: parseInt(id) },
        });

        res.json({ mensaje: 'Lote eliminado' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { crearLote, listarLotes, verLote, actualizarLote, eliminarLote };