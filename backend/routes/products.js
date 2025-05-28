import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Obtener productos con filtros
router.get('/', async (req, res) => {
  const {
    query = '', marca, unidad, minCantidad, maxCantidad,
    estante, repisa, skip = 0, take = 50,
    sortBy = 'id', order = 'desc'
  } = req.query

  const where = {
    AND: [
      {
        OR: [
          { descripcion: { contains: query, mode: 'insensitive' } },
          { observaciones: { contains: query, mode: 'insensitive' } },
          { ubicacion: { contains: query, mode: 'insensitive' } },
        ]
      },
      marca ? { marca: { contains: marca, mode: 'insensitive' } } : {},
      unidad ? { unidad: { equals: unidad } } : {},
      estante ? { estante: { equals: estante } } : {},
      repisa ? { repisa: { equals: repisa } } : {},
      minCantidad ? { cantidad: { gte: parseFloat(minCantidad) } } : {},
      maxCantidad ? { cantidad: { lte: parseFloat(maxCantidad) } } : {}
    ]
  }

  try {
    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(take),
        orderBy: { [sortBy]: order === 'asc' ? 'asc' : 'desc' }
      }),
      prisma.producto.count({ where })
    ])

    res.json({ productos, total })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// Buscar producto por código
router.get('/code/:sku', async (req, res) => {
  try {
    const producto = await prisma.producto.findFirst({
      where: { sku: req.params.sku }
    })
    res.json(producto)
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar producto por código' })
  }
})

// Agregar nuevo producto
router.post('/add', async (req, res) => {
  try {
    const data = req.body
    if (!data.descripcion || !data.marca || !data.ubicacion || !data.cantidad || !data.unidad) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    const nuevo = await prisma.producto.create({ data })

    await prisma.movimiento.create({
      data: {
        tipo: 'ingreso',
        productoId: nuevo.id,
        cantidad: data.cantidad
      }
    })

    res.json(nuevo)
  } catch (err) {
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

// Sumar cantidad a producto existente
router.post('/update', async (req, res) => {
  try {
    const { sku, cantidad } = req.body
    if (!sku || !cantidad) return res.status(400).json({ error: 'Faltan datos' })

    const producto = await prisma.producto.findFirst({ where: { sku } })
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' })

    await prisma.$transaction([
      prisma.producto.update({
        where: { id: producto.id },
        data: { cantidad: { increment: parseFloat(cantidad) } }
      }),
      prisma.movimiento.create({
        data: {
          tipo: 'ingreso',
          productoId: producto.id,
          cantidad: parseFloat(cantidad)
        }
      })
    ])

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar cantidad' })
  }
})

// Eliminar todos los productos
router.delete('/delete-all', async (req, res) => {
  try {
    const resultado = await prisma.producto.deleteMany({})
    res.json({ eliminados: resultado.count })
  } catch (err) {
    res.status(500).json({ error: 'Error al borrar productos' })
  }
})

// Obtener producto por ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const producto = await prisma.producto.findUnique({
      where: { id }
    })

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    res.json(producto)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener el producto' })
  }
})


export default router

