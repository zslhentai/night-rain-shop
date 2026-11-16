# 雨夜便利店 5.0 开发与验收

基线是 `preview` 的 `2544f2ae8f125abc5dc62043d466b0e6d971422b`。沿用仓库原有 Three.js r128、静态 HTML、相对路径和本地雨声音频。项目运行不需要构建步骤、后端或 API。

## 主要改动

1. 以原建筑和入口为边界，用共享布局数据定义货架、冷柜、柜台、员工区和碰撞。主通道净宽 1.70，右侧通道最窄约 1.09，左侧柜台旁约 1.01，均为模型单位。
2. 顾客从入口到鲜食、再到排队点、收银与出口。员工经 STAFF 门进后场取货，按原机制完成扫码、售出和补货。
3. 线性灯具照亮过道和货架面，冷柜、鲜食、收银与门口各有独立方向和色温，采用统一的高光处理。
4. 墙面、吊顶、地砖和设备增加不同材质表现，货架下有单张烘焙接触阴影，保留室外冷蓝雨夜。
5. 24 种可辨认的商品模型分区上架，包括多种瓶罐、纸盒、软袋、杯碗面、鲜食和洗护。
6. 原创包装共用贴图，价签与品类对应，货位有固定种子的轻微错位和空位。
7. 货架支脚、端架、价签槽、四层饮料冷柜、收银小票与纸杯补足了主要设备的细节。
8. 手机有独立摇杆和右侧滑动转向，桌面可用 WASD、拖动、滚轮或可选鼠标锁定。
9. 玩家可触发自动门，近距离查看、拿起并归位商品，也可操作冷柜门。
10. 室内雨声衰减，增加很轻的设备底噪、门提示与脚步。共享几何、商品实例化和流畅档减少渲染资源和特效。

## 文件

- 页面与镜头 `index.html`、`src/core.js`、`src/main.js`
- 布局与营业 `src/layout.js`、`src/navigation.js`、`src/people.js`、`src/effects.js`
- 室内 `src/store.js`、`src/interior.js`、`src/interior-lighting.js`、`src/interior-products.js`、`src/interior-interactions.js`
- 音频 `src/audio.js`
- 对比 `compare/index.html`、`compare/before.html`、`compare/after.html`、`compare/fixed-view.js`、`compare/baseline/src/`
- 验证 `tests/scene.cjs`、`tests/audio.cjs`、`tests/browser.cjs`、本报告

完整逐文件清单用 `git diff --name-status 2544f2a..HEAD`。

## 已验证

- `node tests/scene.cjs` 通过。240 秒中完成 3 次扫码、5 次公交循环，店员补货和 850 帧乘车状态有效。还核验了两种视口的重点镜头投影、过道宽度、出生点、玩家触发自动门、冷柜开闭碰撞及商品拿取归位。
- `node tests/audio.cjs` 通过。覆盖资源延迟加载、开关复用、零音量、室内低通和后台暂停恢复。
- `git diff --check 2544f2a..HEAD` 通过。

| CPU 构建场景后的结构计数 | Preview | V5.0 |
|---|---:|---:|
| 网格节点 | 1,653 | 1,400 |
| 不同的网格几何对象 | 1,645 | 618 |
| 实例化绘制中的实例 | 121 | 198 |

这些是 Three.js 场景树计数，实际绘制调用数受相机裁切、透明排序、阴影及画质影响。

## 浏览器复测

云端共享 Chrome 的基线与 V5 页面都未能初始化 WebGL。本地无头 Chromium 也在创建进程套接字时被系统拒绝。实际 WebGL 截图、绘制调用数、帧率、GPU 内存趋势、渲染后的颜色与透明排序，以及 Windows 和 iPhone Safari 实机验收均待复测。

在带 WebGL 的设备上静态托管此分支，从 `/compare/` 切换 Preview 基线与 V5.0。两个版本使用相同相机坐标、模拟时刻和画质，可查门外正视、门外斜视、店内、货架、收银、饮料柜和鲜食。直接浏览项目首页可测试日常交互。

```text
python3 -m http.server 8000
node tests/browser.cjs http://localhost:8000/ /tmp/rain-shop-v5-results
```

浏览器脚本需要测试机安装 Playwright 及 Chromium。可设 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 使用本机 Chromium、设 `HEADED=1` 使用带窗口的浏览器；这些都是开发测试依赖。脚本会在 1440×900 与 390×844 抓取同机位图片，并记录两档画质下的 `renderer.info`、帧率与错误。手机部分为视口模拟，iPhone 实机输入与性能另行检查。
