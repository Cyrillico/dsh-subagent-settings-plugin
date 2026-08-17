window.__ModuleLoader__.load({
  id: 'dsh-subagent-settings-plugin',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const ReactDOM = require('react-dom/client')

    const ENDPOINT = '/dsh-subagent-settings'
    const LOCAL_KEY = 'dsh-subagent-settings:v2'
    const HOST_ID = 'dsh-sas-on-models'
    const FIELDS = [
      'enabled',
      'inheritParent',
      'provider',
      'model',
      'reasoningEffort',
      'fallbackProvider',
      'fallbackModel',
      'fallbackReasoningEffort',
      'maxConcurrent',
    ]
    const DEFAULTS = {
      enabled: true,
      inheritParent: false,
      provider: 'codex-gateway-subagent',
      model: 'gpt-5.6-terra',
      reasoningEffort: 'xhigh',
      fallbackProvider: '',
      fallbackModel: '',
      fallbackReasoningEffort: 'inherit',
      maxConcurrent: 0,
    }

    const EFFORTS = [
      { value: 'inherit', labelKey: 'effortInherit' },
      { value: 'low', labelKey: 'effortLow' },
      { value: 'medium', labelKey: 'effortMedium' },
      { value: 'high', labelKey: 'effortHigh' },
      { value: 'xhigh', labelKey: 'effortXhigh' },
      { value: 'max', labelKey: 'effortMax' },
    ]

    const zh = {
      title: '子代理模型',
      intro: '和上面的父会话模型分开：这里只改 spawn / fork 子代理。改完后点保存才会生效。',
      enabled: '启用覆盖',
      enabledHint: '关闭后完全走 preset / 父会话默认。',
      inheritParent: '跟随父会话模型',
      inheritParentHint: '打开后不再强制子代理的 provider/model，仍可单独改思考强度和 fallback。',
      provider: 'Provider',
      model: '模型',
      reasoningEffort: '思考强度',
      fallbackProvider: 'Fallback Provider',
      fallbackModel: 'Fallback 模型',
      fallbackReasoningEffort: 'Fallback 思考强度',
      fallbackHint: '第一个模型请求失败时，自动改走 fallback 再试一次。留空则不切换。取消/中止不会触发。',
      maxConcurrent: '同时运行的最大子代理数',
      maxConcurrentHint: '0 表示不限制。超出的 spawn / fork 会排队等到有空位，而不是直接失败。',
      none: '不使用 fallback',
      effortInherit: '跟随默认',
      effortLow: 'low',
      effortMedium: 'medium',
      effortHigh: 'high',
      effortXhigh: 'xhigh',
      effortMax: 'max',
      preview: '保存后将用于子代理',
      loading: '正在读取设置…',
      loadError: '读取宿主设置失败。已用本机缓存/默认值。',
      saveError: '保存失败，请重试。',
      saved: '已保存',
      unsaved: '未保存',
      save: '保存',
      saving: '保存中…',
      discard: '放弃',
      emptyCatalog: '还没有可用模型。先在本页配好提供方。',
      leaveTitle: '保存对子代理模型的更改？',
      leaveBody: '有未保存的修改。不保存将丢失这些更改。',
      leaveSave: '保存',
      leaveDiscard: '不保存',
      leaveCancel: '取消',
    }

    const en = {
      title: 'Subagent models',
      intro: 'Separate from the parent session model above. Applies only to spawn/fork children. Changes take effect after you save.',
      enabled: 'Override children',
      enabledHint: 'When off, children keep the preset or parent defaults.',
      inheritParent: 'Follow parent model',
      inheritParentHint: 'When on, provider/model are not forced. Reasoning and fallback still apply.',
      provider: 'Provider',
      model: 'Model',
      reasoningEffort: 'Reasoning effort',
      fallbackProvider: 'Fallback provider',
      fallbackModel: 'Fallback model',
      fallbackReasoningEffort: 'Fallback reasoning',
      fallbackHint: 'If the first child model request fails, retry once on the fallback. Leave empty to disable. Cancel/abort does not trigger it.',
      maxConcurrent: 'Max concurrent subagents',
      maxConcurrentHint: '0 means unlimited. Extra spawn/fork calls wait for a free slot instead of failing.',
      none: 'No fallback',
      effortInherit: 'Follow default',
      effortLow: 'low',
      effortMedium: 'medium',
      effortHigh: 'high',
      effortXhigh: 'xhigh',
      effortMax: 'max',
      preview: 'After save, children will use',
      loading: 'Loading settings…',
      loadError: 'Could not load host settings. Using local cache/defaults.',
      saveError: 'Save failed, please retry.',
      saved: 'Saved',
      unsaved: 'Unsaved',
      save: 'Save',
      saving: 'Saving…',
      discard: 'Discard',
      emptyCatalog: 'No models yet. Configure a provider on this page first.',
      leaveTitle: 'Save subagent model changes?',
      leaveBody: 'You have unsaved changes. Discarding will lose them.',
      leaveSave: 'Save',
      leaveDiscard: 'Don\'t save',
      leaveCancel: 'Cancel',
    }

    const PAGE_CSS = `
#dsh-sas-on-models{margin-top:20px;padding-top:16px;border-top:1px solid var(--dsw-alias-border-l2);max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}
.sas-titleRow{align-items:center;gap:8px;display:flex}
.sas-title{margin:0;font-size:16px;font-weight:600}
.sas-intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px;line-height:1.5}
.sas-status{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}
.sas-error{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}
.sas-ok{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:1.5}
.sas-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;padding:4px 16px}
.sas-field{flex-direction:column;gap:6px;padding:12px 0;display:flex}
.sas-field+.sas-field{border-top:1px solid var(--dsw-alias-border-l2)}
.sas-label{align-items:center;gap:6px;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5;display:inline-flex}
.sas-dot{width:7px;height:7px;background:#e11d48;border-radius:50%;flex:none;box-shadow:0 0 0 2px rgba(225,29,72,.16)}
.sas-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}
.sas-select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}
.sas-select:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.sas-select:disabled,.sas-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.sas-input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5;width:140px}
.sas-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.sas-check{align-items:flex-start;gap:10px;display:flex}
.sas-check input{margin-top:3px}
.sas-efforts{display:flex;flex-wrap:wrap;gap:8px}
.sas-effort{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:8px;padding:6px 10px;font:inherit;font-size:12px;cursor:pointer}
.sas-effort[data-active="true"]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff;font-weight:600}
.sas-effort:disabled{cursor:default;opacity:.5}
.sas-preview{margin:0;padding:12px;border-radius:8px;background:var(--dsw-alias-bg-layer-1);font-size:12px;line-height:1.5}
.sas-preview code{display:block;margin-top:6px;white-space:pre-wrap;word-break:break-all}
.sas-footer{justify-content:flex-end;align-items:center;gap:8px;display:flex}
.sas-btn{font:inherit;border-radius:8px;padding:6px 12px;font-size:13px;line-height:1.4;cursor:pointer}
.sas-btn:disabled{cursor:default;opacity:.5}
.sas-btnGhost{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary)}
.sas-btnPrimary{border:1px solid var(--dsw-alias-brand-primary);background:var(--dsw-alias-brand-primary);color:#fff}
.sas-leave{z-index:4000;justify-content:center;align-items:center;display:flex;position:fixed;inset:0}
.sas-leaveMask{background:rgba(0,0,0,.45);position:absolute;inset:0}
.sas-leaveCard{z-index:1;background:var(--dsw-alias-bg-layer-2,#1c1c1e);color:var(--dsw-alias-label-primary,#eee);width:min(420px,calc(100vw - 32px));border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));border-radius:16px;padding:18px 18px 14px;box-shadow:0 16px 48px rgba(0,0,0,.28)}
.sas-leaveTitle{margin:0 0 8px;font-size:16px;font-weight:600}
.sas-leaveBody{color:var(--dsw-alias-label-tertiary,#aaa);margin:0 0 16px;font-size:13px;line-height:1.5}
.sas-leaveActions{justify-content:flex-end;gap:8px;display:flex}
`

    function injectPageCss() {
      if (typeof document === 'undefined') return
      const id = 'dsh-subagent-settings-plugin/page.css'
      let tag = document.querySelector('style[data-plugin-css="' + id + '"]')
      if (!tag) {
        tag = document.createElement('style')
        tag.dataset.plugin = 'dsh-subagent-settings-plugin'
        tag.dataset.pluginCss = id
        document.head.appendChild(tag)
      }
      tag.textContent = PAGE_CSS
    }

    function readLocal() {
      try {
        const raw = window.localStorage.getItem(LOCAL_KEY)
        if (!raw) return {}
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch {
        return {}
      }
    }

    function writeLocal(value) {
      try {
        window.localStorage.setItem(LOCAL_KEY, JSON.stringify(value))
      } catch {
        // ignore quota / private mode
      }
    }

    function normalizeValue(raw) {
      const value = Object.assign({}, DEFAULTS, raw || {})
      value.enabled = !!value.enabled
      value.inheritParent = !!value.inheritParent
      value.provider = value.provider || ''
      value.model = value.model || ''
      value.reasoningEffort = value.reasoningEffort || 'inherit'
      value.fallbackProvider = value.fallbackProvider || ''
      value.fallbackModel = value.fallbackModel || ''
      value.fallbackReasoningEffort = value.fallbackReasoningEffort || 'inherit'
      const n = Number(value.maxConcurrent)
      value.maxConcurrent = Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 1000) : 0
      return value
    }

    function valuesEqual(a, b) {
      return FIELDS.every(function (key) { return a[key] === b[key] })
    }

    function dirtyFieldsOf(draft, saved) {
      const dirty = {}
      for (let i = 0; i < FIELDS.length; i++) {
        const key = FIELDS[i]
        dirty[key] = draft[key] !== saved[key]
      }
      return dirty
    }

    function modelsForProvider(groups, provider) {
      const group = (groups || []).find(function (item) { return item.id === provider })
      return group && Array.isArray(group.models) ? group.models : []
    }

    function previewText(value) {
      if (!value.enabled) return { enabled: false }
      const primary = value.inheritParent
        ? { inheritParent: true, reasoningEffort: value.reasoningEffort || 'inherit' }
        : { provider: value.provider, model: value.model, reasoningEffort: value.reasoningEffort || 'inherit' }
      if (!value.fallbackProvider || !value.fallbackModel) return primary
      return Object.assign({}, primary, {
        fallbackProvider: value.fallbackProvider,
        fallbackModel: value.fallbackModel,
        fallbackReasoningEffort: value.fallbackReasoningEffort || 'inherit',
      })
    }

    function findModelsSection() {
      const headings = document.querySelectorAll('h2')
      for (let i = 0; i < headings.length; i++) {
        const text = (headings[i].textContent || '').trim()
        if (text === '模型' || text === 'Models') return headings[i].parentElement
      }
      return null
    }

    function isLeaveControl(target) {
      if (!target || !target.closest) return false
      if (target.closest('#' + HOST_ID) || target.closest('.sas-leave')) return false
      if (target.closest('.VOzbGW_close') || target.closest('.VOzbGW_mask')) return true
      const nav = target.closest('.VOzbGW_navCell')
      if (!nav) return false
      return nav.getAttribute('aria-current') !== 'true'
    }

    function Label(props) {
      return React.createElement('span', { className: 'sas-label' },
        props.text,
        props.dirty ? React.createElement('span', {
          className: 'sas-dot',
          title: props.unsavedLabel,
          'aria-label': props.unsavedLabel,
        }) : null,
      )
    }

    function FieldSelect(props) {
      return React.createElement('div', { className: 'sas-field' },
        React.createElement('label', { className: 'sas-label', htmlFor: props.id },
          React.createElement(Label, { text: props.label, dirty: props.dirty, unsavedLabel: props.unsavedLabel }),
        ),
        React.createElement('select', {
          id: props.id,
          className: 'sas-select',
          value: props.value,
          disabled: props.disabled,
          onChange: function (event) { props.onChange(event.target.value) },
        }, props.children),
        props.hint ? React.createElement('p', { className: 'sas-hint' }, props.hint) : null,
      )
    }

    function Toggle(props) {
      return React.createElement('div', { className: 'sas-field' },
        React.createElement('label', { className: 'sas-check' },
          React.createElement('input', {
            type: 'checkbox',
            checked: !!props.checked,
            disabled: props.disabled,
            onChange: function (event) { props.onChange(event.target.checked) },
          }),
          React.createElement(Label, { text: props.label, dirty: props.dirty, unsavedLabel: props.unsavedLabel }),
        ),
        React.createElement('p', { className: 'sas-hint' }, props.hint),
      )
    }

    function FieldNumber(props) {
      return React.createElement('div', { className: 'sas-field' },
        React.createElement('label', { className: 'sas-label', htmlFor: props.id },
          React.createElement(Label, { text: props.label, dirty: props.dirty, unsavedLabel: props.unsavedLabel }),
        ),
        React.createElement('input', {
          id: props.id,
          className: 'sas-input',
          type: 'number',
          min: 0,
          max: 1000,
          step: 1,
          value: props.value,
          disabled: props.disabled,
          onChange: function (event) { props.onChange(event.target.value) },
        }),
        props.hint ? React.createElement('p', { className: 'sas-hint' }, props.hint) : null,
      )
    }

    function EffortRow(props) {
      return React.createElement('div', { className: 'sas-field' },
        React.createElement(Label, { text: props.label, dirty: props.dirty, unsavedLabel: props.unsavedLabel }),
        React.createElement('div', { className: 'sas-efforts' },
          EFFORTS.map(function (effort) {
            const active = (props.value || 'inherit') === effort.value
            return React.createElement('button', {
              key: effort.value,
              type: 'button',
              className: 'sas-effort',
              'data-active': active ? 'true' : 'false',
              disabled: props.disabled,
              onClick: function () { props.onChange(effort.value) },
            }, props.t(effort.labelKey))
          }),
        ),
      )
    }

    function LeaveDialog(props) {
      return React.createElement('div', { className: 'sas-leave', role: 'presentation' },
        React.createElement('div', { className: 'sas-leaveMask', onClick: props.onCancel }),
        React.createElement('div', {
          className: 'sas-leaveCard',
          role: 'dialog',
          'aria-modal': 'true',
          'aria-labelledby': 'sas-leave-title',
        },
          React.createElement('h4', { className: 'sas-leaveTitle', id: 'sas-leave-title' }, props.t('leaveTitle')),
          React.createElement('p', { className: 'sas-leaveBody' }, props.t('leaveBody')),
          React.createElement('div', { className: 'sas-leaveActions' },
            React.createElement('button', { type: 'button', className: 'sas-btn sas-btnGhost', onClick: props.onCancel, disabled: props.saving }, props.t('leaveCancel')),
            React.createElement('button', { type: 'button', className: 'sas-btn sas-btnGhost', onClick: props.onDiscard, disabled: props.saving }, props.t('leaveDiscard')),
            React.createElement('button', { type: 'button', className: 'sas-btn sas-btnPrimary', onClick: props.onSave, disabled: props.saving }, props.saving ? props.t('saving') : props.t('leaveSave')),
          ),
        ),
      )
    }

    function useDraftSettings() {
      const [state, setState] = React.useState({
        status: 'loading',
        saved: normalizeValue(readLocal()),
        draft: normalizeValue(readLocal()),
        writable: true,
        catalog: { groups: [], failures: [] },
        error: null,
        notice: null,
        saving: false,
      })
      const draftRef = React.useRef(state.draft)
      draftRef.current = state.draft

      React.useEffect(function () {
        let cancelled = false
        fetch(ENDPOINT, { credentials: 'same-origin' })
          .then(function (response) { return response.json() })
          .then(function (data) {
            if (cancelled) return
            if (!data || data.ok !== true) {
              setState(function (prev) {
                return Object.assign({}, prev, { status: 'ready', error: 'load' })
              })
              return
            }
            const saved = normalizeValue(Object.assign({}, data.value || {}, readLocal()))
            setState({
              status: 'ready',
              saved: saved,
              draft: Object.assign({}, saved),
              writable: data.writable !== false,
              catalog: data.catalog || { groups: [], failures: [] },
              error: null,
              notice: null,
              saving: false,
            })
          })
          .catch(function () {
            if (!cancelled) {
              setState(function (prev) {
                return Object.assign({}, prev, { status: 'ready', error: 'load' })
              })
            }
          })
        return function () { cancelled = true }
      }, [])

      function setField(field, next) {
        setState(function (prev) {
          const draft = Object.assign({}, prev.draft)
          draft[field] = next
          return Object.assign({}, prev, { draft: draft, error: null, notice: null })
        })
      }

      function discard() {
        setState(function (prev) {
          return Object.assign({}, prev, {
            draft: Object.assign({}, prev.saved),
            error: null,
            notice: null,
          })
        })
      }

      function save() {
        const draft = draftRef.current
        return new Promise(function (resolve) {
          setState(function (prev) {
            return Object.assign({}, prev, { saving: true, error: null, notice: null })
          })
          fetch(ENDPOINT, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ patch: draft }),
          })
            .then(function (response) { return response.json() })
            .then(function (data) {
              if (!data || data.ok !== true) {
                setState(function (prev) {
                  return Object.assign({}, prev, { saving: false, error: 'save' })
                })
                resolve(false)
                return
              }
              const saved = normalizeValue(Object.assign({}, draft, data.value || {}))
              writeLocal(saved)
              setState(function (prev) {
                return Object.assign({}, prev, {
                  saved: saved,
                  draft: Object.assign({}, saved),
                  saving: false,
                  notice: 'saved',
                  error: null,
                })
              })
              resolve(true)
            })
            .catch(function () {
              setState(function (prev) {
                return Object.assign({}, prev, { saving: false, error: 'save' })
              })
              resolve(false)
            })
        })
      }

      return { state: state, setField: setField, discard: discard, save: save }
    }

    function SubagentSettingsCard(props) {
      const t = props.t
      const hook = useDraftSettings()
      const snap = hook.state
      const draft = snap.draft
      const dirty = dirtyFieldsOf(draft, snap.saved)
      const isDirty = !valuesEqual(draft, snap.saved)
      const disabled = !snap.writable || snap.status === 'loading' || snap.saving
      const groups = snap.catalog.groups || []
      const models = modelsForProvider(groups, draft.provider)
      const fallbackModels = modelsForProvider(groups, draft.fallbackProvider)
      const modelLocked = disabled || draft.inheritParent || !draft.enabled
      const [leave, setLeave] = React.useState(null)
      const dirtyRef = React.useRef(isDirty)
      const savingRef = React.useRef(false)
      dirtyRef.current = isDirty
      savingRef.current = snap.saving

      React.useEffect(function () {
        const block = function (event) {
          if (!dirtyRef.current || savingRef.current || leave) return
          if (event.type === 'keydown') {
            if (event.key !== 'Escape') return
          } else if (!isLeaveControl(event.target)) {
            return
          }
          event.preventDefault()
          event.stopPropagation()
          if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation()
          const target = event.target
          setLeave({
            replay: function () {
              if (event.type === 'keydown') {
                const close = document.querySelector('.VOzbGW_close')
                if (close) close.click()
                return
              }
              const el = target && target.closest ? target.closest('button, .VOzbGW_mask') : null
              if (el) el.click()
            },
          })
        }
        const onBeforeUnload = function (event) {
          if (!dirtyRef.current) return
          event.preventDefault()
          event.returnValue = ''
        }
        document.addEventListener('click', block, true)
        document.addEventListener('keydown', block, true)
        window.addEventListener('beforeunload', onBeforeUnload)
        return function () {
          document.removeEventListener('click', block, true)
          document.removeEventListener('keydown', block, true)
          window.removeEventListener('beforeunload', onBeforeUnload)
        }
      }, [leave])

      function onProvider(next) {
        hook.setField('provider', next)
        const nextModels = modelsForProvider(groups, next)
        if (nextModels.length && !nextModels.some(function (item) { return item.id === draft.model })) {
          hook.setField('model', nextModels[0].id)
        }
      }

      function onFallbackProvider(next) {
        hook.setField('fallbackProvider', next)
        if (!next) {
          hook.setField('fallbackModel', '')
          return
        }
        const nextModels = modelsForProvider(groups, next)
        if (nextModels.length && !nextModels.some(function (item) { return item.id === draft.fallbackModel })) {
          hook.setField('fallbackModel', nextModels[0].id)
        }
      }

      function finishLeave(replay) {
        setLeave(null)
        window.setTimeout(function () { replay() }, 0)
      }

      if (snap.status === 'loading') {
        return React.createElement('p', { className: 'sas-status' }, t('loading'))
      }

      return React.createElement('section', { 'aria-label': t('title') },
        React.createElement('div', { className: 'sas-titleRow' },
          React.createElement('h3', { className: 'sas-title' }, t('title')),
          isDirty ? React.createElement('span', { className: 'sas-dot', title: t('unsaved'), 'aria-label': t('unsaved') }) : null,
        ),
        React.createElement('p', { className: 'sas-intro' }, t('intro')),
        snap.error === 'load' ? React.createElement('p', { className: 'sas-error' }, t('loadError')) : null,
        snap.error === 'save' ? React.createElement('p', { className: 'sas-error' }, t('saveError')) : null,
        snap.notice === 'saved' && !isDirty ? React.createElement('p', { className: 'sas-ok' }, t('saved')) : null,
        React.createElement('div', { className: 'sas-card' },
          React.createElement(Toggle, {
            label: t('enabled'),
            hint: t('enabledHint'),
            checked: draft.enabled,
            dirty: dirty.enabled,
            unsavedLabel: t('unsaved'),
            disabled: disabled,
            onChange: function (checked) { hook.setField('enabled', checked) },
          }),
          React.createElement(Toggle, {
            label: t('inheritParent'),
            hint: t('inheritParentHint'),
            checked: draft.inheritParent,
            dirty: dirty.inheritParent,
            unsavedLabel: t('unsaved'),
            disabled: disabled || !draft.enabled,
            onChange: function (checked) { hook.setField('inheritParent', checked) },
          }),
          React.createElement(FieldSelect, {
            id: 'sas-provider',
            label: t('provider'),
            dirty: dirty.provider,
            unsavedLabel: t('unsaved'),
            value: draft.provider,
            disabled: modelLocked,
            onChange: onProvider,
          },
            groups.length === 0
              ? React.createElement('option', { value: draft.provider }, draft.provider)
              : groups.map(function (group) {
                return React.createElement('option', { key: group.id, value: group.id }, group.name || group.id)
              }),
          ),
          React.createElement(FieldSelect, {
            id: 'sas-model',
            label: t('model'),
            dirty: dirty.model,
            unsavedLabel: t('unsaved'),
            hint: groups.length === 0 ? t('emptyCatalog') : null,
            value: draft.model,
            disabled: modelLocked,
            onChange: function (next) { hook.setField('model', next) },
          },
            models.length === 0
              ? React.createElement('option', { value: draft.model }, draft.model)
              : models.map(function (model) {
                return React.createElement('option', { key: model.id, value: model.id }, model.name || model.id)
              }),
          ),
          React.createElement(EffortRow, {
            label: t('reasoningEffort'),
            dirty: dirty.reasoningEffort,
            unsavedLabel: t('unsaved'),
            value: draft.reasoningEffort,
            disabled: disabled || !draft.enabled,
            onChange: function (next) { hook.setField('reasoningEffort', next) },
            t: t,
          }),
          React.createElement(FieldSelect, {
            id: 'sas-fallback-provider',
            label: t('fallbackProvider'),
            dirty: dirty.fallbackProvider,
            unsavedLabel: t('unsaved'),
            hint: t('fallbackHint'),
            value: draft.fallbackProvider || '',
            disabled: disabled || !draft.enabled,
            onChange: onFallbackProvider,
          },
            [React.createElement('option', { key: '', value: '' }, t('none'))].concat(
              groups.map(function (group) {
                return React.createElement('option', { key: group.id, value: group.id }, group.name || group.id)
              }),
            ),
          ),
          React.createElement(FieldSelect, {
            id: 'sas-fallback-model',
            label: t('fallbackModel'),
            dirty: dirty.fallbackModel,
            unsavedLabel: t('unsaved'),
            value: draft.fallbackModel || '',
            disabled: disabled || !draft.enabled || !draft.fallbackProvider,
            onChange: function (next) { hook.setField('fallbackModel', next) },
          },
            fallbackModels.length === 0
              ? React.createElement('option', { value: draft.fallbackModel || '' }, draft.fallbackModel || t('none'))
              : fallbackModels.map(function (model) {
                return React.createElement('option', { key: model.id, value: model.id }, model.name || model.id)
              }),
          ),
          React.createElement(EffortRow, {
            label: t('fallbackReasoningEffort'),
            dirty: dirty.fallbackReasoningEffort,
            unsavedLabel: t('unsaved'),
            value: draft.fallbackReasoningEffort,
            disabled: disabled || !draft.enabled || !draft.fallbackProvider,
            onChange: function (next) { hook.setField('fallbackReasoningEffort', next) },
            t: t,
          }),
          React.createElement(FieldNumber, {
            id: 'sas-max-concurrent',
            label: t('maxConcurrent'),
            dirty: dirty.maxConcurrent,
            unsavedLabel: t('unsaved'),
            hint: t('maxConcurrentHint'),
            value: draft.maxConcurrent,
            disabled: disabled,
            onChange: function (next) { hook.setField('maxConcurrent', next === '' ? 0 : Number(next)) },
          }),
        ),
        React.createElement('p', { className: 'sas-preview' },
          t('preview'),
          React.createElement('code', null, JSON.stringify(previewText(draft), null, 2)),
        ),
        React.createElement('div', { className: 'sas-footer' },
          React.createElement('button', {
            type: 'button',
            className: 'sas-btn sas-btnGhost',
            disabled: disabled || !isDirty,
            onClick: hook.discard,
          }, t('discard')),
          React.createElement('button', {
            type: 'button',
            className: 'sas-btn sas-btnPrimary',
            disabled: disabled || !isDirty,
            onClick: function () { void hook.save() },
          }, snap.saving ? t('saving') : t('save')),
        ),
        leave ? React.createElement(LeaveDialog, {
          t: t,
          saving: snap.saving,
          onCancel: function () { setLeave(null) },
          onDiscard: function () {
            hook.discard()
            dirtyRef.current = false
            finishLeave(leave.replay)
          },
          onSave: function () {
            void hook.save().then(function (ok) {
              if (!ok) return
              dirtyRef.current = false
              finishLeave(leave.replay)
            })
          },
        }) : null,
      )
    }

    function copyOf(ctx) {
      const lang = (typeof document !== 'undefined' && document.documentElement && document.documentElement.lang || '').toLowerCase()
      const pack = lang.indexOf('zh') === 0 ? zh : en
      if (ctx.locale && typeof ctx.locale.bind === 'function') {
        try {
          ctx.locale.register('settings.subagent-settings', { zh: zh, en: en })
          return ctx.locale.bind('settings.subagent-settings')
        } catch {
          // fall through
        }
      }
      return function (key) { return pack[key] || key }
    }

    function apply(ctx) {
      injectPageCss()
      const t = copyOf(ctx)
      ctx.effect(function () {
        const host = document.createElement('div')
        host.id = HOST_ID
        const root = ReactDOM.createRoot(host)
        root.render(React.createElement(SubagentSettingsCard, { t: t }))

        const place = function () {
          const section = findModelsSection()
          if (section) {
            if (host.parentElement !== section) section.appendChild(host)
          } else if (host.parentElement) {
            host.remove()
          }
        }

        const observer = new MutationObserver(place)
        observer.observe(document.body, { childList: true, subtree: true })
        place()
        const timer = window.setInterval(place, 800)

        return function () {
          observer.disconnect()
          window.clearInterval(timer)
          root.unmount()
          host.remove()
        }
      }, 'dsh-subagent-settings: mount on models page')
    }

    exports.apply = apply
    exports.inject = ['locale']
    return module.exports
  },
})
