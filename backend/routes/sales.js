import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

// Registrar venta y descontar stock
router.post('/', async (req, res) => {
  const { comentarios, productos } = req.body

  if (!Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ error: 'Debe incluir al menos un producto' })
  }

  try {
    const venta = await prisma.sale.create({
      data: {
        comentarios,
        items: {
          create: productos.map((p) => ({
            productId: p.productId,
            cantidad: p.cantidad
          }))
        }
      }
    })

    const updates = []
    const logs = []

    for (const p of productos) {
      updates.push(
        prisma.producto.update({
          where: { id: p.productId },
          data: { cantidad: { decrement: p.cantidad } }
        })
      )
      logs.push(
        prisma.movimiento.create({
          data: {
            tipo: 'egreso',
            productoId: p.productId,
            cantidad: p.cantidad
          }
        })
      )
    }

    await prisma.$transaction([...updates, ...logs])

    res.status(201).json({ mensaje: 'Venta registrada', ventaId: venta.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al registrar venta' })
  }
})

// Obtener historial de ventas
router.get('/history', async (req, res) => {
  try {
    const ventas = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    const resultado = ventas.map((venta) => ({
      id: venta.id,
      fecha: venta.createdAt,
      comentarios: venta.comentarios,
      productos: venta.items.map((item) => ({
        nombre: item.product.nombre,
        cantidad: item.cantidad,
        marca: item.product.marca
      }))
    }))

    res.json(resultado)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener historial de ventas' })
  }
})

export default router
