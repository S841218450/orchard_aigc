# Orchard_AIGC 精简版开发规范

## 一、核心强制约束（MUST 级）

### 1.1 技术栈约束

| 分类      | 强制遵循                                         | 严格禁止                                           |
| --------- | ------------------------------------------------ | -------------------------------------------------- |
| 基础架构  | Next.js 16 + Turbopack、App Router；TS5 严格模式 | 使用任意隐式`any`、降级老旧Next写法                |
| UI 体系   | Ant Design v6、lucide-react图标、SCSS全局变量    | `@ant-design/icons`、Tailwind、行内style硬编码色值 |
| 状态管理  | 跨组件共享用Zustand；组件局部状态使用`useState`  | Redux/MobX、同一份数据多处维护state                |
| 请求&工具 | 封装Axios全局实例、ahooks、GSAP动画库            | 裸写fetch/axios、错误拼写`gasp`替代gsap            |

### 1.2 编码强制规则

1. 组件Props、接口返回值必须补充完整TS类型，可选字段使用`?`类型守卫；
2. SSR/RSC环境访问浏览器API必须增加`typeof window !== "undefined"`判断，交互组件添加`"use client"`；
3. Antd弹窗、通知必须依托`App.useApp()`上下文，全局轻提示统一调用`messageManager`；
4. 页面接口请求统一采用ahooks `useRequest`，禁止手动在`useEffect`维护loading、异常捕获；
5. GET请求参数放入query，POST/PUT/DELETE参数统一放在请求body，禁止混用传参位置。
6. 涉及删除、清空等破坏性操作必须二次确认（行内删除用`Popconfirm`包裹`Button`，页面级删除用`App.useApp()`解构`modal.confirm`），禁止无确认直接执行；
7. 按钮一律使用 Ant Design `Button`组件，禁止使用原生`<button>`或自定义封装按钮；
8. 组件使用优先选用 Ant Design 组件库现成组件（`Popconfirm`、`Modal`、`Table`、`Tree`等），禁止重复封装或改用原生元素替代。

### 1.3 代码提交约束

1. 提交前清除代码内`console.log`、`debugger`、未处理`TODO`标记；
2. 禁止使用`@ts-ignore`绕过类型报错，类型兼容问题使用`(val as unknown as T)`并添加注释；
3. 修改API模块配置文件后必须重启开发服务验证。

## 二、高频踩坑速查表

| 异常现象                                                 | 解决方案                                                            |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| 修改`src/api/module`、`register.ts`后方法找不到、HMR失效 | 重启dev服务，无效则清空`.next`缓存后重启                            |
| 浏览器控制台出现`content.js`、沉浸式翻译相关报错         | 第三方浏览器扩展注入报错，无需修改项目代码                          |
| React19 控制台`cascading renders`渲染循环警告            | 替换为useRequest，同步setState使用`queueMicrotask`包裹              |
| Antd静态提示丢失主题样式                                 | 弃用`message/Modal.xxx`静态方法，改用上下文实例与全局messageManager |
| SSR环境运行报错window/document未定义                     | 增加环境判断守卫，逻辑移入useEffect客户端执行                       |

## 三、技术栈选型明细

| 工具       | 版本&用法要点                                                       |
| ---------- | ------------------------------------------------------------------- |
| Next.js    | 16 + Turbopack；src/app默认RSC，交互组件声明`"use client"`          |
| TypeScript | 5.x 严格模式，全局开启类型校验                                      |
| UI组件     | Ant Design v6，全局包裹ConfigProvider、App组件                      |
| 图标       | lucide-react，全项目统一导入，禁用antd内置图标库                    |
| 样式       | SCSS Modules + 全局Design Token，颜色、间距取自`src/style/core`变量 |
| 状态库     | Zustand存放全局用户、会话等共享状态                                 |
| 请求库     | 项目封装Axios实例，业务层仅允许调用`API.xxx`                        |
| 动画       | GSAP + `@gsap/react`，页面入场、复杂交互动画专用                    |
| Hooks      | ahooks优先处理请求防抖、滚动、状态监听等通用逻辑                    |

## 四、全局统一类型规范

### 4.1 接口统一返回结构 ActionResult<T>

```typescript
export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

- 正常返回：`{ success: true, data: 业务数据 }`
- 异常返回：`{ success: false, error: 前端可直接展示的错误文案 }`

### 4.2 通用工具入参规范

1. **时间格式化**
   入参兼容字符串/毫秒时间戳 `t?: string | number`，统一调用`src/utils/timeUtils.ts`内`formatTime/formatDate`，禁止组件内手动拼接日期；
2. **文件大小格式化**
   入参支持数字/字符串字节值，使用`formatFileSize`统一换算单位。

## 五、代码提交前置校验流程

1. IDE 全局检测TS语法红线，确保当前文件无类型报错；
2. 修改API、Actions全局模块，执行`tsc --noEmit`全量类型编译校验；
3. 改动API注册文件、接口清单，重启本地开发服务验证接口调用；
4. 手动走一遍本次改动对应的业务流程，验证功能正常；
5. 清理调试代码、无用注释，确认无违规语法后提交。

## 六、业务场景选型速查表

| 业务场景          | 推荐方案                                                                          | 禁止方案                                      |
| ----------------- | --------------------------------------------------------------------------------- | --------------------------------------------- |
| AI聊天气泡页面    | SCSS自定义样式 + 语义化class                                                      | 引入`@ant-design/pro-chat`重型聊天组件        |
| 文件上传拖拽      | Antd Upload.Dragger + customRequest对接项目API                                    | 原生div手写拖拽监听onDrop                     |
| 知识库树形目录    | Antd Tree组件配置treeData                                                         | 手写递归DOM实现树形结构                       |
| 文件列表表格      | Antd Table组件承载数据                                                            | div+Grid布局手动拼装表格                      |
| 状态标签展示      | Antd Tag内置预设主题色                                                            | 自定义class硬写背景色                         |
| 删除/二次确认弹窗 | 行内删除用`Popconfirm`包裹`Button`；页面级删除用`App.useApp()`解构`modal.confirm` | 浏览器原生confirm弹窗、原生`<button>`直接删除 |
| 全局会话ID共享    | Zustand全局Store存储                                                              | 多层组件透传Props、页面重复useState           |
| 后端接口请求      | Actions层封装 + useRequest调度                                                    | 组件内部直接调用API、裸写useEffect请求        |
