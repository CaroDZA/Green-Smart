const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { crearToken } = require('../utils/jwt');
const { esIdValido } = require('../utils/validar');

// Registrar un usuario nuevo (Público)
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

        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        const nuevoUsuario = await prisma.usuario.create({
            data: {
                nombre,
                email,
                password: passwordEncriptada,
                rol: 'OPERARIO', // Siempre operario por seguridad
            },
            select: { id: true, nombre: true, email: true, rol: true },
        });

        const token = crearToken({
            id: nuevoUsuario.id,
            email: nuevoUsuario.email,
            rol: nuevoUsuario.rol,
        });

        res.status(201).json({ mensaje: 'Usuario registrado', usuario: nuevoUsuario, token });
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
            usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
            token,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Recuperar contraseña (Público, usando correo)
const recuperarPassword = async (req, res) => {
    try {
        const { email, nuevaPassword } = req.body;

        if (!email || !nuevaPassword) {
            return res.status(400).json({ error: 'El email y la nueva contraseña son obligatorios' });
        }
        if (nuevaPassword.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener minimo 6 caracteres' });
        }

        const emailLimpio = email.trim().toLowerCase();
        const usuario = await prisma.usuario.findUnique({ where: { email: emailLimpio } });

        if (!usuario) {
            return res.status(404).json({ error: 'No existe un usuario registrado con ese correo' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(nuevaPassword, salt);

        await prisma.usuario.update({
            where: { id: usuario.id },
            data: { password: hash },
        });

        res.json({ mensaje: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesion.' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Listar usuarios (Admin y Coordinador)
const listarUsuarios = async (req, res) => {
    try {
        let filtro = {};
        if (req.usuario.rol === 'COORDINADOR') {
            filtro.rol = 'OPERARIO';
        }

        const usuarios = await prisma.usuario.findMany({
            where: filtro,
            select: { id: true, nombre: true, email: true, rol: true, activo: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ total: usuarios.length, usuarios });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Cambiar el rol (Solo Admin)
const cambiarRol = async (req, res) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;

        if (!esIdValido(id)) return res.status(400).json({ error: 'El id no es valido' });

        const rolesValidos = ['ADMINISTRADOR', 'COORDINADOR', 'OPERARIO'];
        if (!rolesValidos.includes(rol)) return res.status(400).json({ error: 'Rol no válido' });
        if (parseInt(id) === req.usuario.id) return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });

        const existe = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
        if (!existe) return res.status(404).json({ error: 'Usuario no encontrado' });

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

// Actualizar nombre y correo desde el panel Admin
const actualizarDatosUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email } = req.body;

        if (!esIdValido(id)) return res.status(400).json({ error: 'El id no es valido' });

        const existe = await prisma.usuario.findUnique({ where: { id: parseInt(id) } });
        if (!existe) return res.status(404).json({ error: 'Usuario no encontrado' });

        const emailLimpio = email ? email.trim().toLowerCase() : existe.email;

        if (emailLimpio !== existe.email) {
            const ocupado = await prisma.usuario.findUnique({ where: { email: emailLimpio } });
            if (ocupado) return res.status(409).json({ error: 'El correo ya esta en uso' });
        }

        const usuario = await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: { nombre: nombre || existe.nombre, email: emailLimpio },
            select: { id: true, nombre: true, email: true, rol: true }
        });

        res.json({ mensaje: 'Datos actualizados', usuario });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Cambiar contraseña desde el panel Admin
const cambiarPasswordAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevaPassword } = req.body;

        if (!esIdValido(id)) return res.status(400).json({ error: 'El id no es valido' });
        if (!nuevaPassword || nuevaPassword.length < 6) return res.status(400).json({ error: 'La contraseña debe tener minimo 6 caracteres' });

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(nuevaPassword, salt);

        await prisma.usuario.update({
            where: { id: parseInt(id) },
            data: { password: hash },
        });

        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    registrar,
    login,
    recuperarPassword,
    listarUsuarios,
    cambiarRol,
    actualizarDatosUsuario,
    cambiarPasswordAdmin
};