import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não encontrada. Defina a variável no ambiente (docker-compose) antes de rodar o seed.");
  process.exit(1);
}

const prisma = new PrismaClient();

const users = [
  { name: "Alice Souza", email: "alice@ecommerce.local" },
  { name: "Bruno Lima", email: "bruno@ecommerce.local" },
];

async function main() {
  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name },
        create: user,
      }),
    ),
  );

  // Reajusta a sequência para evitar duplicação de IDs ao criar novos usuários
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"User"', 'id'),
      COALESCE((SELECT MAX("id") FROM "User"), 0)
    );
  `);

  console.log("Seed: usuários criados/atualizados.");
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed de usuários:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
