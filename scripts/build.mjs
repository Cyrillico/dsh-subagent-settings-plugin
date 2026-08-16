#!/usr/bin/env node
import { access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const required = [
  'lib/index.js',
  'lib/logic.js',
  'lib/http.js',
  'lib/client.js',
  'cordis.patch.yml',
  'package.json',
]

for (const rel of required) {
  await access(join(root, rel))
}

console.log('dsh-subagent-settings-plugin: build ok (plain JS, no compile)')
