const prisma = require('../utils/prisma');
const { esIdValido, esFechaValida, esNumeroValido, TIPOS_ACTIVIDAD, ESTADOS_ACTIVIDAD } = require('../utils/validar');

// Revisa que el usuario al que se asigna la tarea exista.
// Devuelve un texto con el error, o null si todo esta bien.
const validarAsignado = async (asignadoA) => {
    if (asignadoA === undefined || asignadoA === null || asignadoA === '') {
        return null;
    }
    if (!esIdValido(asignadoA)) {
        return 'El usuario asignado no es valido';
    }
    const usuario = await prisma.usuario.findUnique({ where: { id: parseInt(asignadoA) } });
    if (!usuario) {
        return 'El usuario asignado no existe';
    }
    return null;
};

// Crear una actividad
const crearActividad = async (req, res) => {
    try {
        const { tipo, descripcion, fechaProgramada, estado, loteId, costo, asignadoA } = req.body;

        if (!tipo || !fechaProgramada || !loteId) {
            return res.status(400).json({
                error: 'Los campos tipo, fechaProgramada y loteId son obligatorios',
            });
        }

        // VALIDACIONES
        if (!esIdValido(loteId)) {
            return res.status(400).json({ error: 'El loteId no es valido' });
        }
        if (!TIPOS_ACTIVIDAD.includes(tipo)) {
            return res.status(400).json({ error: 'El tipo de actividad no es valido' });
        }
        if (!esFechaValida(fechaProgramada)) {
            return res.status(400).json({ error: 'La fechaProgramada no es valida' });
        }
        if (estado && !ESTADOS_ACTIVIDAD.includes(estado)) {
            return res.status(400).json({ error: 'El estado no es valido' });
        }
        if (costo && !esNumeroValido(costo)) {
            return res.status(400).json({ error: 'El costo no es valido' });
        }

        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
        });

        // Verificar que el lote exista y esté activo
        if (!loteExiste || !loteExiste.activo) {
            return res.status(404).json({ error: 'El lote no existe' });
        }

        const errorAsignado = await validarAsignado(asignadoA);
        if (errorAsignado) {
            return res.status(400).json({ error: errorAsignado });
        }

        const nuevaActividad = await prisma.actividad.create({
            data: {
                tipo,
                descripcion: descripcion || null,
                fechaProgramada: new Date(fechaProgramada),
                estado: estado || 'PENDIENTE',
                loteId: parseInt(loteId),
                costo: costo ? parseFloat(costo) : null,
                creadoPorId: req.usuario.id, // <-- Guarda quién la creó
                asignadoAId: asignadoA ? parseInt(asignadoA) : null, // <-- A quién se asigna
            },
            include: {
                lote: true,
                asignadoA: { select: { id: true, nombre: true, rol: true } },
                creadoPor: { select: { id: true, nombre: true } }
            },
        });

        res.status(201).json({ mensaje: 'Actividad creada', actividad: nuevaActividad });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};
// Listar todas las actividades
const listarActividades = async (req, res) => {
    try {
        // Filtro base: solo de lotes activos
        let filtro = { lote: { activo: true } };

        // Si es operario, SOLO ve sus tareas asignadas
        if (req.usuario.rol === 'OPERARIO') {
            filtro.asignadoAId = req.usuario.id;
        }

        const actividades = await prisma.actividad.findMany({
            where: filtro,
            include: {
                lote: true,
                asignadoA: { select: { id: true, nombre: true, rol: true } },
                creadoPor: { select: { id: true, nombre: true } }
            },
            orderBy: { fechaProgramada: 'desc' },
        });

        res.json({ total: actividades.length, actividades });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Listar por lote
const listarPorLote = async (req, res) => {
    const { loteId } = req.params;

    if (!esIdValido(loteId)) {
        return res.status(400).json({ error: 'El loteId no es valido' });
    }

    try {
        const loteExiste = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
        });

        if (!loteExiste) {
            return res.status(404).json({ error: 'El lote no existe' });
        }

        if (!loteExiste.activo) {
            return res.status(404).json({ error: 'El lote no existe o esta inactivo' });
        }

        // El operario solo ve sus tareas asignadas
        const filtro = { loteId: parseInt(loteId) };
        if (req.usuario.rol === 'OPERARIO') {
            filtro.asignadoAId = req.usuario.id;
        }

        const actividades = await prisma.actividad.findMany({
            where: filtro,
            orderBy: { fechaProgramada: 'desc' },
        });

        res.json({ lote: loteExiste.nombre, total: actividades.length, actividades });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Ver una actividad
const verActividad = async (req, res) => {
    const { id } = req.params;

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const actividad = await prisma.actividad.findUnique({
            where: { id: parseInt(id) },
            include: { lote: true },
        });

        if (!actividad) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        // El operario solo puede ver sus tareas asignadas
        if (req.usuario.rol === 'OPERARIO' && actividad.asignadoAId !== req.usuario.id) {
            return res.status(403).json({ error: 'Esta tarea no esta asignada a ti' });
        }

        res.json({ actividad });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar una actividad
const actualizarActividad = async (req, res) => {
    const { id } = req.params;

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const { tipo, descripcion, fechaProgramada, fechaEjecucion, estado, novedades, costo, asignadoA } = req.body;

        const actividadExiste = await prisma.actividad.findUnique({ where: { id: parseInt(id) } });

        if (!actividadExiste) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        // No editar tareas completadas
        if (actividadExiste.estado === 'COMPLETADA') {
            return res.status(400).json({
                error: 'La actividad ya esta completada. Cree una nueva tarea para modificaciones.'
            });
        }

        // VALIDACIONES
        if (tipo && !TIPOS_ACTIVIDAD.includes(tipo)) {
            return res.status(400).json({ error: 'El tipo no es valido' });
        }
        if (estado && !ESTADOS_ACTIVIDAD.includes(estado)) {
            return res.status(400).json({ error: 'El estado no es valido' });
        }
        if (fechaProgramada && !esFechaValida(fechaProgramada)) {
            return res.status(400).json({ error: 'La fechaProgramada no es valida' });
        }
        if (fechaEjecucion && !esFechaValida(fechaEjecucion)) {
            return res.status(400).json({ error: 'La fechaEjecucion no es valida' });
        }
        if (costo !== undefined && costo !== null && !esNumeroValido(costo)) {
            return res.status(400).json({ error: 'El costo no es valido' });
        }

        const errorAsignado = await validarAsignado(asignadoA);
        if (errorAsignado) {
            return res.status(400).json({ error: errorAsignado });
        }

        // Auto-completar fecha si el estado pasa a COMPLETADA
        let fechaFinal = fechaEjecucion !== undefined
            ? (fechaEjecucion ? new Date(fechaEjecucion) : null)
            : actividadExiste.fechaEjecucion;

        if (estado === 'COMPLETADA' && !fechaFinal) {
            fechaFinal = new Date();
        }

        const actividadActualizada = await prisma.actividad.update({
            where: { id: parseInt(id) },
            data: {
                tipo: tipo || actividadExiste.tipo,
                descripcion: descripcion !== undefined ? descripcion : actividadExiste.descripcion,
                fechaProgramada: fechaProgramada ? new Date(fechaProgramada) : actividadExiste.fechaProgramada,
                fechaEjecucion: fechaFinal,
                estado: estado || actividadExiste.estado,
                novedades: novedades !== undefined ? novedades : actividadExiste.novedades,
                costo: costo !== undefined ? (costo === null ? null : parseFloat(costo)) : actividadExiste.costo,
                asignadoAId: asignadoA !== undefined ? (asignadoA ? parseInt(asignadoA) : null) : actividadExiste.asignadoAId,
            },
            include: { lote: true, asignadoA: { select: { nombre: true } } },
        });

        res.json({ mensaje: 'Actividad actualizada', actividad: actividadActualizada });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Eliminar una actividad
const eliminarActividad = async (req, res) => {
    const { id } = req.params;

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
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

// Función Completar actividad (Para el Operario)
const completarActividad = async (req, res) => {
    const { id } = req.params;
    const { novedades } = req.body;

    if (!esIdValido(id)) {
        return res.status(400).json({ error: 'El id no es valido' });
    }

    try {
        const actividad = await prisma.actividad.findUnique({ where: { id: parseInt(id) } });

        if (!actividad) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }
        // El operario solo puede completar sus propias tareas
        if (req.usuario.rol === 'OPERARIO' && actividad.asignadoAId !== req.usuario.id) {
            return res.status(403).json({ error: 'Esta tarea no esta asignada a ti' });
        }
        if (actividad.estado === 'COMPLETADA' || actividad.estado === 'CANCELADA') {
            return res.status(400).json({ error: 'Esta actividad ya esta cerrada' });
        }

        const actualizada = await prisma.actividad.update({
            where: { id: parseInt(id) },
            data: {
                estado: 'COMPLETADA',
                fechaEjecucion: new Date(),
                novedades: novedades !== undefined ? novedades : actividad.novedades,
            },
            include: { lote: true },
        });

        res.json({ mensaje: 'Actividad completada', actividad: actualizada });
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
    completarActividad,
};