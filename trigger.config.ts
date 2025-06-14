import { defineConfig } from '@trigger.dev/sdk/v3'

export default defineConfig({
  project: 'proj_yewubdlbjccxwzskauad',
  runtime: 'node',
  logLevel: 'log',
  maxDuration: 300,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 2,
      minTimeoutInMs: 1_000,
      maxTimeoutInMs: 10_000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ['./src/trigger'],
})
