import serverless from 'serverless-http';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import type { Handler } from 'aws-lambda';
// Imports the pre-compiled output of `nest build` (apps/api's own tsc,
// not Netlify's esbuild bundler), because esbuild doesn't implement
// emitDecoratorMetadata — without it, Nest's constructor-param DI silently
// breaks. netlify.toml's build command runs `nest build` before this
// function is bundled, so apps/api/dist always exists at build time.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AppModule } = require('../../apps/api/dist/app.module');

// Netlify reuses warm Lambda containers between invocations — build the
// Nest app once and cache its handler, instead of bootstrapping per request.
let cachedHandler: ReturnType<typeof serverless> | undefined;

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  // Strips the function's own mount path so Nest sees the same routes
  // (e.g. /announcements) it would at http://localhost:3000.
  return serverless(expressApp, { basePath: '/.netlify/functions/api' });
}

export const handler: Handler = async (event, context) => {
  if (!cachedHandler) cachedHandler = await bootstrap();
  return cachedHandler(event, context);
};
