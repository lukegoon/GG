import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin user
  const adminHash = await bcrypt.hash('Admin1234!', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@recruitiq.com' },
    update: {},
    create: {
      email: 'admin@recruitiq.com',
      passwordHash: adminHash,
      role: 'MANAGER',
    },
  })
  console.log('Admin user:', admin.email)

  // Default app settings
  const settings = [
    { key: 'syncSchedule',         value: '*/15 7-20 * * 1-5' },
    { key: 'syncEnabled',          value: 'true' },
    { key: 'syncLock',             value: '' },
    { key: 'lastSyncAt',           value: '' },
    { key: 'contactRateBenchmark', value: '55' },
    { key: 'schedPctBenchmark',    value: '22' },
    { key: 'hangUpBenchmark',      value: '30' },
    { key: 'ngfBenchmark',         value: '45' },
    { key: 'pauseBenchmark',       value: '40' },
    { key: 'wrapBenchmark',        value: '15' },
    { key: 'hireSheetTab',         value: 'Hires' },
    { key: 'goalsSheetTab',        value: 'Goals' },
    { key: 'notesSheetTab',        value: 'Notes' },
    { key: 'overridesSheetTab',    value: 'Overrides' },
  ]

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  console.log('Seed complete. Run a manual sync from the Admin page to load rep data from Convoso.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
