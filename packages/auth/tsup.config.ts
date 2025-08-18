import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false, // Temporarily disable DTS generation to avoid build errors
  sourcemap: true,
  clean: true,
  external: ['@clerk/nextjs', '@clerk/backend', '@awe/shared', '@awe/database'],
  splitting: false,
  minify: false,
  skipNodeModulesBundle: true
})