# AWE Environment Loader

Fast, secure environment variable loader with encryption support. No delays, no external dependencies.

## Features

- ⚡ **Instant loading** - No delays like dotenvx (~50ms vs 1-2s)
- 🔐 **Secure encryption** - AES-256-CBC with PBKDF2
- 💾 **In-memory caching** - Fast subsequent loads
- 🔒 **No cloud dependencies** - Everything stays local
- 🚀 **Zero configuration** - Works out of the box

## Usage

### Basic Usage

Load environment variables from `.env.local`:

```bash
# From database package
pnpm db:migrate

# Or directly
node scripts/env-loader.js ../../.env.local 'pnpm prisma migrate dev'
```

### Encryption

Protect sensitive environment variables:

```bash
# Encrypt your .env.local file
node scripts/env-loader.js encrypt .env.local mySecretPassword

# Creates .env.local.encrypted (safe to commit if needed)
```

### Decryption and Usage

```bash
# Decrypt and run command
node scripts/env-loader.js decrypt .env.local.encrypted mySecretPassword 'pnpm dev'
```

## Database Commands

All database commands in `packages/database` use env-loader automatically:

```bash
pnpm db:generate  # Generate Prisma client
pnpm db:migrate   # Run migrations
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Prisma Studio
```

## Security Notes

- **Never commit** `.env` or `.env.local` files
- **Encrypted files** (`.env.encrypted`) can be safely shared with team
- **Passwords** cannot be recovered - store them securely
- Uses modern crypto: PBKDF2 (100k iterations) + AES-256-CBC with random salt/IV

## Performance Comparison

| Solution | Load Time | Dependencies | Cloud Required |
|----------|-----------|--------------|----------------|
| dotenvx | ~1-2s | Yes | No |
| infisical | ~500ms | Yes | Yes |
| .env symlink | Instant | No | No |
| **env-loader** | **<50ms** | **No** | **No** |

## Architecture

```
scripts/env-loader.js
  ├── Load & parse .env files
  ├── Cache in memory for speed
  ├── Inject into process.env
  ├── Spawn child process
  └── Optional encryption/decryption
      ├── PBKDF2 key derivation
      ├── AES-256-CBC encryption
      └── JSON storage format
```

## Example: Team Collaboration

1. **Developer A** encrypts the environment:
   ```bash
   node scripts/env-loader.js encrypt .env.local teamPassword123
   git add .env.local.encrypted
   git commit -m "Add encrypted environment"
   ```

2. **Developer B** decrypts and uses:
   ```bash
   git pull
   node scripts/env-loader.js decrypt .env.local.encrypted teamPassword123 'pnpm dev'
   ```

## Integration with AWE CLI

The AWE CLI automatically uses env-loader for all database operations:

```javascript
// packages/database/package.json
"scripts": {
  "env": "node ../../scripts/env-loader.js ../../.env.local",
  "db:migrate": "npm run env 'prisma migrate dev'"
}
```

This ensures instant environment loading without delays or external dependencies!