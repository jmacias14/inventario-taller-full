import express from 'express'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

// Obtener productos con filtros, paginación y ordenamiento
app.get('/products', async (req, res) => {
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
    console.error(err)
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// Buscar producto por código
app.get('/products/code/:sku', async (req, res) => {
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
app.post('/products/add', async (req, res) => {
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
app.post('/products/update', async (req, res) => {
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

// Registrar venta y descontar stock
app.post('/sales', async (req, res) => {
  try {
    const { items } = req.body
    const updates = []
    const logs = []

    for (const item of items) {
      updates.push(
        prisma.producto.update({
          where: { id: item.id },
          data: { cantidad: { decrement: item.cantidad } }
        })
      )
      logs.push(
        prisma.movimiento.create({
          data: {
            tipo: 'egreso',
            productoId: item.id,
            cantidad: item.cantidad
          }
        })
      )
    }

    const result = await prisma.$transaction([...updates, ...logs])
    res.json({ message: 'Venta registrada', result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al registrar venta' })
  }
})

// Obtener historial de movimientos
app.get('/logs', async (req, res) => {
  try {
    const logs = await prisma.movimiento.findMany({
      include: {
        producto: true
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    const formateado = logs.map(log => ({
      id: log.id,
      tipo: log.tipo,
      cantidad: log.cantidad,
      fecha: log.timestamp,
      descripcion: log.producto.descripcion,
      marca: log.producto.marca,
      unidad: log.producto.unidad
    }))

    res.json(formateado)
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener registros' })
  }
})

// Eliminar todos los productos
app.delete('/products/delete-all', async (req, res) => {
  try {
    const resultado = await prisma.producto.deleteMany({})
    res.json({ eliminados: resultado.count })
  } catch (err) {
    res.status(500).json({ error: 'Error al borrar productos' })
  }
})

// Deshacer un movimiento y revertir el stock, registrando la reversión
app.post('/logs/undo/:id', async (req, res) => {
  const id = parseInt(req.params.id)

  try {
    const movimiento = await prisma.movimiento.findFirst({
      where: { id },
      include: { producto: true }
    })

    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento no encontrado' })
    }

    const ajusteStock = movimiento.tipo === 'ingreso'
      ? { cantidad: { decrement: movimiento.cantidad } }
      : { cantidad: { increment: movimiento.cantidad } }

    await prisma.$transaction([
      prisma.producto.update({
        where: { id: movimiento.productoId },
        data: ajusteStock
      }),
      prisma.movimiento.create({
        data: {
          tipo: 'anulado',
          productoId: movimiento.productoId,
          cantidad: movimiento.cantidad
        }
      }),
      prisma.movimiento.delete({
        where: { id: movimiento.id }
      })
    ])

    res.json({ message: 'Movimiento deshecho, registrado como anulado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al deshacer movimiento' })
  }
})

app.listen(3001, () => console.log('API escuchando en http://localhost:3001'))
