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

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_ANON_KEY (or VITE_SUPABASE_ANON_KEY).');
  console.error('Please ensure they are defined in your environment or in .env.local.');
  process.exit(1);
}

const targetEndpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/contact_messages?select=id&limit=1`;

console.log(`📡 Pinging Supabase REST API at: ${targetEndpoint}`);

const startTime = Date.now();

try {
  const response = await fetch(targetEndpoint, {
    method: 'GET',
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  const durationMs = Date.now() - startTime;
  console.log(`⏱️ Response received in ${durationMs}ms`);
  console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Supabase database is UP and active! Pausing countdown timer reset.');
    console.log('Sample response:', data);
  } else if (response.status === 404) {
    console.log('⚠️ PostgREST is online, but table "contact_messages" was not found (HTTP 404).');
    console.log('Instance is awake, but you should create the contact_messages table in Supabase SQL editor.');
  } else {
    const text = await response.text();
    console.warn(`⚠️ Received status ${response.status}: ${text}`);
  }
} catch (error) {
  console.error('❌ Ping failed! Possible reasons:');
  console.error('1. The Supabase project is currently paused in the Supabase Dashboard (DNS fails to resolve).');
  console.error('2. Network or internet connectivity issues.');
  console.error(`Details: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
