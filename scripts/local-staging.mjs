#!/usr/bin/env node
// Local credentials stay outside the repository and browser bundle.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
const config = JSON.parse(readFileSync(join(homedir(), '.config/the-preacher/local-staging.json'), 'utf8'));
const url = new URL(config.DATABASE_URL);
if (url.hostname !== '127.0.0.1' || url.pathname !== '/preacher_staging') {
  throw new Error('Local staging must use the dedicated loopback database.');
}
const command = process.argv[2] ?? 'dev';
if (!['dev', 'db:migrate', 'typecheck'].includes(command)) throw new Error('Unsupported local command');
const child = spawn('npm', ['run', command], {
  stdio: 'inherit',
  env: { ...process.env, ...config },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 1));
