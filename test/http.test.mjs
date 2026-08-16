import test from 'node:test'
import assert from 'node:assert/strict'
import { isLocalHostHeader, normalizePatch } from '../lib/http.js'

test('isLocalHostHeader accepts loopback hosts', () => {
  assert.equal(isLocalHostHeader('127.0.0.1:3080'), true)
  assert.equal(isLocalHostHeader('localhost'), true)
  assert.equal(isLocalHostHeader('[::1]:3080'), true)
  assert.equal(isLocalHostHeader('192.168.1.2:3080'), false)
})

test('normalizePatch accepts a single field write', () => {
  assert.deepEqual(normalizePatch({ field: 'model', value: 'grok-4.6' }), { model: 'grok-4.6' })
})

test('normalizePatch ignores unknown fields', () => {
  assert.deepEqual(normalizePatch({ field: 'apiKey', value: 'secret' }), {})
})
