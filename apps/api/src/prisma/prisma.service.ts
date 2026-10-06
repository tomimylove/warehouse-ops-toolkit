import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Routes queries through `pg` (Node's own TCP/DNS stack) instead of
// Prisma's bundled Rust query engine doing its own networking — see
// schema.prisma's driverAdapters comment for why. Supabase's pooler
// requires SSL; `pg` doesn't reliably pick that up from a `sslmode=...`
// query param the way Prisma's own engine did, so it's set explicitly.
// rejectUnauthorized: false because Supabase's pooler cert chain isn't
// one `pg`'s default CA bundle validates, same as every other serverless
// Postgres provider in this situation (Neon, PlanetScale, etc).
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);

// Thin wrapper so every module gets the same PrismaClient instance via DI,
// and connects/disconnects with the Nest application lifecycle.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
