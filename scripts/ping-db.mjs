import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Helper to parse simple .env / .env.local file if not provided via process.env
function loadEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const rawSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!rawSupabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY).');
  console.error('Please ensure they are defined in your environment or in .env.local.');
  process.exit(1);
}

let parsedBaseUrl;
try {
  parsedBaseUrl = new URL(rawSupabaseUrl);
  if (parsedBaseUrl.protocol !== 'https:' || !parsedBaseUrl.hostname.endsWith('.supabase.co')) {
    throw new Error('URL must be an https://*.supabase.co origin.');
  }
} catch {
  console.error('❌ Error: Invalid SUPABASE_URL. Must be a valid https://*.supabase.co origin.');
  process.exit(1);
}

const rpcEndpoint = `${parsedBaseUrl.origin}/rest/v1/rpc/ping_keep_alive`;
console.log(`📡 Pinging Supabase Keep-Alive RPC at: ${parsedBaseUrl.origin}/rest/v1/rpc/ping_keep_alive`);

const startTime = Date.now();

try {
  const response = await fetch(rpcEndpoint, {
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  const durationMs = Date.now() - startTime;
  console.log(`⏱️ Response received in ${durationMs}ms`);
  console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);

  if (response.ok) {
    console.log('✅ Supabase database is UP and active! Pausing countdown timer reset.');
  } else if (response.status === 404) {
    console.log('⚠️ PostgREST is online, but RPC "ping_keep_alive" was not found (HTTP 404).');
    console.log('Instance is awake, and you can create the RPC by running supabase_schema.sql in the Supabase SQL editor.');
  } else {
    console.warn(`⚠️ Received status ${response.status}. Verify RLS and anon key configuration.`);
  }
} catch {
  console.error('❌ Ping failed! Possible reasons:');
  console.error('1. The Supabase project is currently paused in the Supabase Dashboard.');
  console.error('2. Network or internet connectivity issues.');
  process.exit(1);
}
