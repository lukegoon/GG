import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // CRITICAL: .env stores literal \n — must be converted to real newlines
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  return google.sheets({ version: 'v4', auth })
}

async function getTabName(key, fallback) {
  const setting = await prisma.appSetting.findUnique({ where: { key } })
  return setting?.value || process.env[key.toUpperCase()] || fallback
}

function isoWeek(dateStr) {
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}

// Returns: Map<convosoId, hireCount> for the given weekStart
export async function getHireConfirmations(weekStart) {
  const sheets = await getSheetsClient()
  const tab = await getTabName('hireSheetTab', 'Hires')
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID

  if (!spreadsheetId) {
    console.warn('[Sheets] GOOGLE_SPREADSHEET_ID not set — skipping hires pull')
    return new Map()
  }

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A:Z`,
    })

    const rows = res.data.values ?? []
    if (rows.length < 2) return new Map()

    const headers = rows[0].map(h => h.toLowerCase().trim())
    const agentIdCol = headers.findIndex(h => h.includes('agent') || h.includes('convoso') || h.includes('rep'))
    const weekCol = headers.findIndex(h => h.includes('week') || h.includes('date'))

    if (agentIdCol === -1) {
      console.warn('[Sheets] Hires tab: could not find agent ID column. Headers:', headers)
      return new Map()
    }

    const weekStr = isoWeek(weekStart)
    const result = new Map()

    for (const row of rows.slice(1)) {
      const rowWeek = weekCol >= 0 ? isoWeek(row[weekCol] ?? '') : null
      if (weekCol >= 0 && rowWeek !== weekStr) continue

      const agentId = String(row[agentIdCol] ?? '').trim()
      if (!agentId) continue

      result.set(agentId, (result.get(agentId) ?? 0) + 1)
    }

    return result
  } catch (err) {
    console.error('[Sheets] getHireConfirmations error:', err.message)
    return new Map()
  }
}

// Returns: Map<convosoId, Map<metric, target>> for the given weekStart
export async function getWeeklyGoals(weekStart) {
  const sheets = await getSheetsClient()
  const tab = await getTabName('goalsSheetTab', 'Goals')
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
  if (!spreadsheetId) return new Map()

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A:Z`,
    })
    const rows = res.data.values ?? []
    if (rows.length < 2) return new Map()

    const headers = rows[0].map(h => h.toLowerCase().trim())
    const agentCol = headers.findIndex(h => h.includes('agent') || h.includes('convoso'))
    const weekCol = headers.findIndex(h => h.includes('week') || h.includes('date'))
    const metricCol = headers.findIndex(h => h.includes('metric'))
    const targetCol = headers.findIndex(h => h.includes('target') || h.includes('goal'))

    if (agentCol === -1 || metricCol === -1 || targetCol === -1) return new Map()

    const weekStr = isoWeek(weekStart)
    const result = new Map()

    for (const row of rows.slice(1)) {
      if (weekCol >= 0 && isoWeek(row[weekCol] ?? '') !== weekStr) continue
      const agentId = String(row[agentCol] ?? '').trim()
      const metric = String(row[metricCol] ?? '').trim()
      const target = parseFloat(row[targetCol] ?? 0)
      if (!agentId || !metric) continue

      if (!result.has(agentId)) result.set(agentId, new Map())
      result.get(agentId).set(metric, target)
    }

    return result
  } catch (err) {
    console.error('[Sheets] getWeeklyGoals error:', err.message)
    return new Map()
  }
}

// Returns: array of { convosoId, weekStart, content } for notes in the sheet
export async function getManagerNotes(weekStart) {
  const sheets = await getSheetsClient()
  const tab = await getTabName('notesSheetTab', 'Notes')
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
  if (!spreadsheetId) return []

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A:Z`,
    })
    const rows = res.data.values ?? []
    if (rows.length < 2) return []

    const headers = rows[0].map(h => h.toLowerCase().trim())
    const agentCol = headers.findIndex(h => h.includes('agent') || h.includes('convoso'))
    const weekCol = headers.findIndex(h => h.includes('week') || h.includes('date'))
    const noteCol = headers.findIndex(h => h.includes('note') || h.includes('content') || h.includes('comment'))

    if (agentCol === -1 || noteCol === -1) return []

    const weekStr = isoWeek(weekStart)
    const results = []

    for (const row of rows.slice(1)) {
      if (weekCol >= 0 && isoWeek(row[weekCol] ?? '') !== weekStr) continue
      const convosoId = String(row[agentCol] ?? '').trim()
      const content = String(row[noteCol] ?? '').trim()
      if (!convosoId || !content) continue
      results.push({ convosoId, weekStart: new Date(weekStr), content })
    }

    return results
  } catch (err) {
    console.error('[Sheets] getManagerNotes error:', err.message)
    return []
  }
}

// Returns: Map<convosoId, overrides> — manual stat corrections from the sheet
export async function getAgentOverrides(weekStart) {
  const sheets = await getSheetsClient()
  const tab = await getTabName('overridesSheetTab', 'Overrides')
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
  if (!spreadsheetId) return new Map()

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${tab}!A:Z`,
    })
    const rows = res.data.values ?? []
    if (rows.length < 2) return new Map()

    const headers = rows[0].map(h => h.toLowerCase().trim())
    const agentCol = headers.findIndex(h => h.includes('agent') || h.includes('convoso'))
    const weekCol = headers.findIndex(h => h.includes('week') || h.includes('date'))

    if (agentCol === -1) return new Map()

    const weekStr = isoWeek(weekStart)
    const result = new Map()

    for (const row of rows.slice(1)) {
      if (weekCol >= 0 && isoWeek(row[weekCol] ?? '') !== weekStr) continue
      const agentId = String(row[agentCol] ?? '').trim()
      if (!agentId) continue
      const overrides = {}
      headers.forEach((h, i) => {
        if (i !== agentCol && i !== weekCol && row[i] !== undefined && row[i] !== '') {
          overrides[h] = row[i]
        }
      })
      result.set(agentId, overrides)
    }

    return result
  } catch (err) {
    console.error('[Sheets] getAgentOverrides error:', err.message)
    return new Map()
  }
}
