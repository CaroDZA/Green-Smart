-- AlterTable
ALTER TABLE "Actividad" ADD COLUMN     "asignadoAId" INTEGER,
ADD COLUMN     "creadoPorId" INTEGER;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_asignadoAId_fkey" FOREIGN KEY ("asignadoAId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
