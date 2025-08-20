import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/services/queue-service.ts',
    'src/services/queue-service-upstash.ts'
  ],
  format: ['cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@anthropic-ai/sdk'],
  skipNodeModulesBundle: true
})