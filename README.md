# 推理图鉴

推理书架 + 场景再现。收录《十角馆事件》《无人生还》《如首无作祟之物》的固定视角三维场景与自动事件时间轴。

拖动时间轴即可查看书中人物位置、遗体转移及物证变化；平面图点击房间进入立体图。支持自动切换地点、逐事件播放，以及“当时所见 / 真相复盘”。无需手动摆放或记录。入口会提示剧情内容，真相复盘需再次确认。

## 启动

需要 JDK 17 或以上。项目使用 Spring Boot 4.1.1 与 Maven Wrapper。首次构建需要联网。

```sh
./mvnw spring-boot:run
```

访问 http://localhost:8080 。macOS 可双击 `start.command`；Windows 使用 `mvnw.cmd spring-boot:run`。其他端口：`PORT=8081 ./mvnw spring-boot:run`。

```sh
./mvnw package
java -jar target/tuili-atlas-1.0.0.jar
```

默认仅监听本机；对外部署可设置 `--server.address=0.0.0.0`。

## 结构

- `src/main/resources/static/atlas/`：共享页面逻辑、纯事件回放引擎，以及三本书各自的空间、事件数据与三维模型。
- `src/main/resources/static/recommendations/`：书架、简介与正版书检索入口。
- `src/main/java/com/tuiliatlas/`：Spring Boot 入口与只读内容接口。
- `tests/frontend/`、`src/test/`：回放逻辑与真实 HTTP 集成测试。

只保留这一套界面，旧手动推演、章节选择、巡礼与实验版本已移除。Git 历史保留旧实现。运行不依赖外部 CDN；Three.js 许可证见 `THIRD_PARTY.md`。

## 内容规则

时间轴以书中事件为单位，相邻节点不代表相等的时间间隔。约略时间保留约略表达；未知位置不会自动延续上次位置。遗体仅在原文记载的转移后改变地点，未知去向留空。人物服饰、绝对尺寸及没有明确说明的平面布局均为展示推定，不用于证明机关或移动耗时。

“当时所见”保留误认、证词与假死；“真相复盘”增加结尾补述。《首无》区分叙事称呼、真实身份与尸体误认，保留不同解答及未定结局。记录采用自行整理的短摘要与章次索引，不包含小说全文、EPUB 或原书插图。整理边界见 [内容说明](docs/atlas-content.md)。

## 检查

```sh
node --test tests/frontend/*.test.mjs
./mvnw test
```

前端检查需要 Node.js 22 或以上；运行网站仅需要 Java。浏览器需要 WebGL2；初始化失败时回退平面图。

## 只读接口

`GET /api/health`、`GET /api/atlas`、`GET /api/atlas/{decagon|christie|kubi}`、`GET /api/recommendations`。前端也能直接使用同包静态 JSON；没有个人位置记录或写入接口。
