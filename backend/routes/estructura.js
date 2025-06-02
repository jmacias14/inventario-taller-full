import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// GET /estructura
router.get('/', async (req, res) => {
  try {
    const repisas = await prisma.repisa.findMany({
      include: { estantes: true },
      orderBy: { letra: 'asc' }
    })

    // Convertir a formato: { "A": [1, 2], "B": [1, 2, 3], ... }
    const estructura = {}
    repisas.forEach(repisa => {
      estructura[repisa.letra] = repisa.estantes
        .map(est => est.numero)
        .sort((a, b) => a - b)
    })

    res.json(estructura)
  } catch (error) {
    console.error('Error al obtener repisas:', error)
    res.status(500).json({ error: 'Error al obtener la estructura.' })
  }
})

export default router
