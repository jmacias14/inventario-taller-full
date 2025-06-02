import express from 'express'
import multer from 'multer'
import xlsx from 'xlsx'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const router = express.Router()
const prisma = new PrismaClient()
const upload = multer({ dest: 'uploads/' })

// Normaliza SKU quitando espacios, acentos y caracteres especiales
function normalizarSku(sku) {
  return sku
    .normalize("NFD")                     // separa caracteres diacríticos
    .replace(/[\u0300-\u036f]/g, "")     // elimina acentos
    .replace(/[^a-zA-Z0-9-]/g, "")       // elimina todo excepto letras, números y guiones
    .replace(/\s+/g, '')                 // elimina espacios
}

async function generarSkuUnico(baseSku) {
  let nuevoSku = baseSku
  let contador = 2

  while (await prisma.producto.findUnique({ where: { sku: nuevoSku } })) {
    nuevoSku = `${baseSku}-${contador}`
    contador++
  }

  return nuevoSku
}

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Archivo no enviado' })
    }

    const workbook = xlsx.readFile(req.file.path)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawRows = xlsx.utils.sheet_to_json(sheet)

    const errores = []

    const rows = rawRows.map((filaOriginal, index) => ({
      descripcion: (filaOriginal["Descripcion"] || "").toString().trim(),
      marca: (filaOriginal["Marca"] || "No Posee").toString().trim() || "No Posee",
      sku: (filaOriginal["codigo "] || filaOriginal["SKU"] || "").toString(),
      unidad: (filaOriginal["Unidad de Medida"] || filaOriginal["Unidad"] || "").toString().trim(),
      cantidad: parseInt(filaOriginal["stock"] || filaOriginal["Cantidad"] || 0),
      repisaRaw: (filaOriginal["Repisa"] || "").toString().trim(),
      estanteRaw: (filaOriginal["Estante"] || "").toString().trim(),
      observaciones: (filaOriginal["Observaciones"] || "").toString().trim(),
      filaIndex: index + 2
    }))

    for (const fila of rows) {
      const {
        descripcion, marca, sku,
        unidad, cantidad,
        repisaRaw, estanteRaw, observaciones,
        filaIndex
      } = fila

      if (!descripcion || !unidad || isNaN(cantidad)) {
        errores.push(`Fila ${filaIndex}: faltan datos obligatorios (descripcion, unidad o cantidad).`)
        continue
      }

      const finalMarca = marca || "No Posee"

      let finalSku = sku.trim() === "" ? null : normalizarSku(sku)
      if (finalSku) finalSku = await generarSkuUnico(finalSku)

      let tipoUbicacion = "repisa"
      let repisaId = null
      let estanteId = null
      let ubicacionLibre = null
      let repisaLetra = null
      let estanteNumero = null

      const ubicacionEsLibre = repisaRaw.length !== 1 || !/^[a-zA-Z]$/.test(repisaRaw)

      if (ubicacionEsLibre) {
        tipoUbicacion = "otro"
        ubicacionLibre = repisaRaw
      } else {
        const repisa = await prisma.repisa.findFirst({ where: { letra: repisaRaw.toUpperCase() } })
        if (!repisa) {
          errores.push(`Fila ${filaIndex}: Repisa '${repisaRaw}' no encontrada.`)
          continue
        }

        const estante = await prisma.estante.findFirst({
          where: {
            numero: estanteRaw,
            repisaId: repisa.id
          }
        })

        if (!estante) {
          errores.push(`Fila ${filaIndex}: Estante '${estanteRaw}' no encontrado en repisa ${repisaRaw}.`)
          continue
        }

        repisaId = repisa.id
        estanteId = estante.id
        repisaLetra = repisa.letra
        estanteNumero = parseInt(estante.numero)
      }

      try {
        await prisma.producto.create({
          data: {
            descripcion,
            marca: finalMarca,
            sku: finalSku,
            unidad,
            cantidad,
            observaciones,
            tipoUbicacion,
            repisaId,
            estanteId,
            repisaLetra,
            estanteNumero,
            ubicacionLibre
          }
        })
      } catch (err) {
        errores.push(`Fila ${filaIndex}: Error al guardar en base de datos.`)
      }
    }

    fs.unlinkSync(req.file.path)

    if (errores.length > 0) {
      return res.status(400).json({ success: false, errores })
    }

    res.json({ success: true, message: "Importación completada correctamente." })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Error al procesar archivo." })
  }
})

export default router
