import express from 'express'
import multer from 'multer'
import xlsx from 'xlsx'
import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const router = express.Router()
const prisma = new PrismaClient()
const upload = multer({ dest: 'uploads/' })

function normalizarSku(sku) {
  return sku
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .replace(/\s+/g, '')
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
    if (!req.file) return res.status(400).json({ error: 'Archivo no enviado' })

    const workbook = xlsx.readFile(req.file.path)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawRows = xlsx.utils.sheet_to_json(sheet)

    const errores = []
    const skusVistos = new Set()
    const avisos = []

    const rows = rawRows.map((fila, index) => {
      let filaAvisos = []

      let skuRaw = fila['sku'];
      let descripcionRaw = fila['descripcion'];
      let cantidadRaw = fila['cantidad'];
      let marcaRaw = fila['marca'];
      let unidadRaw = fila['unidad'];
      let observacionesRaw = fila['observaciones'];
      let repisaRaw = (fila['repisaLetra'] || "").toString().trim().toUpperCase();
      let estanteNumeroRaw = fila['estanteNumero'];

      // AUTOCOMPLETADO de campos vacíos y AVISOS
      let descripcion = (descripcionRaw && descripcionRaw.toString().trim()) ? descripcionRaw.toString().trim() : "No Posee";
      if (!descripcionRaw || descripcionRaw.toString().trim() === "") {
        filaAvisos.push(`Fila ${index + 2}: descripción vacía, se autocompletó con "No Posee".`);
      }

      let cantidad = (!isNaN(Number(cantidadRaw)) && cantidadRaw !== null && cantidadRaw !== "") ? Number(cantidadRaw) : 0;
      if (isNaN(Number(cantidadRaw)) || cantidadRaw === null || cantidadRaw === "") {
        filaAvisos.push(`Fila ${index + 2}: cantidad vacía o inválida, se autocompletó con 0.`);
      }

      let marca = (marcaRaw && marcaRaw.toString().trim()) ? marcaRaw.toString().trim() : "No Posee";
      if (!marcaRaw || marcaRaw.toString().trim() === "") {
        filaAvisos.push(`Fila ${index + 2}: marca vacía, se autocompletó con "No Posee".`);
      }

      let unidad = (unidadRaw && unidadRaw.toString().trim()) ? unidadRaw.toString().trim() : "No Posee";
      if (!unidadRaw || unidadRaw.toString().trim() === "") {
        filaAvisos.push(`Fila ${index + 2}: unidad vacía, se autocompletó con "No Posee".`);
      }

      let observaciones = (observacionesRaw && observacionesRaw.toString().trim()) ? observacionesRaw.toString().trim() : "";

      let sku = (skuRaw && skuRaw.toString().trim()) ? normalizarSku(String(skuRaw).trim()) : `AUTOGEN${index + 2}`;
      if (!skuRaw || skuRaw.toString().trim() === "") {
        filaAvisos.push(`Fila ${index + 2}: SKU vacío, se generó automáticamente como AUTOGEN${index + 2}.`);
      }

      let estanteRaw = (estanteNumeroRaw !== undefined && estanteNumeroRaw !== null && estanteNumeroRaw !== "")
        ? String(parseInt(estanteNumeroRaw))
        : "";

      // Guardar avisos para esta fila (si hay)
      if (filaAvisos.length > 0) {
        avisos.push(...filaAvisos);
      }

      return {
        filaIndex: index + 2,
        sku,
        descripcion,
        cantidad,
        marca,
        unidad,
        observaciones,
        repisaRaw,
        estanteRaw
      }
    })

    for (const fila of rows) {
      const {
        filaIndex, sku, descripcion, cantidad,
        marca, unidad, observaciones,
        repisaRaw, estanteRaw
      } = fila

      let baseSku = sku ? sku : `AUTOGEN${filaIndex}`
      let finalSku = baseSku

      let intento = 2
      let skuOriginal = finalSku
      while (skusVistos.has(finalSku)) {
        finalSku = `${skuOriginal}-${intento}`
        intento++
      }
      skusVistos.add(finalSku)

      finalSku = await generarSkuUnico(finalSku)

      const finalMarca = marca || "No Posee"

      let prismaRepisa = undefined
      let prismaEstante = undefined
      let ubicacionLibre = null

      const estanteEsNumero = /^\d+$/.test(estanteRaw)

      if (repisaRaw.length !== 1 || !/^[A-Z]$/.test(repisaRaw) || !estanteEsNumero) {
        ubicacionLibre = `${repisaRaw} ${estanteRaw}`.trim()
      } else {
        const repisa = await prisma.repisa.findFirst({ where: { letra: repisaRaw } })
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

        prismaRepisa = { connect: { id: repisa.id } }
        prismaEstante = { connect: { id: estante.id } }
      }

      let productoData = {
        descripcion,
        marca: finalMarca,
        sku: finalSku,
        unidad,
        cantidad,
        observaciones,
        ubicacionLibre
      }
      if (prismaRepisa) productoData.repisa = prismaRepisa
      if (prismaEstante) productoData.estante = prismaEstante

      try {
        await prisma.producto.create({
          data: productoData
        })
      } catch (err) {
        if (err.code === 'P2002' && err.meta && err.meta.target && err.meta.target.includes('sku')) {
          errores.push(`Fila ${filaIndex}: SKU duplicado en base de datos incluso tras renombrar (${finalSku}).`)
        } else {
          errores.push(`Fila ${filaIndex}: Error al guardar producto en base de datos. (${err.message})`)
        }
      }
    }

    fs.unlinkSync(req.file.path)

    // Combina avisos y errores (avisos primero)
    const respuesta = {}
    if (avisos.length > 0) respuesta.avisos = avisos
    if (errores.length > 0) {
      respuesta.success = false
      respuesta.errores = errores
      return res.status(400).json(respuesta)
    }

    respuesta.success = true
    respuesta.message = "Importación completada correctamente."
    res.json(respuesta)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Error interno al procesar archivo." })
  }
})

export default router
