import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não encontrada. Defina a variável no ambiente (docker-compose) antes de rodar o seed.");
  process.exit(1);
}

const prisma = new PrismaClient();

const products = [
  { id: 1, name: "Notebook Gamer", price: 4500, stock: 20 },
  { id: 2, name: "Mouse Sem Fio", price: 150, stock: 50 },
  { id: 3, name: "Teclado Mecânico", price: 350, stock: 30 },
];

async function main() {
  await Promise.all(
    products.map((product) =>
      prisma.product.upsert({
        where: { id: product.id },
        update: {
          name: product.name,
          price: product.price,
          stock: product.stock,
        },
        create: product,
      }),
    ),
  );

  console.log("Seed: produtos criados/atualizados.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed de produtos:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
