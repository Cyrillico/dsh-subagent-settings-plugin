# dsh-subagent-settings-plugin

在 DeepSeek Harness **Web UI 设置页**里单独配置子代理的模型和思考强度。父会话当前选中的模型不受影响。

保存后下一次 `subagent` / `subagent_fork` 请求立刻生效，不用改 preset、也不用重启。

## 它改的是什么

官方子代理 `agentOptions` 只接受 `provider` / `model` / `maxTokens`，**没有** `reasoningEffort`。思考强度来自子代理走的那条 LLM 路由默认值，或来自子代理自己的 `agent/request`。

这个插件做两件事：

1. 在 `ctx.subagents.start` / `startContinuable` 上写入子代理的 `provider` + `model`
2. 在子代理的 `agent/request` 上写入（或清掉）`reasoningEffort`

父会话（`delegationDepth === 0`）不会被改。

## 安装

本机 Web profile：

```sh
dsh plugin --profile web add /absolute/path/to/dsh-subagent-settings-plugin
```

或 GitHub：

```sh
dsh plugin --profile web add github:Cyrillico/dsh-subagent-settings-plugin
```

然后重启 `dsh web`。打开设置，侧栏会出现 **「子代理模型」**。

## 设置项

| 字段 | 含义 |
| --- | --- |
| 启用覆盖 | 关闭后完全走 preset / 父会话默认 |
| 跟随父会话模型 | 不再强制子代理 provider/model，仍可单独改思考强度 |
| Provider | 子代理路由，例如 `codex-gateway-subagent` |
| 模型 | 子代理模型，例如 `gpt-5.6-terra` / `grok-4.6` |
| 思考强度 | `inherit` / `low` / `medium` / `high` / `xhigh` / `max` |

值写在 `$DSH_HOME/settings.yaml` 的 `dsh-subagent-settings:` 段，不含密钥。

Web UI 不走官方 `settings.describe` 白名单（第三方命名空间默认不会暴露给浏览器），而是通过本插件自己的 `GET/PUT /dsh-subagent-settings` 读写宿主设置。

## 开发

```sh
npm test
npm run build
```

Host 是普通 ESM；Client 是 DSH `window.__ModuleLoader__` 工厂（和 `dsh-pet` 一样，无需打包器）。

## 不要提交

密钥、`auth.json`、`settings.yaml`、`config.toml`、会话与附件目录。仓库 `.gitignore` 已排除。
