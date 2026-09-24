/*
  Warnings:

  - Added the required column `tipo` to the `projeto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "tipo" TEXT NOT NULL;
