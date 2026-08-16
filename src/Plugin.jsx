import React, { useEffect } from 'react'
import useSubagentSettings from './useSubagentSettings'
import './styles.css'

const MODELS = [
  { value: 'gpt-5.6-sol', label: 'GPT-5.6 Sol (max reasoning)' },
  { value: 'gpt-5.6-terra', label: 'GPT-5.6 Terra (xhigh)' },
  { value: 'grok-4.6', label: 'Grok-4.6 (xhigh)' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' }
]

const REASONING_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'max', label: 'Max' },
  { value: 'xhigh', label: 'XHigh (推荐)' }
]

const PROVIDERS = [
  { value: 'codex-gateway', label: 'Codex Gateway (parent)' },
  { value: 'codex-gateway-subagent', label: 'Codex Gateway Subagent (推荐)' },
  { value: 'deepseek', label: 'DeepSeek Official' }
]

export default function SubagentSettingsPlugin() {
  const { 
    model, 
    reasoningEffort, 
    provider,
    setModel, 
    setReasoningEffort, 
    setProvider,
    getAgentOptions 
  } = useSubagentSettings()

  useEffect(() => {
    // 把当前设置暴露到全局，方便 Dsh 的 spawn 逻辑读取
    window.__DSH_SUBAGENT_SETTINGS__ = getAgentOptions()
    
    // 监听 Dsh 的 spawn 事件（如果存在）
    const handleSpawn = (event) => {
      if (event.detail && event.detail.agentOptions) {
        event.detail.agentOptions = {
          ...event.detail.agentOptions,
          ...getAgentOptions()
        }
      }
    }
    
    window.addEventListener('dsh:spawn-subagent', handleSpawn)
    
    return () => {
      window.removeEventListener('dsh:spawn-subagent', handleSpawn)
    }
  }, [model, reasoningEffort, provider, getAgentOptions])

  return (
    <div className="dsh-subagent-settings-plugin">
      <div className="plugin-header">
        <h3>子代理设置</h3>
        <span className="plugin-badge">Plugin</span>
      </div>
      
      <div className="setting-group">
        <label>Provider</label>
        <select 
          value={provider} 
          onChange={(e) => setProvider(e.target.value)}
          className="setting-select"
        >
          {PROVIDERS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="setting-group">
        <label>模型 (Model)</label>
        <select 
          value={model} 
          onChange={(e) => setModel(e.target.value)}
          className="setting-select"
        >
          {MODELS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div className="setting-group">
        <label>思考强度 (Reasoning Effort)</label>
        <div className="reasoning-buttons">
          {REASONING_LEVELS.map(level => (
            <button
              key={level.value}
              className={`reasoning-btn ${reasoningEffort === level.value ? 'active' : ''}`}
              onClick={() => setReasoningEffort(level.value)}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="current-preview">
        <strong>当前配置：</strong>
        <code>{JSON.stringify(getAgentOptions(), null, 2)}</code>
      </div>
    </div>
  )
}

// 导出 hook 方便其他地方使用
export { useSubagentSettings }
