const { esIdValido, esNumeroValido } = require('../utils/validar');
const prisma = require('../utils/prisma');

// Crear un lote nuevo
const crearLote = async (req, res) => {
    try {
        const { nombre, ubicacion, area, descripcion, cultivo } = req.body;

        if (!nombre || !ubicacion) {
            return res.status(400).json({
                error: 'El nombre y la ubicacion son obligatorios',
            });
        }

        if (area && !esNumeroValido(area)) {
            return res.status(400).json({ error: 'El area no es valida' });
        }

        // Revisar si ya existe un lote ACTIVO con ese nombre
        const loteExistente = await prisma.lote.findFirst({
            where: { nombre, activo: true },
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

// Listar lotes (con opción de ver inactivos)
const listarLotes = async (req, res) => {
    try {
        // Si en la URL llega ?inactivos=true, trae los inactivos. Si no, trae los activos.
        const soloInactivos = req.query.inactivos === 'true';

        const lotes = await prisma.lote.findMany({
            where: { activo: !soloInactivos },
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
    const { id } = req.params; // <-- Movido arriba

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const lote = await prisma.lote.findUnique({
            where: { id: parseInt(id) },
            include: { actividades: true },
        });

        // Si no existe o está inactivo, da 404
        if (!lote || !lote.activo) {
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
    const { id } = req.params; // <-- Movido arriba

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const { nombre, ubicacion, area, descripcion, cultivo } = req.body;

        if (area !== undefined && area !== null && !esNumeroValido(area)) {
            return res.status(400).json({ error: 'El area no es valida' });
        }

        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(id) },
        });

        if (!loteExiste || !loteExiste.activo) {
            return res.status(404).json({ error: 'Lote no encontrado' });
        }

        // Si cambian el nombre, verificar que no esté repetido en otro lote activo
        if (nombre && nombre !== loteExiste.nombre) {
            const repetido = await prisma.lote.findFirst({
                where: { nombre, activo: true },
            });
            if (repetido) {
                return res.status(409).json({ error: 'Ya existe un lote con ese nombre' });
            }
        }

        const loteActualizado = await prisma.lote.update({
            where: { id: parseInt(id) },
            data: {
                nombre: nombre || loteExiste.nombre,
                ubicacion: ubicacion || loteExiste.ubicacion,
                // Permitir dejar el area en null
                area: area !== undefined ? (area === null ? null : parseFloat(area)) : loteExiste.area,
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
    const { id } = req.params; // <-- Movido arriba

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(id) },
        });

        if (!loteExiste || !loteExiste.activo) {
            return res.status(404).json({ error: 'Lote no encontrado' });
        }

        // Borrado lógico: solo se marca como inactivo
        await prisma.lote.update({
            where: { id: parseInt(id) },
            data: { activo: false },
        });

        res.json({ mensaje: 'Lote desactivado (historial conservado)' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { crearLote, listarLotes, verLote, actualizarLote, eliminarLote };