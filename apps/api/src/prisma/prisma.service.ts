import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Routes queries through `pg` (Node's own TCP/DNS stack) instead of
// Prisma's bundled Rust query engine doing its own networking — see
// schema.prisma's driverAdapters comment for why. Supabase's pooler
// requires SSL but its cert chain isn't one `pg`'s default CA bundle
// validates (same as every other serverless Postgres provider in this
// situation — Neon, PlanetScale, etc), so rejectUnauthorized is off.
// A `sslmode=...` query param left on DATABASE_URL (e.g. from an earlier
// "try enabling SSL" attempt) is stripped first — pg-connection-string
// treats sslmode=require/prefer/verify-ca as aliases for verify-full and
// that silently overrides the explicit `ssl` option below, which is
// exactly what caused a "self-signed certificate in certificate chain"
// failure here.
const connectionString = (process.env.DATABASE_URL ?? '').replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
const pool = new Pool({
  connectionString,
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
