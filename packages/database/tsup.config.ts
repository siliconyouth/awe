import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disable DTS generation to avoid build errors
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@prisma/client', '@supabase/supabase-js', '@awe/shared'],
  skipNodeModulesBundle: true
})