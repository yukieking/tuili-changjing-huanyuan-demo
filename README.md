# 推理图鉴

推理书架 + 场景再现。收录《十角馆事件》《无人生还》《如首无作祟之物》的可自由检视的三维场景与自动事件时间轴。

拖动时间轴即可查看书中人物位置、遗体转移及物证变化；平面图点击房间进入立体图。“当时所见”按小说记录自动定位，支持切图和播放；“自己推理”可建立个人时间线、安排人物／遗体位置、记录证词与随记。两种模式互不覆盖。入口会提示剧情内容。

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

只保留这一套界面；章节选择、巡礼与实验版本已移除，个人推理使用共享的新记录模块。Git 历史保留旧实现。运行不依赖外部 CDN；Three.js 许可证见 `THIRD_PARTY.md`。

## 内容规则

时间轴以书中事件为单位，相邻节点不代表相等的时间间隔。约略时间保留约略表达；未知位置不会自动延续上次位置。遗体仅在原文记载的转移后改变地点，未知去向留空。人物服饰、绝对尺寸及没有明确说明的平面布局均为展示推定，不用于证明机关或移动耗时。

“当时所见”保留误认、证词与假死；完整真相补述、真实身份映射及解答数据已移除。自己的位置假设不当作原文事实。记录采用自行整理的短摘要与章次索引，不包含小说全文、EPUB 或原书插图。整理边界见 [内容说明](docs/atlas-content.md)。

## 检查

```sh
node --test tests/frontend/*.test.mjs
./mvnw test
```

前端检查需要 Node.js 22 或以上；运行网站仅需要 Java。浏览器需要 WebGL2；初始化失败时回退平面图。

## 只读接口

`GET /api/health`、`GET /api/atlas`、`GET /api/atlas/{decagon|christie|kubi}`、`GET /api/recommendations`。前端也能直接使用同包静态 JSON；个人方案按作品保存在浏览器本地，支持新建、复制、编辑、删除、撤销和 JSON 导入／导出；没有服务器写入接口。

## 场景检视与自己推理

左键拖动旋转、右键拖动平移、滚轮缩放；触屏单指旋转、双指缩放／平移。点击平面房间或三维地面聚焦，隐藏房间遮挡；恢复默认视角按钮返回清楚的立体角度。同一地图切换事件时保持观察角度。

个人位置点持续至下一次安排；时间区间在结束时停止定位。证词独立保存，不会改变棋子位置。检查同时出现于不同地点、位置假设与证词的重叠差异；不把差异判定成说谎，不验证移动速度或空间机关。个人模式物证保留切换前的小说节点。
