const prisma = require('../utils/prisma');
const { esIdValido, esFechaValida, ETAPAS } = require('../utils/validar');

const crearEtapa = async (req, res) => {
    try {
        const { nombre, fechaInicio, fechaFin, descripcion, loteId } = req.body;

        if (!nombre || !fechaInicio || !loteId) {
            return res.status(400).json({
                error: 'Los campos nombre, fechaInicio y loteId son obligatorios',
            });
        }

        if (!esIdValido(loteId)) {
            return res.status(400).json({ error: 'El loteId no es valido' });
        }
        if (!ETAPAS.includes(nombre)) {
            return res.status(400).json({ error: 'La etapa no es valida' });
        }
        if (!esFechaValida(fechaInicio)) {
            return res.status(400).json({ error: 'La fechaInicio no es valida' });
        }
        if (fechaFin && !esFechaValida(fechaFin)) {
            return res.status(400).json({ error: 'La fechaFin no es valida' });
        }
        if (fechaFin && new Date(fechaFin) < new Date(fechaInicio)) {
            return res.status(400).json({ error: 'La fecha de fin no puede ser anterior a la de inicio' });
        }

        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
        });

        if (!loteExiste || !loteExiste.activo) {
            return res.status(404).json({ error: 'El lote no existe o esta inactivo' });
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

        res.status(201).json({ mensaje: 'Etapa creada', etapa: nuevaEtapa });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

const listarEtapas = async (req, res) => {
    try {
        const etapas = await prisma.etapa.findMany({
            where: { lote: { activo: true } },
            include: { lote: true },
            orderBy: { fechaInicio: 'desc' },
        });
        res.json({ total: etapas.length, etapas });
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

        if (!lote || !lote.activo) {
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

const verEtapa = async (req, res) => {
    const { id } = req.params;

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
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

const actualizarEtapa = async (req, res) => {
    const { id } = req.params;

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const { nombre, fechaInicio, fechaFin, descripcion } = req.body;

        const etapaExiste = await prisma.etapa.findUnique({
            where: { id: parseInt(id) },
        });

        if (!etapaExiste) {
            return res.status(404).json({ error: 'Etapa no encontrada' });
        }

        if (nombre && !ETAPAS.includes(nombre)) {
            return res.status(400).json({ error: 'La etapa no es valida' });
        }
        if (fechaInicio && !esFechaValida(fechaInicio)) {
            return res.status(400).json({ error: 'La fechaInicio no es valida' });
        }
        if (fechaFin && !esFechaValida(fechaFin)) {
            return res.status(400).json({ error: 'La fechaFin no es valida' });
        }

        const inicioFinal = fechaInicio ? new Date(fechaInicio) : etapaExiste.fechaInicio;
        const finFinal = fechaFin !== undefined
            ? (fechaFin ? new Date(fechaFin) : null)
            : etapaExiste.fechaFin;

        if (finFinal && finFinal < inicioFinal) {
            return res.status(400).json({ error: 'La fecha de fin no puede ser anterior a la de inicio' });
        }

        const etapaActualizada = await prisma.etapa.update({
            where: { id: parseInt(id) },
            data: {
                nombre: nombre || etapaExiste.nombre,
                fechaInicio: inicioFinal,
                fechaFin: finFinal,
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

const eliminarEtapa = async (req, res) => {
    const { id } = req.params;

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const etapaExiste = await prisma.etapa.findUnique({
            where: { id: parseInt(id) },
        });

        if (!etapaExiste) {
            return res.status(404).json({ error: 'Etapa no encontrada' });
        }

        await prisma.etapa.delete({ where: { id: parseInt(id) } });
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