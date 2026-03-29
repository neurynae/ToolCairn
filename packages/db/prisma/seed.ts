import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const INITIAL_TOOLS = [
  'https://github.com/vercel/next.js',
  'https://github.com/vitejs/vite',
  'https://github.com/prisma/prisma',
  'https://github.com/trpc/trpc',
  'https://github.com/colinhacks/zod',
  'https://github.com/biomejs/biome',
  'https://github.com/vitest-dev/vitest',
  'https://github.com/redwoodjs/redwood',
  'https://github.com/remix-run/remix',
  'https://github.com/sveltejs/svelte',
  'https://github.com/vuejs/vue',
  'https://github.com/angular/angular',
  'https://github.com/nestjs/nest',
  'https://github.com/fastify/fastify',
  'https://github.com/expressjs/express',
  'https://github.com/honojs/hono',
  'https://github.com/drizzle-team/drizzle-orm',
  'https://github.com/qdrant/qdrant',
  'https://github.com/memgraph/memgraph',
  'https://github.com/redis/ioredis',
];

async function main() {
  console.log('Seeding IndexedTool entries...');

  let created = 0;
  for (const url of INITIAL_TOOLS) {
    await prisma.indexedTool.upsert({
      where: { github_url: url },
      update: {},
      create: {
        github_url: url,
        index_status: 'pending',
      },
    });
    created++;
  }

  console.log(`Done. ${created} tools seeded (pending indexing).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
