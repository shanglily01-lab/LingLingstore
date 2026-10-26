import { stitch } from '@google/stitch-sdk'

async function main() {
  if (!process.env.STITCH_API_KEY) {
    console.error('Set STITCH_API_KEY first')
    process.exit(1)
  }
  const projects = await stitch.projects()
  console.log(`Found ${projects.length} project(s):\n`)
  for (const p of projects) {
    console.log(`- title: ${p.title ?? '(no title)'}`)
    console.log(`  projectId: ${p.projectId ?? p.id}`)
    const screens = await p.screens().catch(() => [])
    console.log(`  screens: ${screens.length}`)
    for (const s of screens.slice(0, 5)) {
      console.log(`    · ${s.screenId ?? s.id}`)
    }
    console.log('')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
