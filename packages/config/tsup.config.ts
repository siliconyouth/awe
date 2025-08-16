import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['@awe/shared', '@awe/database'],
  splitting: false,
  minify: false
})