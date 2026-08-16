window.__ModuleLoader__.load({
  id: 'dsh-subagent-settings-plugin',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')

    const ENDPOINT = '/dsh-subagent-settings'
    const DEFAULTS = {
      enabled: true,
      inheritParent: false,
      provider: 'codex-gateway-subagent',
      model: 'gpt-5.6-terra',
      reasoningEffort: 'xhigh',
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
      nav: '子代理模型',
      title: '子代理模型与思考强度',
      intro: '这里改的是子代理（spawn / fork）的模型与思考强度，不会改父会话当前选中的模型。改完会立刻写入本机设置，下一次子代理请求生效。',
      enabled: '启用覆盖',
      enabledHint: '关闭后完全走 preset / 父会话默认，本页其它选项不再生效。',
      inheritParent: '跟随父会话模型',
      inheritParentHint: '打开后不再强制子代理的 provider/model，只按需覆盖思考强度。',
      provider: 'Provider',
      providerHint: '子代理走的路由。推荐用独立的子代理路由，避免和父会话抢同一套默认思考强度。',
      model: '模型',
      modelHint: '只作用于子代理。列表来自当前已注册的模型目录。',
      reasoningEffort: '思考强度',
      reasoningHint: '子代理每次模型请求都会带上这个强度。“跟随默认”会清掉显式强度，改用该模型/路由自己的默认值。',
      effortInherit: '跟随默认',
      effortLow: 'low',
      effortMedium: 'medium',
      effortHigh: 'high',
      effortXhigh: 'xhigh',
      effortMax: 'max',
      preview: '当前将用于子代理',
      loading: '正在读取设置…',
      loadError: '读取设置失败，已先显示默认值。保存时会再试一次。',
      saveError: '保存失败，请重试。',
      saved: '已保存',
      catalogError: '模型目录读取失败，仍可手填 provider / model。',
      emptyCatalog: '还没有可用模型。先在「模型」页配好路由。',
    }

    const en = {
      nav: 'Subagents',
      title: 'Subagent model and reasoning',
      intro: 'These controls apply to spawned or forked children only. Changes are written immediately and apply to the next child request.',
      enabled: 'Override children',
      enabledHint: 'When off, children keep the preset or parent defaults and the other fields are ignored.',
      inheritParent: 'Follow parent model',
      inheritParentHint: 'When on, provider/model are not forced. Reasoning effort can still be overridden.',
      provider: 'Provider',
      providerHint: 'Route used by children. A dedicated subagent route keeps parent reasoning defaults independent.',
      model: 'Model',
      modelHint: 'Applies to children only. The list comes from the registered model catalog.',
      reasoningEffort: 'Reasoning effort',
      reasoningHint: 'Attached to every child model request. “Follow default” clears an explicit effort so the model/route default applies.',
      effortInherit: 'Follow default',
      effortLow: 'low',
      effortMedium: 'medium',
      effortHigh: 'high',
      effortXhigh: 'xhigh',
      effortMax: 'max',
      preview: 'Children will use',
      loading: 'Loading settings…',
      loadError: 'Could not load host settings. Defaults are shown; saving will retry.',
      saveError: 'Save failed, please retry.',
      saved: 'Saved',
      catalogError: 'Could not load the model catalog. You can still type provider and model.',
      emptyCatalog: 'No models yet. Configure a route on the Models page first.',
    }

    const PAGE_CSS = `
.sas-section{max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}
.sas-title{margin:0;font-size:18px;font-weight:600}
.sas-intro{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px;line-height:1.5}
.sas-status{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}
.sas-error{color:var(--dsw-alias-label-error);margin:0;font-size:12px;line-height:1.5}
.sas-ok{color:var(--dsw-alias-label-secondary);margin:0;font-size:12px;line-height:1.5}
.sas-card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;padding:4px 16px}
.sas-field{flex-direction:column;gap:6px;padding:12px 0;display:flex}
.sas-field+.sas-field{border-top:1px solid var(--dsw-alias-border-l2)}
.sas-label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}
.sas-hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}
.sas-select,.sas-input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}
.sas-select:focus-visible,.sas-input:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}
.sas-select:disabled,.sas-input:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}
.sas-check{align-items:flex-start;gap:10px;display:flex}
.sas-check input{margin-top:3px}
.sas-efforts{display:flex;flex-wrap:wrap;gap:8px}
.sas-effort{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:8px;padding:6px 10px;font:inherit;font-size:12px;cursor:pointer}
.sas-effort[data-active="true"]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:#fff;font-weight:600}
.sas-effort:disabled{cursor:default;opacity:.5}
.sas-preview{margin:0;padding:12px;border-radius:8px;background:var(--dsw-alias-bg-layer-1);font-size:12px;line-height:1.5}
.sas-preview code{display:block;margin-top:6px;white-space:pre-wrap;word-break:break-all}
`

    function injectPageCss() {
      if (typeof document === 'undefined') return
      const id = 'dsh-subagent-settings-plugin/page.css'
      if (document.querySelector('style[data-plugin-css="' + id + '"]')) return
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-subagent-settings-plugin'
      tag.dataset.pluginCss = id
      tag.textContent = PAGE_CSS
      document.head.appendChild(tag)
    }

    function modelsForProvider(groups, provider) {
      const group = (groups || []).find(function (item) { return item.id === provider })
      return group && Array.isArray(group.models) ? group.models : []
    }

    function previewText(value) {
      if (!value.enabled) return { enabled: false }
      if (value.inheritParent) {
        return {
          enabled: true,
          inheritParent: true,
          reasoningEffort: value.reasoningEffort || 'inherit',
        }
      }
      return {
        enabled: true,
        provider: value.provider,
        model: value.model,
        reasoningEffort: value.reasoningEffort || 'inherit',
      }
    }

    function FieldSelect(props) {
      return React.createElement('div', { className: 'sas-field' },
        React.createElement('label', { className: 'sas-label', htmlFor: props.id }, props.label),
        React.createElement('select', {
          id: props.id,
          className: 'sas-select',
          value: props.value,
          disabled: props.disabled,
          onChange: function (event) { props.onChange(event.target.value) },
        }, props.children),
        React.createElement('p', { className: 'sas-hint' }, props.hint),
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
          React.createElement('span', { className: 'sas-label' }, props.label),
        ),
        React.createElement('p', { className: 'sas-hint' }, props.hint),
      )
    }

    function useHostSettings() {
      const [state, setState] = React.useState({
        status: 'loading',
        value: DEFAULTS,
        writable: true,
        catalog: { groups: [], failures: [] },
        error: null,
        notice: null,
      })

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
            setState({
              status: 'ready',
              value: Object.assign({}, DEFAULTS, data.value || {}),
              writable: data.writable !== false,
              catalog: data.catalog || { groups: [], failures: [] },
              error: null,
              notice: null,
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
          const value = Object.assign({}, prev.value, {})
          value[field] = next
          return Object.assign({}, prev, { value: value, error: null, notice: null })
        })
        fetch(ENDPOINT, {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ field: field, value: next }),
        })
          .then(function (response) { return response.json() })
          .then(function (data) {
            if (!data || data.ok !== true) {
              setState(function (prev) {
                return Object.assign({}, prev, { error: 'save' })
              })
              return
            }
            setState(function (prev) {
              return Object.assign({}, prev, {
                value: Object.assign({}, prev.value, data.value || {}),
                notice: 'saved',
                error: null,
              })
            })
          })
          .catch(function () {
            setState(function (prev) {
              return Object.assign({}, prev, { error: 'save' })
            })
          })
      }

      return { state: state, setField: setField }
    }

    function SubagentSettingsPage(props) {
      const t = props.t
      const hook = useHostSettings()
      const snap = hook.state
      const value = snap.value
      const disabled = !snap.writable || snap.status === 'loading'
      const groups = snap.catalog.groups || []
      const models = modelsForProvider(groups, value.provider)
      const modelLocked = disabled || value.inheritParent || !value.enabled

      function onProvider(next) {
        hook.setField('provider', next)
        const nextModels = modelsForProvider(groups, next)
        if (nextModels.length && !nextModels.some(function (item) { return item.id === value.model })) {
          hook.setField('model', nextModels[0].id)
        }
      }

      if (snap.status === 'loading') {
        return React.createElement('p', { className: 'sas-status' }, t('loading'))
      }

      return React.createElement('section', { className: 'sas-section', 'aria-label': t('title') },
        React.createElement('h2', { className: 'sas-title' }, t('title')),
        React.createElement('p', { className: 'sas-intro' }, t('intro')),
        snap.error === 'load' ? React.createElement('p', { className: 'sas-error' }, t('loadError')) : null,
        snap.error === 'save' ? React.createElement('p', { className: 'sas-error' }, t('saveError')) : null,
        snap.notice === 'saved' ? React.createElement('p', { className: 'sas-ok' }, t('saved')) : null,
        React.createElement('div', { className: 'sas-card' },
          React.createElement(Toggle, {
            label: t('enabled'),
            hint: t('enabledHint'),
            checked: value.enabled,
            disabled: disabled,
            onChange: function (checked) { hook.setField('enabled', checked) },
          }),
          React.createElement(Toggle, {
            label: t('inheritParent'),
            hint: t('inheritParentHint'),
            checked: value.inheritParent,
            disabled: disabled || !value.enabled,
            onChange: function (checked) { hook.setField('inheritParent', checked) },
          }),
          React.createElement(FieldSelect, {
            id: 'sas-provider',
            label: t('provider'),
            hint: t('providerHint'),
            value: value.provider,
            disabled: modelLocked,
            onChange: onProvider,
          },
            groups.length === 0
              ? React.createElement('option', { value: value.provider }, value.provider)
              : groups.map(function (group) {
                return React.createElement('option', { key: group.id, value: group.id }, group.name || group.id)
              }),
          ),
          React.createElement(FieldSelect, {
            id: 'sas-model',
            label: t('model'),
            hint: groups.length === 0 ? t('emptyCatalog') : t('modelHint'),
            value: value.model,
            disabled: modelLocked,
            onChange: function (next) { hook.setField('model', next) },
          },
            models.length === 0
              ? React.createElement('option', { value: value.model }, value.model)
              : models.map(function (model) {
                return React.createElement('option', { key: model.id, value: model.id }, model.name || model.id)
              }),
          ),
          React.createElement('div', { className: 'sas-field' },
            React.createElement('div', { className: 'sas-label' }, t('reasoningEffort')),
            React.createElement('div', { className: 'sas-efforts' },
              EFFORTS.map(function (effort) {
                const active = (value.reasoningEffort || 'inherit') === effort.value
                return React.createElement('button', {
                  key: effort.value,
                  type: 'button',
                  className: 'sas-effort',
                  'data-active': active ? 'true' : 'false',
                  disabled: disabled || !value.enabled,
                  onClick: function () { hook.setField('reasoningEffort', effort.value) },
                }, t(effort.labelKey))
              }),
            ),
            React.createElement('p', { className: 'sas-hint' }, t('reasoningHint')),
          ),
        ),
        React.createElement('p', { className: 'sas-preview' },
          t('preview'),
          React.createElement('code', null, JSON.stringify(previewText(value), null, 2)),
        ),
      )
    }

    function apply(ctx) {
      injectPageCss()
      ctx.effect(function () {
        return ctx.locale.register('settings.subagent-settings', { zh: zh, en: en })
      }, 'dsh-subagent-settings: page copy')

      ctx.slots.inject('settings.section', function () {
        return ctx.slots.register({
          name: 'settings.section',
          id: 'subagent-settings',
          order: 35,
          label: function () { return ctx.locale.bind('settings.subagent-settings')('nav') },
          locale: 'settings.subagent-settings',
        }, SubagentSettingsPage)
      })
    }

    exports.apply = apply
    exports.inject = ['slots', 'locale']
    return module.exports
  },
})
