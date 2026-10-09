const { revisarToken } = require('../utils/jwt');

// Revisa que el usuario esté logueado
const verificarLogin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No hay token de autenticación' });
    }

    const token = authHeader.split(' ')[1];
    const datos = revisarToken(token);

    if (!datos) {
        return res.status(401).json({ error: 'Token inválido o vencido' });
    }

    req.usuario = datos;
    next();
};

// Revisa que el usuario tenga cierto rol
const verificarRol = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ error: 'No tienes permisos' });
        }

        next();
    };
};

module.exports = { verificarLogin, verificarRol };