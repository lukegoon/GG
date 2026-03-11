import { getDerivedMetrics } from './compositeScore.js'

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * sorted.length)
  return sorted[Math.min(idx, sorted.length - 1)] ?? 0
}

function teamStats(allStats) {
  const metrics = allStats.map(getDerivedMetrics)
  return {
    avgSchedPct:    avg(metrics.map(m => m.schedPct)),
    avgSchedHour:   avg(metrics.map(m => m.schedHour)),
    avgContactRate: avg(metrics.map(m => m.contactRate)),
    avgTalkEff:     avg(metrics.map(m => m.talkEff)),
    avgEodYes:      avg(metrics.map(m => m.eodYesRate)),
    avgPauseMin:    avg(allStats.map(s => s.pauseMin)),
    avgWrapMin:     avg(allStats.map(s => s.wrapMin)),
    avgHu:          avg(allStats.map(s => s.contacts > 0 ? s.hu / s.contacts : 0)),
    avgNgf:         avg(allStats.map(s => s.contacts > 0 ? s.ngf / s.contacts : 0)),
    avgNoAns:       avg(allStats.map(s => s.calls > 0 ? s.noAns / s.calls : 0)),
    avgHires:       avg(allStats.map(s => s.hires)),
    p75SchedPct:    percentile(metrics.map(m => m.schedPct), 75),
    p75SchedHour:   percentile(metrics.map(m => m.schedHour), 75),
    p75ContactRate: percentile(metrics.map(m => m.contactRate), 75),
    topSchedHour:   Math.max(...metrics.map(m => m.schedHour)),
  }
}

export function generateInsights(repStat, allStats) {
  const m = getDerivedMetrics(repStat)
  const t = teamStats(allStats)
  const results = []

  const pct = v => (v * 100).toFixed(1) + '%'
  const round1 = v => Math.round(v * 10) / 10

  // --- SCHED PCT ---
  if (m.schedPct < t.avgSchedPct * 0.85 && repStat.contacts > 0) {
    const gap = t.avgSchedPct - m.schedPct
    const lostSched = Math.round(gap * repStat.contacts)
    results.push({
      type: 'action', priority: 1, category: 'quality',
      metric: 'schedPct',
      title: 'Schedule Rate Below Team Average',
      text: `Your schedule rate is ${pct(m.schedPct)} vs. the team average of ${pct(t.avgSchedPct)} — a ${pct(gap)} gap. At your contact volume, that's approximately ${lostSched} missed schedules this week. Focus on tightening your pitch in the first 30 seconds: state the role, the pay, and ask for a specific time slot. Avoid open-ended closes.`,
      benchmark: t.avgSchedPct,
      delta: -(gap),
    })
  }

  // --- SCHED PER HOUR ---
  if (m.schedHour < t.avgSchedHour && repStat.loginMin > 0) {
    results.push({
      type: 'action', priority: 2, category: 'efficiency',
      metric: 'schedHour',
      title: 'Schedules Per Hour Below Average',
      text: `Your ${round1(m.schedHour)} sched/hr is below the team average of ${round1(t.avgSchedHour)} sched/hr. The top performer is hitting ${round1(t.topSchedHour)} sched/hr. Reduce dead time between calls by using auto-dial instead of manual selection, and have your opening ready before the call connects.`,
      benchmark: t.avgSchedHour,
      delta: m.schedHour - t.avgSchedHour,
    })
  }

  // --- CONTACT RATE ---
  const contactRateBenchmark = 0.55
  if (m.contactRate < contactRateBenchmark && repStat.calls > 0) {
    results.push({
      type: 'action', priority: 1, category: 'volume',
      metric: 'contactRate',
      title: 'Contact Rate Below Benchmark',
      text: `Your contact rate is ${pct(m.contactRate)}, below the ${pct(contactRateBenchmark)} benchmark. Check your call timing — contacts peak between 9–11am and 1–3pm. Verify list quality with your manager and confirm your dialer settings are not filtering viable numbers.`,
      benchmark: contactRateBenchmark,
      delta: m.contactRate - contactRateBenchmark,
    })
  }

  // --- PAUSE TIME ---
  if (repStat.pauseMin > t.avgPauseMin * 1.30 && t.avgPauseMin > 0) {
    const excessMin = round1(repStat.pauseMin - t.avgPauseMin)
    const lostSched = Math.round((excessMin / 60) * m.schedHour)
    results.push({
      type: 'action', priority: 1, category: 'efficiency',
      metric: 'pauseMin',
      title: 'Excess Pause Time Costing Schedules',
      text: `Your ${round1(repStat.pauseMin)} pause minutes is ${round1(((repStat.pauseMin / t.avgPauseMin) - 1) * 100)}% above the team average of ${round1(t.avgPauseMin)} minutes. Your ${excessMin} extra pause minutes at your ${round1(m.schedHour)} sched/hr rate cost you approximately ${lostSched} additional schedule opportunities this week. Set a 60-second maximum between calls. Use wrap-up time only to log the outcome — research and follow-ups should happen after your session.`,
      benchmark: t.avgPauseMin,
      delta: repStat.pauseMin - t.avgPauseMin,
    })
  }

  // --- WRAP TIME ---
  if (repStat.wrapMin > t.avgWrapMin * 1.50 && t.avgWrapMin > 0) {
    const excessMin = round1(repStat.wrapMin - t.avgWrapMin)
    results.push({
      type: 'action', priority: 2, category: 'efficiency',
      metric: 'wrapMin',
      title: 'Wrap-Up Time Significantly Above Average',
      text: `Your wrap time of ${round1(repStat.wrapMin)} min is ${round1(((repStat.wrapMin / t.avgWrapMin) - 1) * 100)}% over the team average of ${round1(t.avgWrapMin)} min — ${excessMin} extra minutes. Use abbreviations when logging dispositions, have common follow-up templates ready to paste, and aim to close each call in under 30 seconds of wrap time.`,
      benchmark: t.avgWrapMin,
      delta: repStat.wrapMin - t.avgWrapMin,
    })
  }

  // --- HANG-UP RATE ---
  const huRate = repStat.contacts > 0 ? repStat.hu / repStat.contacts : 0
  if (huRate > 0.30) {
    results.push({
      type: 'action', priority: 1, category: 'quality',
      metric: 'hu',
      title: 'High Hang-Up Rate — Opening Hook Needs Work',
      text: `${pct(huRate)} of your contacts hung up before you could qualify them, vs. the team average of ${pct(t.avgHu)}. Your first 5 seconds determine whether they stay. Lead with the job title and pay rate immediately: "Hi [Name], I'm calling about a [Role] paying $[X]/hr in [City] — do you have 60 seconds?" Avoid scripted intros that signal telemarketer.`,
      benchmark: t.avgHu,
      delta: huRate - t.avgHu,
    })
  }

  // --- NGF RATE ---
  const ngfRate = repStat.contacts > 0 ? repStat.ngf / repStat.contacts : 0
  if (ngfRate > 0.45) {
    results.push({
      type: 'action', priority: 1, category: 'quality',
      metric: 'ngf',
      title: 'High "Not a Good Fit" Rate',
      text: `${pct(ngfRate)} of contacts are disqualifying vs. the team average of ${pct(t.avgNgf)}. Add qualifying criteria earlier in the call: confirm location, availability, and basic eligibility before pitching. This reduces time spent on bad fits and keeps your sched rate high. Ask "Are you currently available for full-time work in [City]?" within the first 30 seconds.`,
      benchmark: t.avgNgf,
      delta: ngfRate - t.avgNgf,
    })
  }

  // --- NO ANSWER RATE ---
  const noAnsRate = repStat.calls > 0 ? repStat.noAns / repStat.calls : 0
  if (noAnsRate > 0.42) {
    results.push({
      type: 'action', priority: 2, category: 'volume',
      metric: 'noAns',
      title: 'High No-Answer Rate',
      text: `${pct(noAnsRate)} of your calls hit no answer vs. the team average of ${pct(t.avgNoAns)}. This is often a list timing issue. Request a callback time from contacts who do pick up, and ask your manager about list recency — stale numbers dramatically inflate no-answer rates.`,
      benchmark: t.avgNoAns,
      delta: noAnsRate - t.avgNoAns,
    })
  }

  // --- HIRES ---
  if (repStat.hires < t.avgHires * 0.80 && t.avgHires > 0) {
    const showRate = repStat.sched > 0 ? (repStat.hires / repStat.sched * 100).toFixed(0) : 'N/A'
    results.push({
      type: 'action', priority: 2, category: 'outcomes',
      metric: 'hires',
      title: 'Hires Below Team Average',
      text: `Your ${repStat.hires} hire${repStat.hires !== 1 ? 's' : ''} is below the team average of ${round1(t.avgHires)}. Your show rate is ${showRate}% (hires/schedules). ${parseFloat(showRate) < 30 ? 'A low show rate suggests candidates are not showing up — reinforce confirmation texts and day-before reminder calls.' : 'Your schedule volume is the lever — focus on the schedule rate action items above to increase the pipeline feeding hires.'}`,
      benchmark: t.avgHires,
      delta: repStat.hires - t.avgHires,
    })
  }

  // --- EOD YES RATE ---
  const eodTotal = repStat.eodYes + repStat.eodNo
  if (eodTotal > 0 && m.eodYesRate < 0.35) {
    results.push({
      type: 'action', priority: 3, category: 'outcomes',
      metric: 'eodYes',
      title: 'Low EOD Survey Positive Rate',
      text: `Only ${pct(m.eodYesRate)} of your EOD survey responses are positive. This correlates with lower show rates. At the end of each scheduled call, confirm the time, address, and what to bring — and ask "On a scale of 1–10, how confident are you that you'll be there?" for any score under 7, reschedule immediately.`,
      benchmark: 0.35,
      delta: m.eodYesRate - 0.35,
    })
  }

  // --- COMPOSITE ALERT: HIGH TALK TIME + LOW SCHED PCT ---
  if (m.talkEff > 0 && repStat.talkMin > avg(allStats.map(s => s.talkMin)) * 1.15 && m.schedPct < t.avgSchedPct) {
    results.push({
      type: 'alert', priority: 1, category: 'efficiency',
      metric: 'talkMin',
      title: 'High Talk Time But Low Schedule Rate',
      text: `You're spending more time on calls than average (${round1(repStat.talkMin)} min vs. team avg ${round1(avg(allStats.map(s => s.talkMin)))} min) but scheduling below average. Long calls without conversions mean you're losing control of the conversation. Practice a 90-second pitch cap: if they haven't agreed to a time by then, ask directly "Can I put you down for [time] on [day]?" and close.`,
      benchmark: t.avgSchedPct,
      delta: m.schedPct - t.avgSchedPct,
    })
  }

  // --- COMPOSITE ALERT: HIGH CALL VOLUME + LOW SCHED PCT ---
  if (repStat.calls > avg(allStats.map(s => s.calls)) * 1.15 && m.schedPct < t.avgSchedPct * 0.85) {
    results.push({
      type: 'alert', priority: 1, category: 'quality',
      metric: 'calls',
      title: 'High Volume, Low Conversion',
      text: `You're making ${repStat.calls} calls (${round1(((repStat.calls / avg(allStats.map(s => s.calls))) - 1) * 100)}% above average) but your schedule rate of ${pct(m.schedPct)} is well below the team. Volume alone won't hit target — focus on conversion quality. Review your pitch with your manager and consider listening back to recorded calls.`,
      benchmark: t.avgSchedPct,
      delta: m.schedPct - t.avgSchedPct,
    })
  }

  // --- MAINTAIN: TOP QUARTILE METRICS ---
  const topMetrics = [
    { key: 'schedPct', label: 'Schedule Rate', val: m.schedPct, p75: t.p75SchedPct },
    { key: 'schedHour', label: 'Schedules/Hour', val: m.schedHour, p75: t.p75SchedHour },
    { key: 'contactRate', label: 'Contact Rate', val: m.contactRate, p75: t.p75ContactRate },
  ]
  for (const { key, label, val, p75 } of topMetrics) {
    if (val >= p75) {
      results.push({
        type: 'maintain', priority: 3, category: 'quality',
        metric: key,
        title: `Top 25% — ${label}`,
        text: `Your ${label} of ${key === 'schedHour' ? round1(val) + ' sched/hr' : pct(val)} puts you in the top quartile of the team. Keep the behaviors that got you here consistent — don't change your approach when you have a slow day.`,
        benchmark: p75,
        delta: val - p75,
      })
    }
  }

  // --- HELP: Hang-ups (manager coaching prompt) ---
  if (huRate > t.avgHu * 1.2) {
    results.push({
      type: 'help', priority: 2, category: 'quality',
      metric: 'hu',
      title: 'Manager: Review Opening Script',
      text: `Ask this rep to role-play their opening hook with you. Listen for: (1) does the value prop come in the first 5 seconds? (2) are they using a question to engage rather than a monologue? Consider pairing with the team's lowest hang-up rep for a listen-and-learn session.`,
      benchmark: t.avgHu,
      delta: huRate - t.avgHu,
    })
  }

  return results.sort((a, b) => a.priority - b.priority)
}
