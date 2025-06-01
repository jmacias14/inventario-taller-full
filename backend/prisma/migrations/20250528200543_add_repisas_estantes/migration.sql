/*
  Warnings:

  - You are about to drop the column `estante` on the `Producto` table. All the data in the column will be lost.
  - You are about to drop the column `repisa` on the `Producto` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacion` on the `Producto` table. All the data in the column will be lost.
  - Added the required column `tipoUbicacion` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Producto" DROP COLUMN "estante",
DROP COLUMN "repisa",
DROP COLUMN "ubicacion",
ADD COLUMN     "estanteId" INTEGER,
ADD COLUMN     "repisaId" INTEGER,
ADD COLUMN     "tipoUbicacion" TEXT NOT NULL,
ADD COLUMN     "ubicacionLibre" TEXT;

-- CreateTable
CREATE TABLE "Repisa" (
    "id" SERIAL NOT NULL,
    "letra" TEXT NOT NULL,

    CONSTRAINT "Repisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estante" (
    "id" SERIAL NOT NULL,
    "numero" TEXT NOT NULL,
    "repisaId" INTEGER NOT NULL,

    CONSTRAINT "Estante_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Repisa_letra_key" ON "Repisa"("letra");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_repisaId_fkey" FOREIGN KEY ("repisaId") REFERENCES "Repisa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_estanteId_fkey" FOREIGN KEY ("estanteId") REFERENCES "Estante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estante" ADD CONSTRAINT "Estante_repisaId_fkey" FOREIGN KEY ("repisaId") REFERENCES "Repisa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
