/*
  Warnings:

  - You are about to drop the column `fecha` on the `Actividad` table. All the data in the column will be lost.
  - The `estado` column on the `Actividad` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `fechaProgramada` to the `Actividad` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tipo` on the `Actividad` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EtapaCultivo" AS ENUM ('VEGETATIVA', 'FLORACION', 'FRUCTIFICACION', 'MADURACION', 'REPOSO');

-- CreateEnum
CREATE TYPE "TipoPlaga" AS ENUM ('PICUDO', 'PASADOR', 'CHINCHE', 'ARANITA', 'TRIPS', 'COCHINILLA', 'BARRENADOR', 'OTRA');

-- CreateEnum
CREATE TYPE "TipoEnfermedad" AS ENUM ('MARCHITEZ', 'PUDRICION_RAIZ', 'ANTRACNOSIS', 'OTRA');

-- CreateEnum
CREATE TYPE "EstadoCultivo" AS ENUM ('BUENO', 'REGULAR', 'CRITICO');

-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('PLATEO', 'DESHIERBE', 'FERTILIZACION', 'RIEGO', 'PODA', 'FUMIGACION', 'COSECHA', 'MONITOREO', 'OTRA');

-- CreateEnum
CREATE TYPE "EstadoActividad" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "Actividad" DROP COLUMN "fecha",
ADD COLUMN     "costo" DOUBLE PRECISION,
ADD COLUMN     "fechaEjecucion" TIMESTAMP(3),
ADD COLUMN     "fechaProgramada" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "novedades" TEXT,
DROP COLUMN "tipo",
ADD COLUMN     "tipo" "TipoActividad" NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" "EstadoActividad" NOT NULL DEFAULT 'PENDIENTE';

-- AlterTable
ALTER TABLE "Lote" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Etapa" (
    "id" SERIAL NOT NULL,
    "nombre" "EtapaCultivo" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3),
    "descripcion" TEXT,
    "loteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Etapa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitoreo" (
    "id" SERIAL NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "condicionObservada" TEXT NOT NULL,
    "estado" "EstadoCultivo" NOT NULL,
    "plaga" "TipoPlaga",
    "enfermedad" "TipoEnfermedad",
    "observaciones" TEXT,
    "loteId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitoreo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Etapa" ADD CONSTRAINT "Etapa_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitoreo" ADD CONSTRAINT "Monitoreo_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "Lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitoreo" ADD CONSTRAINT "Monitoreo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
