import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', 'dist', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        '.next',
        '**/*.config.ts',
        '**/*.config.js',
        '**/tests/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './apps/web/app'),
      '@awe/ai': resolve(__dirname, './packages/ai/src'),
      '@awe/database': resolve(__dirname, './packages/database/src'),
      '@awe/shared': resolve(__dirname, './packages/shared/src'),
      '@awe/auth': resolve(__dirname, './packages/auth/src'),
      '@awe/config': resolve(__dirname, './packages/config/src')
    }
  }
})