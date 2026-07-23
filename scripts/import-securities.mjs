/**
 * Imports the full NSE + BSE equity universe into the `securities` table.
 *
 * Sources:
 *   NSE  https://archives.nseindia.com/content/equities/EQUITY_L.csv
 *   BSE  https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w (active equity)
 *
 * The stored `symbol` is the Yahoo Finance ticker stem: NSE uses the NSE symbol
 * (RELIANCE -> RELIANCE.NS) and BSE uses the alpha scrip id (RELIANCE -> RELIANCE.BO;
 * Yahoo does NOT accept BSE numeric codes).
 *
 * Run:  NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-securities.mjs
 * Re-runnable — upserts on (symbol, exchange).
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
const VALID = /^[A-Z0-9&._-]+$/

function parseCSVLine(line) {
  const out = []
  let cur = ''
  let q = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else q = false
      } else cur += ch
    } else if (ch === '"') q = true
    else if (ch === ',') { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}

async function fetchNSE() {
  const res = await fetch('https://archives.nseindia.com/content/equities/EQUITY_L.csv', {
    headers: { 'User-Agent': UA, Accept: 'text/csv,*/*' },
  })
  if (!res.ok) throw new Error('NSE fetch failed ' + res.status)
  const text = await res.text()
  const lines = text.split(/\r?\n/).slice(1) // drop header
  const rows = []
  for (const line of lines) {
    if (!line.trim()) continue
    const c = parseCSVLine(line)
    const symbol = (c[0] || '').trim().toUpperCase()
    const name = (c[1] || '').trim()
    if (symbol && name && VALID.test(symbol)) rows.push({ symbol, exchange: 'NSE', name })
  }
  return rows
}

async function fetchBSE() {
  const url = 'https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active'
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json', Referer: 'https://www.bseindia.com/', Origin: 'https://www.bseindia.com' },
  })
  if (!res.ok) throw new Error('BSE fetch failed ' + res.status)
  const data = await res.json()
  const rows = []
  for (const x of data) {
    if (x.Segment !== 'Equity' || x.Status !== 'Active') continue
    const symbol = String(x.scrip_id || '').trim().toUpperCase()
    const name = String(x.Scrip_Name || x.Issuer_Name || '').trim()
    if (symbol && name && VALID.test(symbol)) rows.push({ symbol, exchange: 'BSE', name })
  }
  return rows
}

async function upsertBatch(batch) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/securities?on_conflict=symbol,exchange`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(batch),
  })
  if (!res.ok) throw new Error(`Upsert failed ${res.status}: ${await res.text()}`)
}

async function main() {
  console.log('Fetching NSE + BSE lists…')
  const [nse, bse] = await Promise.all([fetchNSE(), fetchBSE()])
  console.log(`  NSE: ${nse.length}   BSE: ${bse.length}`)

  // Dedupe on (symbol, exchange).
  const map = new Map()
  for (const r of [...nse, ...bse]) map.set(`${r.symbol}|${r.exchange}`, r)
  const rows = [...map.values()]
  console.log(`  Total unique: ${rows.length}`)

  const BATCH = 1000
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    await upsertBatch(batch)
    console.log(`  upserted ${Math.min(i + BATCH, rows.length)}/${rows.length}`)
  }
  console.log('Done.')
}

main().catch((e) => { console.error(e); process.exit(1) })
