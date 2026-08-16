# Dsh Subagent Model & Reasoning Settings Plugin

一个可以在 Web UI 端直接设置子代理模型和思考强度的插件。

## 功能
- 在子代理配置面板直接选择模型
- 直接设置思考强度（low/medium/high/max/xhigh）

## 安装
1. 把这个插件文件夹复制到你的 Dsh Web UI 安装目录
2. 或者把 `dist/` 打包上传到 GitHub Releases
3. 在 Web UI 里安装本地插件

## 结构
- `src/`
  - `Plugin.jsx` - 插件主组件
  - `useSubagentSettings.js` - Zustand 存储 + 注入逻辑
  - `styles.css`
- `dist/` - 构建后的可直接使用的版本
- `README.md`

## 构建
```bash
npm install
npm run build
```

## 使用
1. 把插件放到 Dsh 的插件目录
2. 重启 Web UI
3. 在任意聊天里创建/编辑子代理时，设置面板会显示新控件

## 警告
- 不要把 `key/`、`private_keys/`、`grok.txt` 等敏感文件上传到 GitHub
- 本仓库只包含源代码和配置文件
