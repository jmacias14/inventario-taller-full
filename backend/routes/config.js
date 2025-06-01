import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Crear repisa y estantes
router.post('/repisa', async (req, res) => {
  let { letra, cantidadEstantes } = req.body;

  if (
    !letra ||
    typeof letra !== 'string' ||
    !cantidadEstantes ||
    isNaN(cantidadEstantes) ||
    cantidadEstantes <= 0
  ) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  letra = letra.trim().toUpperCase();

  try {
    const existente = await prisma.repisa.findUnique({ where: { letra } });
    if (existente) {
      return res.status(409).json({ error: 'Ya existe una repisa con esa letra.' });
    }

    const repisa = await prisma.repisa.create({ data: { letra } });

    const estantes = Array.from({ length: cantidadEstantes }, (_, i) => ({
      numero: String(i + 1),
      repisaId: repisa.id,
    }));

    await prisma.estante.createMany({ data: estantes });

    res.status(201).json({ mensaje: 'Repisa y estantes creados correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear repisa y estantes.' });
  }
});

// Obtener repisas con sus estantes
router.get('/repisa', async (req, res) => {
  try {
    const repisas = await prisma.repisa.findMany({
      include: {
        estantes: true,
      },
      orderBy: {
        letra: 'asc',
      },
    });

    res.json(repisas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener repisas.' });
  }
});

// Eliminar repisa y sus estantes
router.delete('/repisa/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.estante.deleteMany({ where: { repisaId: id } });
    await prisma.repisa.delete({ where: { id } });
    res.json({ mensaje: 'Repisa eliminada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar repisa.' });
  }
});

// Actualizar cantidad de estantes (solo agregar)
router.put('/repisa/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const nuevaCantidad = parseInt(req.body.nuevaCantidad);

  if (isNaN(nuevaCantidad) || nuevaCantidad <= 0) {
    return res.status(400).json({ error: 'Cantidad inválida.' });
  }

  try {
    const repisa = await prisma.repisa.findUnique({
      where: { id },
      include: { estantes: true },
    });

    if (!repisa) return res.status(404).json({ error: 'Repisa no encontrada.' });

    const cantidadActual = repisa.estantes.length;

    if (nuevaCantidad <= cantidadActual) {
      return res.status(400).json({ error: 'Solo se permite aumentar la cantidad.' });
    }

    const nuevos = Array.from(
      { length: nuevaCantidad - cantidadActual },
      (_, i) => ({
        numero: String(cantidadActual + i + 1),
        repisaId: repisa.id,
      })
    );

    await prisma.estante.createMany({ data: nuevos });

    res.json({ mensaje: 'Estantes actualizados.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar estantes.' });
  }
});

export default router;
