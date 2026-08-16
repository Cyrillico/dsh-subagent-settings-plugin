export const NS = 'dsh-subagent-settings'

export const DEFAULTS = {
  enabled: true,
  inheritParent: false,
  provider: 'codex-gateway-subagent',
  model: 'gpt-5.6-terra',
  reasoningEffort: 'xhigh',
}

export function isSubagent(agent) {
  if (!agent) return false
  const depth = agent.options && agent.options.subagentDepth
  if (typeof depth === 'number' && depth > 0) return true
  const meta = agent.session && agent.session.header && agent.session.header.meta
  if (!meta) return false
  if (meta.origin === 'subagent') return true
  return typeof meta.delegationDepth === 'number' && meta.delegationDepth > 0
}

export function applyAgentOptions(cfg, request) {
  if (!cfg || cfg.enabled === false || !request) return request
  if (cfg.inheritParent) {
    const { agentOptions: _ignored, ...rest } = request
    return rest
  }
  if (!cfg.provider || !cfg.model) return request
  return {
    ...request,
    agentOptions: {
      ...(request.agentOptions || {}),
      provider: cfg.provider,
      model: cfg.model,
    },
  }
}

export function applyContinuableSpec(cfg, spec) {
  if (!spec || !spec.request) return spec
  return {
    ...spec,
    request: applyAgentOptions(cfg, spec.request),
  }
}

export function applyCallConfig(cfg, resolved) {
  if (!cfg || cfg.enabled === false || !resolved) return resolved
  const next = { ...resolved }
  if (!cfg.inheritParent && cfg.provider && cfg.model) {
    next.provider = cfg.provider
    next.model = cfg.model
  }
  const effort = cfg.reasoningEffort
  if (!effort || effort === 'inherit') {
    delete next.reasoningEffort
  } else {
    next.reasoningEffort = effort
  }
  return next
}
