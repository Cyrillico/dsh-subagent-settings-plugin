import test from 'node:test'
import assert from 'node:assert/strict'
import { applyAgentOptions, applyCallConfig, applyContinuableSpec, isSubagent } from '../lib/logic.js'

const cfg = {
  enabled: true,
  inheritParent: false,
  provider: 'codex-gateway-subagent',
  model: 'gpt-5.6-terra',
  reasoningEffort: 'xhigh',
}

test('applyAgentOptions overrides provider and model', () => {
  const next = applyAgentOptions(cfg, {
    prompt: [],
    agentOptions: { provider: 'codex-gateway', model: 'gpt-5.6-sol' },
  })
  assert.deepEqual(next.agentOptions, {
    provider: 'codex-gateway-subagent',
    model: 'gpt-5.6-terra',
  })
})

test('applyAgentOptions can inherit the parent route', () => {
  const next = applyAgentOptions({ ...cfg, inheritParent: true }, {
    prompt: ['x'],
    agentOptions: { provider: 'codex-gateway-subagent', model: 'gpt-5.6-terra' },
  })
  assert.equal(next.agentOptions, undefined)
  assert.deepEqual(next.prompt, ['x'])
})

test('disabled config leaves the request alone', () => {
  const request = { agentOptions: { provider: 'keep', model: 'me' } }
  assert.equal(applyAgentOptions({ ...cfg, enabled: false }, request), request)
})

test('applyCallConfig writes model and reasoning onto child requests', () => {
  const next = applyCallConfig(cfg, {
    provider: 'codex-gateway',
    model: 'gpt-5.6-sol',
    reasoningEffort: 'max',
  })
  assert.deepEqual(next, {
    provider: 'codex-gateway-subagent',
    model: 'gpt-5.6-terra',
    reasoningEffort: 'xhigh',
  })
})

test('inherit reasoning drops an explicit effort', () => {
  const next = applyCallConfig({ ...cfg, inheritParent: true, reasoningEffort: 'inherit' }, {
    provider: 'codex-gateway',
    model: 'gpt-5.6-sol',
    reasoningEffort: 'max',
  })
  assert.equal(next.provider, 'codex-gateway')
  assert.equal(next.model, 'gpt-5.6-sol')
  assert.equal(next.reasoningEffort, undefined)
})

test('applyContinuableSpec patches the nested request', () => {
  const next = applyContinuableSpec(cfg, {
    provider: 'spawn',
    request: { agentOptions: { provider: 'old', model: 'old' } },
  })
  assert.equal(next.provider, 'spawn')
  assert.equal(next.request.agentOptions.model, 'gpt-5.6-terra')
})

test('isSubagent detects depth and origin', () => {
  assert.equal(isSubagent({ options: { subagentDepth: 1 } }), true)
  assert.equal(isSubagent({ options: {}, session: { header: { meta: { origin: 'subagent' } } } }), true)
  assert.equal(isSubagent({ options: {}, session: { header: { meta: { delegationDepth: 2 } } } }), true)
  assert.equal(isSubagent({ options: {}, session: { header: { meta: {} } } }), false)
})
