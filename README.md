# 阿雅理财助手 (Vue 3 + TypeScript 版本)

这是一个使用 Vue 3 和 TypeScript 构建的理财助手前端应用。

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Vite
- WebRTC (用于视频通话功能)

## 项目结构

```
src/
├── App.vue         # 主应用组件
├── main.ts         # 应用入口点
├── webrtc.ts       # WebRTC 管理器
```

## 开发环境

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 类型检查

```bash
npm run type-check
```

## 功能特性

1. 实时聊天功能
2. WebSocket 连接管理
3. WebRTC 视频通话
4. 语音合成
5. 响应式设计

## 配置

- 服务器地址在 `vite.config.ts` 中配置
- WebSocket 连接在 `App.vue` 中配置

## 后端服务

此前端应用需要后端服务支持，后端服务应运行在 `localhost:8000` 上。

## 注意事项

1. 确保后端服务正在运行
2. 浏览器需要支持 WebRTC 和 WebSocket
3. 需要摄像头和麦克风权限才能使用视频通话功能