import { useState } from 'react'
import { Link } from 'react-router-dom'

const TERMS = [
  {
    term: 'Calls',
    formula: 'Raw dial count from Convoso',
    bench: null,
    desc: 'Total number of outbound calls placed during the week, including all dispositions.',
  },
  {
    term: 'Contacts',
    formula: 'Calls where a live person answered',
    bench: null,
    desc: 'Calls resulting in a human conversation — excludes voicemail, busy, no-answer.',
  },
  {
    term: 'Contact Rate',
    formula: 'contacts ÷ calls',
    bench: '≥55%',
    desc: 'The percentage of calls that reach a live person. Influenced by list quality, call timing, and dialer settings.',
  },
  {
    term: 'Schedules (Sched)',
    formula: 'Contacts converted to appointments',
    bench: null,
    desc: 'Total number of appointments booked during the week.',
  },
  {
    term: 'Schedule Rate (Sched%)',
    formula: 'sched ÷ contacts',
    bench: '≥22%',
    desc: 'Of every contact, what percentage resulted in a scheduled appointment. Primary conversion quality metric.',
  },
  {
    term: 'Sched / Hour',
    formula: 'sched ÷ (loginMin ÷ 60)',
    bench: 'Team average',
    desc: 'Productivity metric. Schedules produced per hour of logged-in time. Combines conversion quality and efficiency.',
  },
  {
    term: 'Hires',
    formula: 'From Google Sheets confirmations',
    bench: null,
    desc: 'Candidates who were scheduled and showed up for hiring. Pulled from the hire confirmation sheet.',
  },
  {
    term: 'Hang-Up Rate (HU%)',
    formula: 'hu ÷ contacts',
    bench: '≤30%',
    desc: 'Contacts who ended the call before you could qualify them. Reflects the quality of your opening hook.',
  },
  {
    term: 'Not a Good Fit (NGF%)',
    formula: 'ngf ÷ contacts',
    bench: '≤45%',
    desc: 'Contacts disqualified during the conversation. High NGF indicates poor list targeting or late qualification.',
  },
  {
    term: 'No-Answer Rate',
    formula: 'noAns ÷ calls',
    bench: '≤42%',
    desc: 'Calls with no answer. Increases with stale lists, off-hours calling, or wrong dialer settings.',
  },
  {
    term: 'EOD Yes Rate',
    formula: 'eodYes ÷ (eodYes + eodNo)',
    bench: '≥35%',
    desc: 'End-of-day survey: candidate said they are confident they will show up. Low EOD Yes rate predicts low show rate.',
  },
  {
    term: 'Talk Time (talkMin)',
    formula: 'Minutes spent in active conversation',
    bench: null,
    desc: 'Total minutes talking with contacts. Does not include hold, pause, or wrap time.',
  },
  {
    term: 'Pause Time (pauseMin)',
    formula: 'Minutes between calls while logged in',
    bench: '≤avg',
    desc: 'Idle time between calls. Excess pause time directly reduces sched/hr by reducing calling volume.',
  },
  {
    term: 'Wrap Time (wrapMin)',
    formula: 'Minutes spent logging after each call',
    bench: '≤avg',
    desc: 'Post-call administration time. High wrap time indicates over-documentation or manual research during wrap.',
  },
  {
    term: 'Talk Efficiency',
    formula: 'talkMin ÷ (talkMin + waitMin + pauseMin + wrapMin)',
    bench: 'Higher = better',
    desc: 'Fraction of total logged time spent in actual conversation. Top performers maximize this ratio.',
  },
  {
    term: 'Composite Score',
    formula: 'Weighted percentile rank: Sched%(30) + Sched/Hr(25) + Contact%(20) + TalkEff(15) + EOD Yes(10)',
    bench: '≥70 = top tier',
    desc: 'Overall performance score from 0–100. Uses percentile ranking so the score reflects performance relative to the team, not absolute thresholds.',
  },
  {
    term: 'Follow-Up (FU)',
    formula: 'Contacts requesting a callback',
    bench: null,
    desc: 'Contacts who did not book immediately but requested a follow-up call.',
  },
  {
    term: 'Already Scheduled',
    formula: 'Contacts with an existing appointment',
    bench: null,
    desc: 'Contacts who already had an appointment when called — indicates list overlap or duplicate outreach.',
  },
  {
    term: 'Duplicate (Dupe)',
    formula: 'Calls to the same number > 1x this week',
    bench: null,
    desc: 'Duplicate contacts called multiple times in the same week. High dupes indicate list quality issues.',
  },
]

export default function Glossary() {
  const [search, setSearch] = useState('')

  const filtered = TERMS.filter(t =>
    !search || t.term.toLowerCase().includes(search.toLowerCase()) ||
    t.desc.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-bg">
      <header className="bg-surface border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-heading text-xl text-accent tracking-widest">
          RECRUIT<span className="text-text2">IQ</span>
        </Link>
        <Link to="/" className="btn-ghost text-sm">← Back to Dashboard</Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-heading text-4xl text-text1 mb-2">Metric Glossary</h1>
        <p className="text-text3 mb-6">Definitions, formulas, and benchmarks for every metric in the dashboard.</p>

        <input
          className="input w-full mb-6"
          placeholder="Search metrics…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="space-y-4">
          {filtered.map(t => (
            <div key={t.term} className="card">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <h2 className="font-semibold text-text1">{t.term}</h2>
                {t.bench && (
                  <span className="badge-blue">{t.bench}</span>
                )}
              </div>
              <p className="text-text2 text-sm mt-1">{t.desc}</p>
              <p className="text-text3 text-xs font-mono mt-2">{t.formula}</p>
            </div>
          ))}
          {!filtered.length && <p className="text-text3 text-center py-8">No matching terms.</p>}
        </div>
      </main>
    </div>
  )
}
