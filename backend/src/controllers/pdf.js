const PDFDocument = require('pdfkit');
const prisma = require('../utils/prisma');
const { esIdValido } = require('../utils/validar');

// Genera un PDF con el historial completo de un lote
const generarPDFLote = async (req, res) => {
    try {
        const { loteId } = req.params;

        if (!esIdValido(loteId)) {
            return res.status(400).json({ error: 'El loteId no es valido' });
        }

        const lote = await prisma.lote.findUnique({
            where: { id: parseInt(loteId) },
            include: {
                actividades: { orderBy: { fechaProgramada: 'asc' } },
                monitoreos: {
                    include: { usuario: { select: { nombre: true } } },
                    orderBy: { fecha: 'asc' },
                },
                etapas: { orderBy: { fechaInicio: 'asc' } },
            },
        });

        if (!lote) {
            return res.status(404).json({ error: 'Lote no encontrado' });
        }

        // Crear el documento PDF
        const doc = new PDFDocument({ margin: 50 });

        // Configurar la respuesta para que devuelva un PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=historial-lote-${lote.id}.pdf`
        );

        doc.pipe(res);

        doc
            .fontSize(20)
            .fillColor('#2E7D32')
            .text('GREEN SMART', { align: 'center' })
            .fontSize(12)
            .fillColor('#555555')
            .text('Agroindustria Las Violetas', { align: 'center' })
            .moveDown(0.5);

        doc
            .moveTo(50, doc.y)
            .lineTo(550, doc.y)
            .strokeColor('#2E7D32')
            .stroke()
            .moveDown(1);

        doc
            .fontSize(16)
            .fillColor('#000000')
            .text(`Historial del Lote: ${lote.nombre}`, { underline: true })
            .moveDown(0.5);

        doc
            .fontSize(11)
            .fillColor('#333333')
            .text(`Ubicación: ${lote.ubicacion}`)
            .text(`Área: ${lote.area ? lote.area + ' hectáreas' : 'No especificada'}`)
            .text(`Cultivo: ${lote.cultivo}`)
            .text(`Estado: ${lote.activo ? 'Activo' : 'Inactivo'}`)
            .text(`Fecha del reporte: ${new Date().toLocaleDateString('es-CO')}`)
            .moveDown(1);

        if (lote.etapas.length > 0) {
            doc
                .fontSize(14)
                .fillColor('#2E7D32')
                .text('Etapas del Cultivo', { underline: true })
                .moveDown(0.3);

            lote.etapas.forEach((etapa) => {
                const fechaInicio = new Date(etapa.fechaInicio).toLocaleDateString('es-CO');
                const fechaFin = etapa.fechaFin
                    ? new Date(etapa.fechaFin).toLocaleDateString('es-CO')
                    : 'En curso';

                doc
                    .fontSize(11)
                    .fillColor('#000000')
                    .text(`• ${etapa.nombre}`)
                    .fontSize(10)
                    .fillColor('#555555')
                    .text(`   Del ${fechaInicio} al ${fechaFin}`, { indent: 10 })
                    .moveDown(0.2);
            });

            doc.moveDown(1);
        }

        doc
            .fontSize(14)
            .fillColor('#2E7D32')
            .text('Actividades Registradas', { underline: true })
            .moveDown(0.3);

        if (lote.actividades.length === 0) {
            doc
                .fontSize(11)
                .fillColor('#777777')
                .text('No hay actividades registradas.')
                .moveDown(0.5);
        } else {
            lote.actividades.forEach((act) => {
                const fecha = new Date(act.fechaProgramada).toLocaleDateString('es-CO');
                doc
                    .fontSize(11)
                    .fillColor('#000000')
                    .text(`• [${fecha}] ${act.tipo} — ${act.estado}`)
                    .fontSize(10)
                    .fillColor('#555555');

                if (act.descripcion) {
                    doc.text(`   ${act.descripcion}`, { indent: 10 });
                }
                if (act.novedades) {
                    doc.text(`   Novedades: ${act.novedades}`, { indent: 10 });
                }
                if (act.costo) {
                    doc.text(`   Costo: $${act.costo.toLocaleString('es-CO')}`, { indent: 10 });
                }
                doc.moveDown(0.3);
            });
        }

        doc.moveDown(1);

        doc
            .fontSize(14)
            .fillColor('#2E7D32')
            .text('Monitoreos del Cultivo', { underline: true })
            .moveDown(0.3);

        if (lote.monitoreos.length === 0) {
            doc
                .fontSize(11)
                .fillColor('#777777')
                .text('No hay monitoreos registrados.')
                .moveDown(0.5);
        } else {
            lote.monitoreos.forEach((mon) => {
                const fecha = new Date(mon.fecha).toLocaleDateString('es-CO');
                doc
                    .fontSize(11)
                    .fillColor('#000000')
                    .text(`• [${fecha}] Estado: ${mon.estado}`)
                    .fontSize(10)
                    .fillColor('#555555')
                    .text(`   Condición: ${mon.condicionObservada}`, { indent: 10 });

                if (mon.plaga) {
                    doc.text(`   Plaga detectada: ${mon.plaga}`, { indent: 10 });
                }
                if (mon.enfermedad) {
                    doc.text(`   Enfermedad detectada: ${mon.enfermedad}`, { indent: 10 });
                }
                if (mon.observaciones) {
                    doc.text(`   Observaciones: ${mon.observaciones}`, { indent: 10 });
                }
                doc
                    .text(`   Registrado por: ${mon.usuario.nombre}`, { indent: 10 })
                    .moveDown(0.3);
            });
        }

        doc
            .moveDown(2)
            .fontSize(9)
            .fillColor('#999999')
            .text('Este reporte fue generado automáticamente por Green Smart.', {
                align: 'center',
            });

        doc.end();
    } catch (error) {
        console.log(error);
        if (res.headersSent) {
            return res.end();
        }
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { generarPDFLote };