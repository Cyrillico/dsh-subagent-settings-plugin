# dsh-subagent-settings

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)](package.json)

Configure **subagent** model, reasoning effort, fallback route, and a concurrency cap from the DeepSeek Harness Web UI — without changing the parent session model.

The panel lives on the official **Settings → Models** page. Edits stay as a draft until you click **Save**.

[English](#install) · [中文](#安装)

---

## Why

DSH lets you pick the parent model in the UI. Child agents started with `subagent` / `subagent_fork` do not get the same picker. Their route is usually baked into an agent preset (`provider` + `model` only). Reasoning effort is not part of `agentOptions`; it comes from the child route default or the request waterfall.

This plugin gives you a first-class UI for those children, and retries once on a fallback model if the primary request fails.

## Features

- Set subagent **provider**, **model**, and **reasoning effort** independently of the parent session
- Optional **fallback** provider/model used automatically after the first child request fails (cancel/abort does not trigger it)
- Optional **max concurrent subagents**: extra `spawn` / `fork` calls wait for a free slot instead of failing
- Draft / save workflow: unsaved fields show a red dot; leaving the page asks whether to keep the changes
- Parent sessions (`delegationDepth === 0`) are never rewritten
- Changes apply to the next spawn/fork after save — no preset copy required

## Requirements

- [DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh) `0.1.x` (tested on `0.1.0-rc.6`)
- Node.js 18+
- The **web** profile (`dsh web`)

## Install

From GitHub (recommended):

```sh
dsh plugin --profile web add github:Cyrillico/dsh-subagent-settings-plugin
```

From a local checkout:

```sh
dsh plugin --profile web add /absolute/path/to/dsh-subagent-settings-plugin
```

Restart the Web UI once so the host half can load:

```sh
dsh web
```

Then open **Settings → Models** and scroll to **Subagent models**.

## Configure

| Control | What it does |
| --- | --- |
| Override children | Master switch. Off = keep preset / parent defaults |
| Follow parent model | Do not force child provider/model; reasoning and fallback still apply |
| Provider / Model | Primary child route, e.g. `codex-gateway-subagent` + `gpt-5.6-terra` |
| Reasoning effort | `inherit`, `low`, `medium`, `high`, `xhigh`, `max` |
| Fallback provider / model | Used for one automatic retry if the primary child request fails |
| Fallback reasoning | Effort on the retry; `inherit` reuses the primary effort |
| Max concurrent subagents | `0` = unlimited. Extra children queue until one finishes |

Click **Save** to write the values. **Discard** reverts the draft.

Saved values live in `$DSH_HOME/settings.yaml` under `dsh-subagent-settings:`.

```yaml
dsh-subagent-settings:
  enabled: true
  inheritParent: false
  provider: codex-gateway-subagent
  model: gpt-5.6-terra
  reasoningEffort: xhigh
  fallbackProvider: codex-gateway
  fallbackModel: grok-4.6
  fallbackReasoningEffort: inherit
  maxConcurrent: 4
```

You can edit that section by hand if you prefer the file over the UI. Restart is only needed after **installing** or **upgrading** the plugin, not after changing these fields.

## How it works

1. Host registers the settings and intercepts `ctx.subagents.start` / `startContinuable` so new children get the primary route.
2. The same intercept can hold extra starts in a queue when `maxConcurrent` is set.
3. `agent/request` stamps reasoning effort onto child calls only.
4. `agent/request-error` retries **once** on the fallback route when the primary call fails.
5. The Web UI talks to `GET`/`PUT /dsh-subagent-settings` (third-party namespaces are not on the official settings allowlist).

## Development

```sh
git clone https://github.com/Cyrillico/dsh-subagent-settings-plugin.git
cd dsh-subagent-settings-plugin
npm test
```

The host half is plain ESM. The browser half is a DSH `window.__ModuleLoader__` factory — no bundler required.

## License

MIT

---

## 安装

```sh
dsh plugin --profile web add github:Cyrillico/dsh-subagent-settings-plugin
```

本地目录：

```sh
dsh plugin --profile web add /绝对路径/dsh-subagent-settings-plugin
```

安装或升级后重启一次 `dsh web`。打开 **设置 → 模型**，拉到 **子代理模型**。

## 配置

在面板里选择子代理的 Provider、模型、思考强度、可选 Fallback，以及同时运行的最大子代理数（`0` 为不限制，超出的会排队）。改完点 **保存** 才会生效；未保存的项会打红点，离开页面会询问是否保存。

配置写入 `$DSH_HOME/settings.yaml` 的 `dsh-subagent-settings` 段。只改这项配置不需要再重启；只有安装/升级插件后才需要重启 Web UI。
