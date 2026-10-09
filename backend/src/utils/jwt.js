const jwt = require('jsonwebtoken');
require('dotenv').config();

// Creamos un token con los datos del usuario
const crearToken = (datos) => {
  return jwt.sign(datos, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Revisamos si un token es válido
const revisarToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { crearToken, revisarToken };