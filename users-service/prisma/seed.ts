import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não encontrada. Defina a variável no ambiente (docker-compose) antes de rodar o seed.");
  process.exit(1);
}

const prisma = new PrismaClient();

const users = [
  { id: 1, name: "Alice Souza", email: "alice@ecommerce.local" },
  { id: 2, name: "Bruno Lima", email: "bruno@ecommerce.local" },
];

async function main() {
  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { id: user.id },
        update: { name: user.name, email: user.email },
        create: user,
      }),
    ),
  );

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
