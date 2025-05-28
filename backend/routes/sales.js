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
            cantidad: p.cantidad,
            ventaId: venta.id
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
        id: item.product.id,
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

// Anular venta (eliminar y restaurar stock)
router.delete('/:id', async (req, res) => {
  const ventaId = parseInt(req.params.id)

  try {
    const venta = await prisma.sale.findUnique({
      where: { id: ventaId },
      include: {
        items: true
      }
    })

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' })
    }

    const updates = venta.items.map(item =>
      prisma.producto.update({
        where: { id: item.productId },
        data: { cantidad: { increment: item.cantidad } }
      })
    )

    await prisma.$transaction([
      ...updates,
      prisma.movimiento.deleteMany({ where: { ventaId } }),
      prisma.saleItem.deleteMany({ where: { saleId: ventaId } }),
      prisma.sale.delete({ where: { id: ventaId } })
    ])

    res.json({ mensaje: 'Venta anulada, stock restaurado y movimientos eliminados' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al anular la venta' })
  }
})

export default router
