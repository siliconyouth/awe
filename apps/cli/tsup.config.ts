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
  external: [
    '@awe/shared', 
    '@awe/database',
    '@awe/ai',
    'fs-extra',
    'inquirer',
    'ora',
    'chalk',
    'boxen',
    'commander',
    'winston'
  ]
})