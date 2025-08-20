import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'bin/awe': 'src/bin/awe.ts',
    'scripts/setup': 'src/scripts/setup.ts',
    'scripts/validate-setup': 'src/scripts/validate-setup.ts',
    index: 'src/index.ts'
  },
  format: ['cjs'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  banner: {
    js: '#!/usr/bin/env node\n',
  },
  // Bundle workspace dependencies for npm publishing
  noExternal: [
    '@awe/shared',
    '@awe/database', 
    '@awe/ai'
  ],
  // Keep these as external since they're in package.json dependencies
  external: [
    '@supabase/supabase-js',
    'boxen',
    'chalk',
    'commander',
    'inquirer',
    'ora',
    'winston',
    '@prisma/client',
    '@anthropic-ai/sdk',
    'dotenv',
    'zod',
    // Exclude heavy dependencies that aren't needed in CLI
    'playwright',
    'playwright-core',
    '@playwright/test',
    'puppeteer',
    'puppeteer-core',
    'cheerio',
    'jsdom',
    '@swc/core',
    'esbuild',
    'typescript',
    'vite',
    'next',
    'react',
    'react-dom'
  ],
  esbuildOptions(options) {
    options.platform = 'node'
    options.target = 'node22'
  }
})