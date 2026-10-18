// Revisa que un id sea un numero entero positivo
const esIdValido = (valor) => {
    const numero = parseInt(valor);
    return !isNaN(numero) && numero > 0;
};

// Revisa que un texto se pueda convertir en fecha
const esFechaValida = (valor) => {
    const fecha = new Date(valor);
    return !isNaN(fecha.getTime());
};

// Revisa que sea un numero valido (para area y costo)
const esNumeroValido = (valor) => {
    const numero = parseFloat(valor);
    return !isNaN(numero) && numero >= 0;
};

// Listas de valores permitidos
const TIPOS_ACTIVIDAD = ['PLATEO', 'DESHIERBE', 'FERTILIZACION', 'RIEGO', 'PODA', 'FUMIGACION', 'COSECHA', 'MONITOREO', 'OTRA'];
const ESTADOS_ACTIVIDAD = ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];
const ETAPAS = ['VEGETATIVA', 'FLORACION', 'FRUCTIFICACION', 'MADURACION', 'REPOSO'];
const ESTADOS_CULTIVO = ['BUENO', 'REGULAR', 'CRITICO'];
const PLAGAS = ['PICUDO', 'PASADOR', 'CHINCHE', 'ARANITA', 'TRIPS', 'COCHINILLA', 'BARRENADOR', 'OTRA'];
const ENFERMEDADES = ['MARCHITEZ', 'PUDRICION_RAIZ', 'ANTRACNOSIS', 'OTRA'];

module.exports = {
    esIdValido,
    esFechaValida,
    esNumeroValido,
    TIPOS_ACTIVIDAD,
    ESTADOS_ACTIVIDAD,
    ETAPAS,
    ESTADOS_CULTIVO,
    PLAGAS,
    ENFERMEDADES,
};