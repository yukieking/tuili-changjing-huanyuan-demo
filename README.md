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
java -jar target/mijing-demo-0.6.0.jar
```

集成测试启动真实 HTTP 服务、使用临时数据目录，覆盖首页内容类型、静态资源、健康接口、保存恢复、新路线/区间/门窗状态、输入验证、请求大小、跨域写入拒绝和数据目录隔离。

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

从旧版迁移后，前端文件统一放入 `src/main/resources/static/`，不再维护根目录的重复前端文件。旧 Java HttpServer、Node 服务器和 npm 启动入口已移除。场景已升级为 Three.js 真 3D，仍提供 SVG 俯视图用于摆放棋子。

## 3D 与行动推演

- 默认整体建筑：鼠标拖动旋转、滚轮缩放；支持隐藏屋顶、隐藏外墙、楼层展开。
- 点击楼层标签或左侧楼层按钮进入一层/二层；点击房间聚焦并使墙面透明。
- 面包屑随时返回楼层和整体；透明其他层辅助理解连接。俯视图可用于精确摆放。
- 楼梯为实体台阶，路线从一层楼梯间连接二层走廊。
- 人物可点击、拖动放置，编辑方向和备注。3D 点击门、窗和关键物件查看信息。
- 路线编辑支持逐个选择相邻空间，也可预览建议路径；只有明确确认后才保存与播放。
- 起止时间节点自动建立，沿经过门、走廊和楼梯的折线路径连续移动。
- 停留区间支持用户假设、人物证词、约略时间、来源与备注；证词不自动转为事实或改变位置。
- 时间节点保存门锁、窗户开闭和演示钥匙持有人。持钥匙不会自动解锁门。
- 检查锁门穿越、路线重叠、未指定路径的位置变化、陈旧的路线端点，以及停留/证词与行动差异。
- 多假说复制、重命名、删除、撤销、浏览器缓存、Spring Boot 保存与 JSON 导出。
- 旧方案以稳定房间标识加载，并显示布局变更提示；二层布局需重新核对。

### 快速体验

点击 **体验楼梯路线 → 创建并查看**，生成独立演示假说，原方案保留。

点击播放，观察维拉从客厅经大厅、走廊、楼梯到二层客房；拖动时间轴定位行动时刻。进入房间，选择门并在节点设为锁闭，再点击检查当前假说可查看冲突。

### 前端模块和测试

- `static/domain.js`：房间与连接图、路径采样、兼容迁移、冲突检查。
- `static/scene3d.js`：Three.js 建筑、门窗与棋子、射线拾取和轨迹渲染。
- `static/app.js`：工作台交互、路线/区间编辑、时间线和后端同步。
- `static/vendor/`：固定 Three.js 0.180.0 模块与 OrbitControls；保留 MIT 许可证。页面不依赖外部 CDN。

前端逻辑测试需要 Node.js 22 或以上：

```sh
node --test tests/frontend/domain.test.mjs
```

运行时只需要 Java。浏览器需要 WebGL2；无法初始化时自动回退俯视图。

## 内容与实现边界

这是小说背景下的空间交互概念模型，不是经过原文逐项核对的建筑复原。人物中文名采用常见简称；未绑定特定译本。房间布局、面积、相邻关系、演示时刻与初始人物位置均为推定或用户假设，不参与原作事实判断。

背景参考：https://www.agathachristie.com/en/stories/and-then-there-were-none

场景是 Three.js 几何概念模型，不是经过逐项原文核对的建筑复原。路线连线表示用户确认的行动，使用编辑推定的通行图，不代表原作真实行动。时间由用户指定，动画速度不证明真实耗时。不提供视线、声音传播或物理机关模拟。

阅读进度仅控制界面线索，不构成服务端防剧透权限。Demo 不包含凶手、结局或真相复盘。当前无登录、内容后台、公开分享、真相复盘和真实距离/速度验证；这些适合下一阶段扩展。

字体使用系统字体。完成首次构建后，可使用已打包的 JAR 离线启动。

## 新作品：《如首无作祟之物》

启动后访问 `http://localhost:8080/kubi.html`，或从「作品档案」进入。新增媛首村整体、三条参道、媛神堂、独立双螺旋荣螺塔与三座婚舍；36 位人物支持分组放置、路线播放、分时段假说、注记与独立保存。

点「体验双螺旋路线」可创建一份独立体验假说；点「塔内结构」查看 A / B 两条斜道。原《无人生还》与原假说继续保留。默认不展示结局，阅读范围可展开第八章以前的部分约时记录。

空间关系有书前图示与正文依据，全部绝对尺寸、高度及材质为展示推定。细节、来源、限制与测试见 [场景模型说明](docs/kubi-scene.md)。仓库不包含用户提供的 EPUB 或原书图像。

## 推理书架

`http://localhost:8080/recommendations.html` 收录 11 部推理与悬疑作品，提供书名、作者、类型、推荐理由及空间适配建议。按用户要求不展示来源。支持搜索、筛选与浏览器本地“想读”收藏；现有两个作品均有导航入口。

`GET /api/recommendations` 返回随项目发布的书单；静态 JSON 作为前端回退，不依赖外部平台在线加载。
