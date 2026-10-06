// Temporary diagnostic: Render's Prisma-based start was failing with a
// generic P1001 "Can't reach database server" against Supabase's pooler.
// This bypasses Prisma entirely and opens a raw TCP socket so the actual
// failure mode (timeout vs refused vs DNS vs something connecting fine,
// which would point at the Postgres/TLS handshake instead) is visible in
// the Render logs. Not part of the app — swapped in via startCommand only
// for this one debug deploy, then reverted.
const net = require('net');
const dns = require('dns');

const host = 'aws-0-ap-northeast-1.pooler.supabase.com';
const targets = [
  { port: 6543, label: 'pooler transaction (6543)' },
  { port: 5432, label: 'pooler session (5432)' },
];

function resolve() {
  return new Promise((resolvePromise) => {
    dns.lookup(host, { all: true, verbatim: true }, (err, addresses) => {
      if (err) {
        console.log(`DNS lookup FAILED: ${err.code} ${err.message}`);
      } else {
        console.log(`DNS resolved to: ${JSON.stringify(addresses)}`);
      }
      resolvePromise();
    });
  });
}

function probe(port, label) {
  return new Promise((resolvePromise) => {
    const start = Date.now();
    console.log(`[${label}] connecting to ${host}:${port} ...`);
    const socket = net.createConnection({ host, port, family: 4, timeout: 10000 });
    socket.on('connect', () => {
      console.log(`[${label}] CONNECTED in ${Date.now() - start}ms`);
      socket.end();
      resolvePromise();
    });
    socket.on('timeout', () => {
      console.log(`[${label}] TIMEOUT after ${Date.now() - start}ms`);
      socket.destroy();
      resolvePromise();
    });
    socket.on('error', (err) => {
      console.log(`[${label}] ERROR after ${Date.now() - start}ms: ${err.code} ${err.message}`);
      resolvePromise();
    });
  });
}

async function main() {
  console.log('=== DB connectivity probe starting ===');
  await resolve();
  for (const t of targets) {
    await probe(t.port, t.label);
  }
  console.log('=== Probe done — also testing a known-good public host for comparison ===');
  await probe(443, 'example.com HTTPS (sanity check)').catch(() => {});
  const sanity = net.createConnection({ host: 'example.com', port: 443, family: 4, timeout: 10000 });
  sanity.on('connect', () => {
    console.log('[sanity example.com:443] CONNECTED — outbound internet works fine in general');
    sanity.end();
    process.exit(0);
  });
  sanity.on('timeout', () => {
    console.log('[sanity example.com:443] TIMEOUT — outbound internet itself is broken, not Supabase-specific');
    process.exit(1);
  });
  sanity.on('error', (err) => {
    console.log(`[sanity example.com:443] ERROR: ${err.code} ${err.message}`);
    process.exit(1);
  });
}

main();
