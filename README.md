# 推理场景还原demo

谜境 ·《无人生还》空间推演原型。前端静态页面 + Spring Boot 4.1.1 + Maven + Java 17。

## 启动

需要 JDK 17 或以上版本。项目自带 Maven Wrapper，无需单独安装 Maven；首次构建需要联网下载 Maven 和依赖。

macOS 在 Finder 中双击 `start.command`，或在项目根目录执行：

```sh
./mvnw spring-boot:run
```

Windows：`mvnw.cmd spring-boot:run`。

访问 http://localhost:8080 ，保持终端运行，Ctrl+C 停止。端口占用时：

```sh
PORT=8081 ./mvnw spring-boot:run
```

IDEA 直接打开根目录 `pom.xml`，运行 `com.mijing.MijingApplication`。

## 测试与打包

```sh
./mvnw test
./mvnw package
java -jar target/mijing-demo-0.3.0.jar
```

集成测试启动真实 HTTP 服务、使用临时数据目录，覆盖首页内容类型、静态资源、健康接口、保存恢复、输入验证、请求大小、跨域写入拒绝和数据目录隔离。

## 代码结构

```text
pom.xml
mvnw / mvnw.cmd / .mvn/             Maven Wrapper
src/main/java/com/mijing/
  MijingApplication.java            Spring Boot 入口
  api/                              REST 接口与异常处理
  service/HypothesisService.java     假说校验与原子文件保存
  config/RequestFilter.java          请求头与同源写入检查
src/main/resources/
  application.properties            端口与存储配置
  static/                           index.html、app.js、style.css
src/test/java/com/mijing/            HTTP 集成测试
backend/data/state.json              本地运行数据，不提交 Git
start.command                       macOS 启动脚本
```

## 后端接口与兼容

- `GET /api/health`：服务健康状态。
- `GET /api/state`：读取完整假说快照；首次返回 JSON `null`。
- `PUT /api/state`：保存快照，要求 `application/json`，最大 2 MB。
- 校验方案列表、当前方案索引、阅读进度、时间节点范围与重复时间。
- 使用 Jackson 解析 JSON，替代原来的手写解析器。
- 前端由 Spring Boot 静态资源机制提供，同源访问后端。
- 原有快照格式和 `backend/data/state.json` 路径保留；从项目根目录启动即可恢复旧数据。
- 可以通过 `MIJING_STATE_FILE` 环境变量或 `--mijing.state-file=/absolute/path/state.json` 指定数据文件。
- 浏览器本地副本仍保留。后端存在快照时优先加载后端；后端首次无数据时同步浏览器副本。

这是单用户本机原型，默认监听 127.0.0.1，未实现账号、数据库或多用户冲突控制。Google Drive 中应保持文件离线可用，避免多设备同时写入同一个数据文件。

从旧版迁移后，前端文件统一放入 `src/main/resources/static/`，不再维护根目录的重复前端文件。旧 Java HttpServer、Node 服务器和 npm 启动入口已移除。此次迁移只改变工程结构和后端实现，场景仍为 SVG 概念模型。

## 已完成

- 作品档案、场景工作台、我的假说整体前端框架。
- 两层别墅与兵岛外部概念场景，立体投影视图 / 俯视切换、旋转、缩放、房间选取。
- 十名人物棋子，点击放置、拖动移动、方向和备注编辑。
- 添加时间节点，复制当前位置快照；拖动时间轴、节点切换、播放 / 暂停 / 倍速。
- 多假说复制、切换、重命名、删除、撤销、浏览器本地保存、JSON 导出。
- 阅读场景进度、线索笔记、跨楼层移动的基础检查。
- 自适应桌面与手机布局。

## 体验流程

选中左侧维拉 → 点击餐厅 → 新建 20:15 节点 → 把维拉拖到客厅 → 打开显示轨迹 → 播放时间线 → 保存假说。

“我的假说”可以复制后的多个方案继续推演、重命名及导出。后端连接时数据也保存到项目 backend/data/state.json，清除浏览器数据后可从后端恢复。

## 内容与实现边界

这是小说背景下的空间交互概念模型，不是经过原文逐项核对的建筑复原。人物中文名采用常见简称；未绑定特定译本。房间布局、面积、相邻关系、演示时刻与初始人物位置均为推定或用户假设，不参与原作事实判断。

背景参考：https://www.agathachristie.com/en/stories/and-then-there-were-none

场景使用 SVG 仿立体投影，不是 Three.js / WebGL 真 3D。时间回放切换节点状态，不做未经路线定义的自动行走。轨迹仅表示节点位置变化。基础检查仅提示跨楼层移动缺少路线；不推断凶手、真实耗时或证词可信度。

阅读进度仅控制界面线索，不构成服务端防剧透权限。Demo 不包含凶手、结局或真相复盘。当前无登录、后台、云端同步、公开分享和完整路线编辑；这些适合下一阶段扩展。


字体使用系统字体。完成首次构建后，可使用已打包的 JAR 离线启动。
