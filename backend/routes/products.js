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
          { ubicacionLibre: { contains: query, mode: 'insensitive' } },
          { marca: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } }
        ]
      },
      marca ? { marca: { contains: marca, mode: 'insensitive' } } : {},
      unidad ? { unidad: { equals: unidad } } : {},
      estante ? { estante: { numero: { equals: estante } } } : {},
      repisa ? { repisa: { letra: { equals: repisa } } } : {},
      minCantidad ? { cantidad: { gte: parseFloat(minCantidad) } } : {},
      maxCantidad ? { cantidad: { lte: parseFloat(maxCantidad) } } : {}
    ]
  }

  try {
    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: {
          repisa: true,
          estante: true
        },
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
router.get('/code/:sku', async (req, res) => {
  try {
    const producto = await prisma.producto.findFirst({
      where: { sku: req.params.sku },
      include: {
        repisa: true,
        estante: true
      }
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
    if (!data.descripcion || !data.marca || !data.cantidad || !data.unidad || !data.tipoUbicacion) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    const unidadesValidas = ['Unidad', 'Litro', 'Metro', 'Paquete']
    if (!unidadesValidas.includes(data.unidad)) {
      return res.status(400).json({ error: 'Unidad de medida inválida' })
    }

    let repisaId = null
    let estanteId = null
    let ubicacionLibre = null

    if (data.tipoUbicacion === 'repisa') {
      const repisa = await prisma.repisa.findFirst({ where: { letra: data.repisa } })
      if (!repisa) return res.status(400).json({ error: 'Repisa no encontrada' })

      const estante = await prisma.estante.findFirst({
        where: { numero: data.estante, repisaId: repisa.id }
      })
      if (!estante) return res.status(400).json({ error: 'Estante no encontrado en la repisa indicada' })

      repisaId = repisa.id
      estanteId = estante.id
    } else if (data.tipoUbicacion === 'otro') {
      if (!data.ubicacionLibre) return res.status(400).json({ error: 'Debe indicar una ubicación libre' })
      ubicacionLibre = data.ubicacionLibre
    } else {
      return res.status(400).json({ error: 'Tipo de ubicación inválido' })
    }

    const nuevo = await prisma.producto.create({
      data: {
        descripcion: data.descripcion,
        marca: data.marca,
        sku: data.sku || null,
        unidad: data.unidad,
        cantidad: parseFloat(data.cantidad),
        observaciones: data.observaciones || '',
        tipoUbicacion: data.tipoUbicacion,
        repisaId,
        estanteId,
        ubicacionLibre
      }
    })

    await prisma.movimiento.create({
      data: {
        tipo: 'ingreso',
        productoId: nuevo.id,
        cantidad: parseFloat(data.cantidad)
      }
    })

    res.json(nuevo)
  } catch (err) {
    console.error(err)
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

// Modificar cantidad absoluta
router.put('/:id/cantidad', async (req, res) => {
  const id = parseInt(req.params.id)
  const nuevaCantidad = parseFloat(req.body.cantidad)

  if (isNaN(id) || isNaN(nuevaCantidad)) {
    return res.status(400).json({ error: 'Datos inválidos' })
  }

  try {
    const producto = await prisma.producto.findUnique({ where: { id } })
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' })

    const diferencia = nuevaCantidad - producto.cantidad

    await prisma.$transaction([
      prisma.producto.update({
        where: { id },
        data: { cantidad: nuevaCantidad }
      }),
      prisma.movimiento.create({
        data: {
          tipo: diferencia >= 0 ? 'ajuste_positivo' : 'ajuste_negativo',
          productoId: id,
          cantidad: Math.abs(diferencia)
        }
      })
    ])

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al actualizar cantidad' })
  }
})

// Eliminar producto por ID (versión segura)
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })

  try {
    await prisma.$transaction([
      prisma.saleItem.deleteMany({ where: { productId: id } }),
      prisma.movimiento.deleteMany({ where: { productoId: id } }),
      prisma.producto.delete({ where: { id } })
    ])
    res.json({ success: true })
  } catch (err) {
    console.error('Error al borrar producto:', err)
    res.status(500).json({ error: 'Error al borrar producto' })
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

// ✅ Obtener producto por ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' })

  try {
    const producto = await prisma.producto.findUnique({
      where: { id },
      include: {
        repisa: true,
        estante: true
      }
    })

    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' })

    res.json(producto)
  } catch (err) {
    console.error('Error al obtener producto por ID:', err)
    res.status(500).json({ error: 'Error interno al buscar producto' })
  }
})

export default router
