import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false, // Temporarily disable DTS generation
  sourcemap: true,
  clean: true,
  external: ['@awe/shared', '@awe/database', 'lodash', 'chalk'],
  splitting: false,
  minify: false,
  skipNodeModulesBundle: true
})