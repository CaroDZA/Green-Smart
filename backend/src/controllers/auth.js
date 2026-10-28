const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { crearToken } = require('../utils/jwt');
const { esIdValido } = require('../utils/validar');

// Registrar un usuario nuevo
const registrar = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        const existe = await prisma.usuario.findUnique({ where: { email } });

        if (existe) {
            return res.status(409).json({ error: 'Ese email ya está registrado' });
        }

        // Encriptamos la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        const nuevoUsuario = await prisma.usuario.create({
            data: {
                nombre,
                email,
                password: passwordEncriptada,
                rol: 'OPERARIO',
            },
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
            },
        });

        const token = crearToken({
            id: nuevoUsuario.id,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
        });

        res.status(201).json({
            mensaje: 'Usuario registrado',
            usuario: nuevoUsuario,
            token,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Iniciar sesión
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        const usuario = await prisma.usuario.findUnique({ where: { email } });

        if (!usuario) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }

        const coincide = await bcrypt.compare(password, usuario.password);

        if (!coincide) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos' });
        }

        const token = crearToken({
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
        });

        res.json({
            mensaje: 'Login exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
            },
            token,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Listar usuarios (solo Admin y coordinador)
const listarUsuarios = async (req, res) => {
    try {
        // Si es COORDINADOR, solo ve a los OPERARIOS. Si es ADMIN, ve a todos.
        let filtro = {};
        if (req.usuario.rol === 'COORDINADOR') {
            filtro.rol = 'OPERARIO';
        }

        const usuarios = await prisma.usuario.findMany({
            where: filtro,
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
                activo: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ total: usuarios.length, usuarios });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Restablecer la contraseña de un usuario (solo Admin)
const restablecerPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevaPassword } = req.body;

        if (!esIdValido(id)) {
            return res.status(400).json({ error: 'El id no es valido' });
        }

        if (!nuevaPassword || typeof nuevaPassword !== 'string' || nuevaPassword.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener minimo 6 caracteres' });
        }

        const usuario = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(nuevaPassword, salt);

        await prisma.usuario.update({
            where: { id: usuario.id },
            data: { password: hash },
        });

        res.json({ mensaje: 'Contraseña de ' + usuario.nombre + ' actualizada exitosamente' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Actualizar nombre y correo de un usuario (solo Admin)
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email } = req.body;

        if (!esIdValido(id)) {
            return res.status(400).json({ error: 'El id no es valido' });
        }

        if (!nombre || !email) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        const usuario = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // El correo nuevo no puede tenerlo otro usuario
        const repetido = await prisma.usuario.findUnique({ where: { email } });
        if (repetido && repetido.id !== usuario.id) {
            return res.status(409).json({ error: 'Ese email ya está registrado' });
        }

        const actualizado = await prisma.usuario.update({
            where: { id: usuario.id },
            data: { nombre, email },
            select: { id: true, nombre: true, email: true, rol: true },
        });

        res.json({ mensaje: 'Usuario actualizado', usuario: actualizado });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Cambiar el rol de un usuario (solo Admin)
const cambiarRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;

        if (!esIdValido(id)) {
            return res.status(400).json({ error: 'El id no es valido' });
        }

        const rolesValidos = ['ADMINISTRADOR', 'COORDINADOR', 'OPERARIO'];
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({ error: 'Rol no válido' });
        }

        if (parseInt(id) === req.usuario.id) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
        }

        const existe = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
        if (!existe) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: { rol },
            select: { id: true, nombre: true, email: true, rol: true },
        });

        res.json({ mensaje: 'Rol actualizado', usuario });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { registrar, login, listarUsuarios, cambiarRol, restablecerPassword, actualizarUsuario };