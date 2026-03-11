import axios from 'axios'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// TODO: Verify exact endpoint paths with Convoso once API access is configured.
// Documented base: https://api.convoso.com  (set CONVOSO_BASE_URL in .env)
// Auth: Bearer token via CONVOSO_API_KEY

async function getClient() {
  // API key stored in AppSetting for hot-reload without container restart
  const setting = await prisma.appSetting.findUnique({ where: { key: 'convosoApiKey' } })
  const apiKey = setting?.value || process.env.CONVOSO_API_KEY || ''

  return axios.create({
    baseURL: process.env.CONVOSO_BASE_URL || 'https://api.convoso.com',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  })
}

function isoDate(date) {
  return date instanceof Date ? date.toISOString().split('T')[0] : date
}

function addDays(date, n) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

// Fetch agent performance report for a week
// Returns array of agent stat rows (raw from Convoso)
export async function getAgentReport(weekStart) {
  const client = await getClient()
  const startDate = isoDate(weekStart)
  const endDate = isoDate(addDays(weekStart, 6))

  try {
    // TODO: Confirm exact Convoso endpoint — may be /v1/reports/agent or /v1/reports/agent-performance
    const response = await client.get('/v1/reports/agent-performance', {
      params: { start_date: startDate, end_date: endDate, group_by: 'agent' }
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[Convoso] Raw agent report sample:', JSON.stringify(response.data?.data?.[0] ?? {}, null, 2))
    }

    return response.data?.data ?? response.data ?? []
  } catch (err) {
    console.error('[Convoso] getAgentReport error:', err.response?.data ?? err.message)
    throw err
  }
}

// Fetch list contact rate report for a week
export async function getListReport(weekStart) {
  const client = await getClient()
  const startDate = isoDate(weekStart)
  const endDate = isoDate(addDays(weekStart, 6))

  try {
    // TODO: Confirm exact Convoso endpoint
    const response = await client.get('/v1/reports/list-contact-rate', {
      params: { start_date: startDate, end_date: endDate }
    })
    return response.data?.data ?? response.data ?? []
  } catch (err) {
    console.error('[Convoso] getListReport error:', err.response?.data ?? err.message)
    throw err
  }
}

// Map a single Convoso agent row to WeeklyStat field names
// TODO: Update field names once you have a real API response sample
export function mapAgentRow(row) {
  return {
    // These field names are guesses based on common Convoso conventions.
    // Run one sync in dev mode and check the logged "Raw agent report sample" above.
    calls:       parseInt(row.total_calls ?? row.calls ?? 0),
    contacts:    parseInt(row.contacts ?? row.total_contacts ?? 0),
    sched:       parseInt(row.scheduled ?? row.schedules ?? row.sched ?? 0),
    hires:       parseInt(row.hires ?? 0), // May come from Google Sheets instead
    noAns:       parseInt(row.no_answer ?? row.no_ans ?? 0),
    hu:          parseInt(row.hang_up ?? row.hu ?? row.hangup ?? 0),
    ngf:         parseInt(row.not_good_fit ?? row.ngf ?? 0),
    fu:          parseInt(row.follow_up ?? row.fu ?? 0),
    alreadySched:parseInt(row.already_scheduled ?? row.already_sched ?? 0),
    dupe:        parseInt(row.duplicate ?? row.dupe ?? 0),
    eodYes:      parseInt(row.eod_yes ?? row.survey_yes ?? 0),
    eodNo:       parseInt(row.eod_no ?? row.survey_no ?? 0),
    talkMin:     parseFloat(row.talk_time_min ?? row.talk_minutes ?? (row.talk_time_sec / 60) ?? 0),
    waitMin:     parseFloat(row.wait_time_min ?? row.wait_minutes ?? (row.wait_time_sec / 60) ?? 0),
    pauseMin:    parseFloat(row.pause_time_min ?? row.pause_minutes ?? (row.pause_time_sec / 60) ?? 0),
    wrapMin:     parseFloat(row.wrap_time_min ?? row.wrap_minutes ?? (row.wrap_time_sec / 60) ?? 0),
    loginMin:    parseFloat(row.login_time_min ?? row.login_minutes ?? (row.login_time_sec / 60) ?? 0),
    convosoId:   String(row.agent_id ?? row.user_id ?? row.id ?? ''),
  }
}

// Map a single Convoso list row to ListStat field names
export function mapListRow(row) {
  return {
    calls:    parseInt(row.total_calls ?? row.calls ?? 0),
    contacts: parseInt(row.contacts ?? 0),
    sched:    parseInt(row.scheduled ?? row.sched ?? 0),
    listName: String(row.list_name ?? row.name ?? ''),
    listId:   String(row.list_id ?? row.id ?? ''),
  }
}
