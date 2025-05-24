/*
  Warnings:

  - Added the required column `estante` to the `Producto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `repisa` to the `Producto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "estante" TEXT NOT NULL,
ADD COLUMN     "repisa" TEXT NOT NULL;
