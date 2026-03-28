import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2)
const runAllTests = args.includes('-a') || args.includes('--all')

const filteredArgs = args.filter((arg) => arg !== '-a' && arg !== '--all')

const result = spawnSync(
  'bun',
  ['x', 'vitest', 'run', ...filteredArgs],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      RUN_INTEGRATION: runAllTests ? '1' : process.env.RUN_INTEGRATION,
    },
  },
)

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}
