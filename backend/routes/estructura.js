import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /estructura
router.get('/', async (req, res) => {
  try {
    const repisas = await prisma.repisa.findMany({
      include: { estantes: true },
      orderBy: { letra: 'asc' }
    });
    res.json(repisas);
  } catch (error) {
    console.error('Error al obtener repisas:', error);
    res.status(500).json({ error: 'Error al obtener la estructura.' });
  }
});

export default router;
