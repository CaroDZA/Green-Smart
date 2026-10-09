const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { crearToken } = require('../utils/jwt');

// Registrar un usuario nuevo
const registrar = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

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
                rol: rol || 'OPERARIO',
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

module.exports = { registrar, login };