# Fulling v3 架构目录

## 1. 产品北极星

- 开箱即用的 AI workspace 交付产品
- Creator 负责配置
- Recipient 直接使用
- 交付物是 workspace，不是 prompt、chatbot 或资源面板

## 2. 用户角色

- Creator
- Recipient
- Workspace Owner
- Workspace Member
- Admin

## 3. 核心对象

- Workspace
- Workspace Template
- Workspace Instance
- Profile
- Mission
- Knowledge
- Memory
- Skill
- Script
- Runtime
- Share Link
- Access Grant

## 4. Workspace 生命周期

- Create
- Configure
- Test
- Publish
- Share
- Use
- Update
- Archive

## 5. Creator 侧模块

- Workspace Builder
- Mission Editor
- Knowledge Manager
- Skill Manager
- Script Manager
- Memory Manager
- Runtime Settings
- Test Console
- Share Settings

## 6. Recipient 侧模块

- Workspace Home
- Task Entry
- Chat / Work Thread
- File Upload
- Output Review
- Approval Center
- Workspace History

## 7. 系统分层

- Experience Layer
- Workspace Domain Layer
- Capability Layer
- Runtime Layer
- Persistence Layer
- Access Control Layer

## 8. 数据模型目录

- User
- Workspace
- WorkspaceTemplate
- WorkspaceMember
- WorkspaceShare
- WorkspaceKnowledge
- WorkspaceMemory
- WorkspaceSkill
- WorkspaceScript
- WorkspaceRuntime
- WorkspaceThread
- WorkspaceRun
- WorkspaceArtifact

## 9. 代码目录边界

### lib/

- 全应用基础设施
- 通用工具
- 环境变量
- 数据库入口
- Auth 入口
- Logger
- JWT
- Fetch client

### lib/platform/

- Fulling 平台核心
- Control
- Orchestrators
- Executors
- Persistence
- Integrations
- Workspace 业务对象
- Runtime 编排
- Knowledge 管理
- Memory 管理
- Skill 绑定
- Script 绑定
- Access 控制
- Artifact 管理

### lib/platform/control/

- 用户意图入口
- Command
- Query
- 输入校验
- 业务规则判断
- 持久状态写入
- 后续任务入队

不放：

- Route handler
- React / UI
- 长时间任务执行
- 外部 SDK 协议细节
- Reconciliation loop

### lib/platform/control/commands/

- create-workspace
- create-workspace-from-template
- configure-workspace-mission
- import-workspace-knowledge
- bind-workspace-skill
- add-workspace-script
- initialize-workspace-runtime
- create-workspace-share
- archive-workspace

### lib/platform/integrations/

- 外部平台适配
- 外部 SDK 封装
- 外部协议通信
- Provider-specific 逻辑

### lib/platform/integrations/sealos/

- auth
- session
- k8s
- devbox
- aiproxy
- namespace
- runtime adapter

## 10. 关键流程目录

- 创建 workspace
- 从 template 创建 workspace
- 配置 mission
- 导入 knowledge
- 安装 skill
- 添加 script
- 初始化 runtime
- 创建分享链接
- Recipient 首次进入
- Recipient 发起任务
- AI 执行任务
- 产出 artifact
- 更新 memory
- 归档 workspace

## 11. 权限目录

- Creator 权限
- Recipient 权限
- Admin 权限
- 分享链接权限
- Workspace 成员权限
- Runtime 操作权限
- Knowledge 访问权限
- Memory 修改权限

## 12. Runtime 目录

- Runtime Provisioning
- Runtime Status
- Runtime Files
- Runtime Secrets
- Runtime Tools
- Runtime Logs
- Runtime Reset
- Runtime Shutdown

## 13. Artifact 目录

- Text Output
- File Output
- Report
- Table
- Image
- Script Result
- Runtime Log
- Approval Record

## 14. 非目标

- Prompt marketplace
- Generic chatbot builder
- Kubernetes UI
- DevOps control panel
- 通用资源管理面板

## 15. MVP 切片

- Creator 创建 workspace
- Creator 配置 mission
- Creator 添加 knowledge
- Creator 绑定一个 skill 或 script
- Creator 测试 workspace
- Creator 分享 workspace
- Recipient 打开 workspace
- Recipient 完成一次任务

## 16. 后续待设计

- Template marketplace
- Billing
- Team workspace
- Enterprise permission model
- Workspace versioning
- Skill authoring
- Script authoring
- Runtime isolation
- Audit log
