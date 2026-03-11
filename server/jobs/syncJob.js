import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { getAgentReport, getListReport, mapAgentRow, mapListRow } from '../services/convosoService.js'
import { getHireConfirmations, getWeeklyGoals, getManagerNotes, getAgentOverrides } from '../services/sheetsService.js'
import { computeAllScores } from '../services/compositeScore.js'
import { tagIndustry } from '../services/industryTagger.js'

const prisma = new PrismaClient()

export function getMostRecentMonday(date = new Date()) {
  const d = new Date(date)
  const day = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1))
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function broadcast(wss, event, data = {}) {
  if (!wss) return
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ event, ...data }))
    }
  })
}

export function startSyncJob(app) {
  const schedule = process.env.CRON_SCHEDULE || '*/15 7-20 * * 1-5'
  cron.schedule(schedule, () => runSync(app))
  console.log(`Sync job scheduled: ${schedule}`)
}

export async function runSync(app, weekStartOverride = null) {
  const wss = app?.get?.('wss') ?? null

  // Mutex lock via AppSetting to prevent parallel runs
  const lock = await prisma.appSetting.findUnique({ where: { key: 'syncLock' } })
  if (lock?.value) {
    console.log('[Sync] Already running, skipping.')
    return null
  }

  await prisma.appSetting.update({ where: { key: 'syncLock' }, data: { value: 'locked' } })

  const syncLog = await prisma.syncLog.create({
    data: { type: 'full', status: 'running', weekStart: weekStartOverride ?? getMostRecentMonday() }
  })

  broadcast(wss, 'sync_start', { syncLogId: syncLog.id })

  try {
    const weekStart = weekStartOverride ?? getMostRecentMonday()
    let recordsUpdated = 0

    // 1. Pull Convoso agent report
    const agentRows = await getAgentReport(weekStart)
    console.log(`[Sync] Convoso returned ${agentRows.length} agent rows`)

    // 2. Pull Convoso list report
    const listRows = await getListReport(weekStart).catch(err => {
      console.warn('[Sync] List report failed (non-fatal):', err.message)
      return []
    })

    // 3. Pull Google Sheets data
    const [hiresMap, goalsMap, sheetNotes, overridesMap] = await Promise.all([
      getHireConfirmations(weekStart),
      getWeeklyGoals(weekStart),
      getManagerNotes(weekStart),
      getAgentOverrides(weekStart),
    ])

    // 4. Upsert reps from Convoso agent data
    const repByConvosoId = new Map()
    for (const row of agentRows) {
      const mapped = mapAgentRow(row)
      if (!mapped.convosoId) continue

      const rep = await prisma.rep.upsert({
        where: { convosoId: mapped.convosoId },
        update: { active: true },
        create: {
          convosoId: mapped.convosoId,
          name: String(row.agent_name ?? row.name ?? mapped.convosoId),
          email: `${mapped.convosoId}@convoso.local`,
          active: true,
        },
      })
      repByConvosoId.set(mapped.convosoId, rep)
    }

    // 5. Upsert WeeklyStat for each agent
    const allStatData = []
    for (const row of agentRows) {
      const mapped = mapAgentRow(row)
      if (!mapped.convosoId) continue
      const rep = repByConvosoId.get(mapped.convosoId)
      if (!rep) continue

      const hires = hiresMap.get(mapped.convosoId) ?? mapped.hires ?? 0
      const overrides = overridesMap.get(mapped.convosoId) ?? {}

      const statData = {
        calls:       mapped.calls,
        contacts:    mapped.contacts,
        sched:       mapped.sched,
        hires:       parseInt(overrides.hires ?? hires),
        noAns:       mapped.noAns,
        hu:          mapped.hu,
        ngf:         mapped.ngf,
        fu:          mapped.fu,
        alreadySched:mapped.alreadySched,
        dupe:        mapped.dupe,
        eodYes:      mapped.eodYes,
        eodNo:       mapped.eodNo,
        talkMin:     mapped.talkMin,
        waitMin:     mapped.waitMin,
        pauseMin:    mapped.pauseMin,
        wrapMin:     mapped.wrapMin,
        loginMin:    mapped.loginMin,
      }

      const stat = await prisma.weeklyStat.upsert({
        where: { repId_weekStart: { repId: rep.id, weekStart } },
        update: statData,
        create: { repId: rep.id, weekStart, ...statData },
      })
      allStatData.push(stat)
      recordsUpdated++
    }

    // 6. Recompute composite scores for all reps this week
    if (allStatData.length > 0) {
      const withScores = computeAllScores(allStatData)
      for (const s of withScores) {
        await prisma.weeklyStat.update({
          where: { id: s.id },
          data: { compositeScore: s.compositeScore },
        })
      }
    }

    // 7. Upsert goals from Sheets
    for (const [convosoId, metricsMap] of goalsMap) {
      const rep = repByConvosoId.get(convosoId)
      if (!rep) continue
      for (const [metric, target] of metricsMap) {
        await prisma.repGoal.upsert({
          where: { repId_weekStart_metric: { repId: rep.id, weekStart, metric } },
          update: { target },
          create: { repId: rep.id, weekStart, metric, target },
        })
      }
    }

    // 8. Import manager notes from Sheets (create only — don't overwrite manual notes)
    for (const note of sheetNotes) {
      const rep = repByConvosoId.get(note.convosoId)
      if (!rep) continue
      const existing = await prisma.managerNote.findFirst({
        where: { repId: rep.id, weekStart, content: note.content }
      })
      if (!existing) {
        await prisma.managerNote.create({
          data: { repId: rep.id, weekStart: note.weekStart, content: note.content, authorId: 0 }
        })
      }
    }

    // 9. Upsert list stats
    for (const row of listRows) {
      const mapped = mapListRow(row)
      if (!mapped.listName) continue

      const industry = tagIndustry(mapped.listName)
      const list = await prisma.clientList.upsert({
        where: { id: (await prisma.clientList.findFirst({ where: { name: mapped.listName } }))?.id ?? 0 },
        update: {},
        create: { name: mapped.listName, industry, source: 'convoso' },
      })

      await prisma.listStat.upsert({
        where: { listId_weekStart: { listId: list.id, weekStart } },
        update: { calls: mapped.calls, contacts: mapped.contacts, sched: mapped.sched },
        create: { listId: list.id, weekStart, calls: mapped.calls, contacts: mapped.contacts, sched: mapped.sched },
      })
    }

    // 10. Finalize sync log
    await prisma.appSetting.update({ where: { key: 'lastSyncAt' }, data: { value: new Date().toISOString() } })
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: 'success', recordsUpdated, completedAt: new Date() },
    })

    broadcast(wss, 'sync_complete', {
      syncedAt: new Date().toISOString(),
      recordsUpdated,
      weekStart: weekStart.toISOString(),
    })

    console.log(`[Sync] Complete — ${recordsUpdated} records updated`)
    return syncLog.id

  } catch (err) {
    console.error('[Sync] Error:', err.message)
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { status: 'error', errorMessage: err.message, completedAt: new Date() },
    })
    broadcast(wss, 'sync_error', { error: err.message })
    return syncLog.id
  } finally {
    await prisma.appSetting.update({ where: { key: 'syncLock' }, data: { value: '' } }).catch(() => {})
  }
}
