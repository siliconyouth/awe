import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false, // Temporarily disable DTS generation to avoid build errors
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@anthropic-ai/sdk'],
  skipNodeModulesBundle: true
})