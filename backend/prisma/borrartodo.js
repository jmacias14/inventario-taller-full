import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('⏳ Vaciando base de datos...')

  await prisma.movimiento.deleteMany({})
  await prisma.saleItem.deleteMany({})
  await prisma.sale.deleteMany({})
  await prisma.producto.deleteMany({})
  await prisma.estante.deleteMany({})
  await prisma.repisa.deleteMany({})

  console.log('✔ Base de datos vaciada exitosamente.')
}

main()
  .catch((e) => {
    console.error('❌ Error al vaciar la base de datos:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
