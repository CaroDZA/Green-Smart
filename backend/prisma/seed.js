const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Iniciando seed de Green Smart...');

    console.log('Limpiando datos anteriores...');
    await prisma.monitoreo.deleteMany();
    await prisma.actividad.deleteMany();
    await prisma.etapa.deleteMany();
    await prisma.lote.deleteMany();
    await prisma.usuario.deleteMany();

    console.log('Creando usuarios...');
    const passwordEncriptada = await bcrypt.hash('123456', 10);

    const admin = await prisma.usuario.create({
        data: {
            nombre: 'Carolina Duque',
            email: 'admin@greensmart.com',
            password: passwordEncriptada,
            rol: 'ADMINISTRADOR',
        },
    });

    const coordinador = await prisma.usuario.create({
        data: {
            nombre: 'Juan Gonzalez',
            email: 'coordinador@greensmart.com',
            password: passwordEncriptada,
            rol: 'COORDINADOR',
        },
    });

    await prisma.usuario.create({
        data: {
            nombre: 'Lenis Almanza',
            email: 'operario@greensmart.com',
            password: passwordEncriptada,
            rol: 'OPERARIO',
        },
    });

    console.log('Usuario admin creado: ' + admin.email);
    console.log('Usuario coordinador creado: ' + coordinador.email);
    console.log('Usuario operario creado: operario@greensmart.com');

    console.log('Creando lotes...');
    const loteElRoble = await prisma.lote.create({
        data: {
            nombre: 'Lote El Roble',
            ubicacion: 'Sector Norte, Jardin',
            area: 3.5,
            descripcion: 'Lote principal de produccion organica',
            cultivo: 'Aguacate Hass',
        },
    });

    const loteLasPalmas = await prisma.lote.create({
        data: {
            nombre: 'Lote Las Palmas',
            ubicacion: 'Sector Sur, Jardin',
            area: 2.0,
            descripcion: 'Lote en proceso de certificacion',
            cultivo: 'Aguacate Hass',
        },
    });

    const loteLaLoma = await prisma.lote.create({
        data: {
            nombre: 'Lote La Loma',
            ubicacion: 'Vereda La Herrera',
            area: 4.2,
            descripcion: 'Lote con mayor produccion del ciclo anterior',
            cultivo: 'Aguacate Hass',
        },
    });

    console.log('Lote creado: ' + loteElRoble.nombre);
    console.log('Lote creado: ' + loteLasPalmas.nombre);
    console.log('Lote creado: ' + loteLaLoma.nombre);

    console.log('Creando etapas...');
    await prisma.etapa.createMany({
        data: [
            {
                nombre: 'VEGETATIVA',
                fechaInicio: new Date('2026-01-15'),
                fechaFin: new Date('2026-03-30'),
                descripcion: 'Crecimiento de ramas y hojas',
                loteId: loteElRoble.id,
            },
            {
                nombre: 'FLORACION',
                fechaInicio: new Date('2026-04-01'),
                fechaFin: new Date('2026-06-15'),
                descripcion: 'Aparicion y desarrollo de flores',
                loteId: loteElRoble.id,
            },
            {
                nombre: 'FRUCTIFICACION',
                fechaInicio: new Date('2026-06-16'),
                descripcion: 'Desarrollo y engrose del fruto',
                loteId: loteElRoble.id,
            },
            {
                nombre: 'VEGETATIVA',
                fechaInicio: new Date('2026-02-01'),
                fechaFin: new Date('2026-04-15'),
                descripcion: 'Fase inicial del lote',
                loteId: loteLasPalmas.id,
            },
        ],
    });
    console.log('4 etapas creadas');

    console.log('Creando actividades...');
    await prisma.actividad.createMany({
        data: [
            {
                tipo: 'RIEGO',
                descripcion: 'Riego por goteo durante 2 horas',
                fechaProgramada: new Date('2026-10-05'),
                fechaEjecucion: new Date('2026-10-05'),
                estado: 'COMPLETADA',
                novedades: 'Sin novedades, riego normal',
                costo: 45000,
                loteId: loteElRoble.id,
            },
            {
                tipo: 'FERTILIZACION',
                descripcion: 'Aplicacion de compost organico',
                fechaProgramada: new Date('2026-10-10'),
                fechaEjecucion: new Date('2026-10-10'),
                estado: 'COMPLETADA',
                novedades: 'Se aplicaron 50 kg de compost',
                costo: 120000,
                loteId: loteElRoble.id,
            },
            {
                tipo: 'PODA',
                descripcion: 'Poda de formacion de ramas bajas',
                fechaProgramada: new Date('2026-10-20'),
                estado: 'PENDIENTE',
                costo: 80000,
                loteId: loteElRoble.id,
            },
            {
                tipo: 'FUMIGACION',
                descripcion: 'Control biologico preventivo',
                fechaProgramada: new Date('2026-10-25'),
                estado: 'PENDIENTE',
                costo: 150000,
                loteId: loteElRoble.id,
            },
            {
                tipo: 'RIEGO',
                descripcion: 'Riego por aspersion',
                fechaProgramada: new Date('2026-10-07'),
                fechaEjecucion: new Date('2026-10-07'),
                estado: 'COMPLETADA',
                costo: 30000,
                loteId: loteLasPalmas.id,
            },
            {
                tipo: 'DESHIERBE',
                descripcion: 'Control manual de arvenses',
                fechaProgramada: new Date('2026-10-15'),
                estado: 'EN_PROCESO',
                costo: 60000,
                loteId: loteLasPalmas.id,
            },
            {
                tipo: 'COSECHA',
                descripcion: 'Recoleccion de frutos maduros',
                fechaProgramada: new Date('2026-11-01'),
                estado: 'PENDIENTE',
                loteId: loteLaLoma.id,
            },
            {
                tipo: 'PLATEO',
                descripcion: 'Limpieza del plato del arbol',
                fechaProgramada: new Date('2026-10-30'),
                estado: 'PENDIENTE',
                costo: 40000,
                loteId: loteLaLoma.id,
            },
        ],
    });
    console.log('8 actividades creadas');

    console.log('Creando monitoreos...');
    await prisma.monitoreo.createMany({
        data: [
            {
                fecha: new Date('2026-10-03'),
                condicionObservada: 'Plantas con buen color y crecimiento uniforme',
                estado: 'BUENO',
                observaciones: 'Sin presencia de plagas visibles',
                loteId: loteElRoble.id,
                usuarioId: coordinador.id,
            },
            {
                fecha: new Date('2026-10-08'),
                condicionObservada: 'Hojas con manchas amarillas en el sector norte',
                estado: 'REGULAR',
                plaga: 'ARANITA',
                observaciones: 'Se recomienda aumentar frecuencia de riego',
                loteId: loteElRoble.id,
                usuarioId: coordinador.id,
            },
            {
                fecha: new Date('2026-10-06'),
                condicionObservada: 'Presencia de insectos en brotes nuevos',
                estado: 'REGULAR',
                plaga: 'TRIPS',
                observaciones: 'Aplicar tratamiento preventivo',
                loteId: loteLasPalmas.id,
                usuarioId: coordinador.id,
            },
            {
                fecha: new Date('2026-10-09'),
                condicionObservada: 'Hojas marchitas en varios arboles',
                estado: 'CRITICO',
                enfermedad: 'MARCHITEZ',
                observaciones: 'URGENTE: Evaluar drenaje del suelo',
                loteId: loteLaLoma.id,
                usuarioId: coordinador.id,
            },
            {
                fecha: new Date('2026-10-11'),
                condicionObservada: 'Mejoria visible en las plantas tratadas',
                estado: 'BUENO',
                observaciones: 'Continua el tratamiento por 2 semanas mas',
                loteId: loteLaLoma.id,
                usuarioId: coordinador.id,
            },
        ],
    });
    console.log('5 monitoreos creados');

    console.log('');
    console.log('Seed completado con exito');
    console.log('');
    console.log('Credenciales de prueba:');
    console.log('   Admin:       admin@greensmart.com / 123456');
    console.log('   Coordinador: coordinador@greensmart.com / 123456');
    console.log('   Operario:    operario@greensmart.com / 123456');
}

main()
    .catch((e) => {
        console.error('Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });