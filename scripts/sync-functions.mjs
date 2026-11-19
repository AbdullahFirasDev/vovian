#!/usr/bin/env node
// Copies canonical validation schemas into the edge functions' _shared folder
// (Supabase bundles each function from supabase/functions only).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'packages/validation/src/checkout.ts')
const dest = join(root, 'supabase/functions/_shared/validation/checkout.ts')

mkdirSync(dirname(dest), { recursive: true })
writeFileSync(dest, '// GENERATED from packages/validation/src/checkout.ts by scripts/sync-functions.mjs — do not edit.\n' + readFileSync(src, 'utf8'))
console.log('Synced checkout schema → supabase/functions/_shared/validation/checkout.ts')
