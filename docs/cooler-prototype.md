# 饮料冷柜 Blender 样板

## 在店内对比

从项目根目录运行 `python -m http.server 8000`。用支持 WebGL 的浏览器打开 [右侧冷柜样板](http://127.0.0.1:8000/?view=cooler-art) 和 [同机位原版](http://127.0.0.1:8000/?view=cooler-art&cooler=original)。向前走到出现「打开冷柜」，可以测试原有门控。对准饮料可以查看品名、价格和取放反馈。左侧冷柜沿用原版。

浏览器也可以直接打开 HTTPS 静态预览。冷柜机位顶部提供两个版本的切换入口。手机可用「向前」按钮或摇杆靠近，点击饮料后使用「拿起来」或「归位」。部署时将项目根目录的 `index.html` 与 `src/`、`vendor/`、`assets/`、`compare/` 以现有目录结构一同复制到静态站点根目录。GLB 已内嵌包装图集。

样板由现有 Three.js r128 和同版本的 [GLTFLoader](https://github.com/mrdoob/three.js/blob/r128/examples/js/loaders/GLTFLoader.js) 加载。模型加载失败时回到原柜。两个门叶使用原有门轴和碰撞，八类饮料使用八个实例批次，共用一张包装和价签图集。柜内利用现有照明、微发光灯罩和包装补光。

## 重建资产

用 Blender 4.3.2 运行脚本。Blender 的 Python 需要 Pillow。默认使用 DejaVu Sans Bold 和 Noto Sans CJK Bold，其他平台可设置 `COOLER_LATIN_FONT` 与 `COOLER_JAPANESE_FONT` 指向对应字体。包装、价签和模型由脚本制作。

```sh
blender -b -t 2 --factory-startup --python tools/build-cooler.py -- assets/models/yomachi-cooler.glb
```

可在 GLB 输出路径后再传一个 `.jpg` 路径，得到 [Blender 展示渲染](yomachi-cooler-studio.jpg)。

## 验证

```sh
node tests/cooler-sample.cjs
node tests/audio.cjs
node tests/browser.cjs http://127.0.0.1:8000/ browser-results --cooler
```

几何测试需要 `@napi-rs/canvas`，并会一并运行原版 240 秒场景回归。浏览器测试需要 Playwright 和 Chromium，可用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE` 指定已安装的 Chromium。浏览器测试输出 1440×900 和 390×844 的同机位截图、开门截图、两档画质的绘制调用数与帧率。

本次云端 Chrome 打开页面后报告 `Error creating WebGL context`。工作区的独立 Chromium 也在启动阶段被环境拒绝，因此浏览器截图、实测帧率和 iPhone Safari 表现待验证。Blender 展示图仅用于查看资产本身。
