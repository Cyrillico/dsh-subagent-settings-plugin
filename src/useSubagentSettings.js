import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useSubagentSettings = create(
  persist(
    (set, get) => ({
      model: 'gpt-5.6-terra',
      reasoningEffort: 'xhigh',
      provider: 'codex-gateway-subagent',
      
      setModel: (model) => set({ model }),
      setReasoningEffort: (reasoningEffort) => set({ reasoningEffort }),
      setProvider: (provider) => set({ provider }),
      
      getAgentOptions: () => {
        const { model, reasoningEffort, provider } = get()
        return {
          provider,
          model,
          reasoningEffort,
          maxTokens: 8192
        }
      },
      
      applyToSubagent: (subagentConfig) => {
        const options = get().getAgentOptions()
        return {
          ...subagentConfig,
          agentOptions: {
            ...subagentConfig.agentOptions,
            ...options
          }
        }
      }
    }),
    {
      name: 'dsh-subagent-settings',
      partialize: (state) => ({
        model: state.model,
        reasoningEffort: state.reasoningEffort,
        provider: state.provider
      })
    }
  )
)

export default useSubagentSettings
