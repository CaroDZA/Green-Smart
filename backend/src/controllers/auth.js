const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { crearToken } = require('../utils/jwt');

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

// Listar usuarios (solo Admin)
const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: {
                id: true,
                nombre: true,
                email: true,
                rol: true,
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

// Cambiar el rol de un usuario (solo Admin)
const cambiarRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;

        const rolesValidos = ['ADMINISTRADOR', 'COORDINADOR', 'OPERARIO'];
        if (!rolesValidos.includes(rol)) {
            return res.status(400).json({ error: 'Rol no válido' });
        }

        if (parseInt(id) === req.usuario.id) {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
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

module.exports = { registrar, login, listarUsuarios, cambiarRol };