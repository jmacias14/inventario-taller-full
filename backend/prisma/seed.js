import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const letras = ['A', 'B', 'C']
  const numeros = ['1', '2', '3']

  for (const letra of letras) {
    const repisa = await prisma.repisa.create({
      data: { letra },
    })

    for (const numero of numeros) {
      await prisma.estante.create({
        data: {
          numero,
          repisaId: repisa.id,
        },
      })
    }
  }

  console.log('✔ Repisas y estantes creados correctamente.')
}

main()
  .catch((e) => {
    console.error('Error al ejecutar el seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
c