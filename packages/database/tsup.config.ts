import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true, // Enable DTS generation for TypeScript types
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@prisma/client', '@supabase/supabase-js', '@awe/shared'],
  skipNodeModulesBundle: true
})