<div align="center">

# 🌹 福寿花篮

**挥挥手，让红玫瑰与祝福花材聚成一只福寿花篮。**

[**▶ 在线体验**](https://shebbds.github.io/gesture-Christmas_tree-3d_with_photo/) · [English](README.en.md)

[![Live Demo](https://img.shields.io/badge/demo-live-d4af37?style=flat-square)](https://shebbds.github.io/gesture-Christmas_tree-3d_with_photo/)
[![Three.js](https://img.shields.io/badge/three.js-r160-000000?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-hand%20tracking-00897b?style=flat-square)](https://developers.google.com/mediapipe)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

<img src="assets/og-image.png" alt="Grand Luxury Tree" width="820">

</div>

---

这是一个适合生日、寿宴场景的互动 3D 贺卡。✨

玫瑰、康乃馨、心形、寿桃和寿字等祝寿元素组成 3D 花篮，并保留了 **手势识别**、**粒子特效** 与照片上传能力。页面内置离线可用的喜庆音乐，浏览器允许时会自动播放。

纯前端，没有框架，没有构建步骤，**打开网页就能玩**。

## 🤔 这是啥？(Intro)

这不是那种静态的网页贺卡，而是一棵由 **几千个粒子** 组成的动态树。接入了 Google 的 MediaPipe，所以它能看懂你的手势。

* **粒子特效**：2000 个装饰物 + 2000 粒金尘 + 1000 片雪花，支持呼吸、旋转与炸裂成满天星。
* **花材层次**：金色寿字居中，周围穿插玫瑰、康乃馨、心形、寿桃与绿叶。
* **摄像头可重试**：页面会自动尝试启用手势，也可点击“开启摄像头”按钮重新授权或重试。
* **国乐伴奏**：内置用户提供的《喜洋洋》MP3，循环播放且无需依赖外部音频链接。
* **隔空控物**：不需要鼠标，对着摄像头挥挥手就能控制它（感觉像奇异博士）。
* **挂载回忆**：上传照片，它们会变成带金框的拍立得，沿着树身螺旋飘着。
* **一键出图**：点 `Save Image` 直接导出一张带标题的高清图，发朋友圈刚好。
* **寿宴审美**：绛红 + 香槟金，搭配寿字牌、灯笼与祥云纹样。

<img width="2557" height="1291" alt="image" src="https://github.com/user-attachments/assets/d7d31b4c-bf4d-49b2-b922-79813bbddba5" />

<img width="2559" height="1294" alt="image" src="https://github.com/user-attachments/assets/d7e4e982-3042-449d-8898-105048aeac1d" />

## 🎮 怎么玩？(Controls)

### 🖐️ 手势模式

确保浏览器允许使用摄像头，然后：

| 手势 | 效果 |
| --- | --- |
| **握紧拳头 ✊** | 收！花朵聚合成福寿花篮 |
| **张开手掌 🖐️** | 花瓣散开成祝福星光，左右移动手掌可以转动视角 |
| **捏合手指 🤏** | 随机抓取一张照片并锁定停留，握拳退出 |

识别用的是**相对比例**（以手腕到中指指根的长度为基准），所以手离摄像头远一点近一点都能稳定触发。阈值可以在 `js/config.js` 的 `gestures` 里调，按 <kbd>D</kbd> 能实时看到原始数值。

### 🖱️ 鼠标 & 键盘

| 操作 | 效果 |
| --- | --- |
| 左键拖拽 | 旋转视角 |
| 滚轮 | 缩放 |
| <kbd>H</kbd> | 隐藏所有 UI（截图 / 录屏当壁纸很棒） |
| <kbd>T</kbd> / <kbd>S</kbd> | 手动切换「聚成树」/「散开」 |
| <kbd>D</kbd> | 显示手势识别的调试数值 |
| <kbd>Esc</kbd> | 关闭引导层 |

> 摄像头是可选的。**拒绝授权、没有摄像头、或者手势模型加载失败，都不影响这棵树正常显示**，只是手势控制不可用，鼠标和键盘照常。

## 🖼️ 换成自己的照片

有两种方式：

**1. 页面上传（最简单）**
点页面上的“添加祝福照片”选图片，或者“选择照片文件夹”一次性选一整个文件夹。

**2. 放进 `images/` 自动加载**
把照片丢进 `images/`，再建一个 `images/manifest.json` 列出文件名：

```json
["photo-01.jpg", "photo-02.jpg", "photo-03.png"]
```

可以直接复制 `images/manifest.example.json` 改。没有这个文件也没关系，会自动回退到示例图。

> `images/` 里的内容已经写进 `.gitignore`，你的私人照片不会被误提交上去。

## 🚀 本地跑起来 (Run Locally)

⚠️ **别直接双击 `index.html`**。项目用了 ES Modules，而且摄像头只在安全上下文里可用，`file://` 协议下两样都会挂。必须起一个本地服务器：

```bash
git clone https://github.com/Timo8848/gesture-Christmas_tree-3d_with_photo.git
cd gesture-Christmas_tree-3d_with_photo

python3 -m http.server 8000   # 或者：npx http-server .
```

然后访问 `http://localhost:8000`。

## 📱 发布到手机微信

项目已经包含 `.github/workflows/deploy-pages.yml`。将修改后的项目推送到你自己的 GitHub
仓库，在仓库的 **Settings → Pages → Source** 中选择 **GitHub Actions**。部署完成后会得到
一个 `https://用户名.github.io/仓库名/` 链接，直接发到微信即可点击访问。

必须使用 HTTPS，微信内置浏览器才允许申请摄像头权限。进入页面后点击“开启摄像头”，
再允许访问摄像头即可使用手势。微信通常禁止未交互的有声自动播放，首次点击页面或音乐
按钮后《喜洋洋》会开始播放。

### 把照片嵌入网页

把准备公开展示的图片放入 `images/embedded/`，然后在 `images/manifest.json` 中列出相对路径：

```json
["embedded/photo-01.jpg", "embedded/photo-02.png"]
```

这些文件会随网页一起发布，打开微信链接后自动加载，不需要访问者再次上传。不要把私人照片
放进去，除非你确认它们可以公开访问。

用 VS Code 的话，装个 `Live Server` 插件，右键 `index.html` → "Open with Live Server" 也行。

### URL 参数

| 参数 | 作用 |
| --- | --- |
| `?demo=1` | 演示模式：自动循环「聚成树 → 散开 → 看照片」，并隐藏 UI。录屏、投大屏都合适。 |
| `?quality=high\|medium\|low` | 强制指定画质档位（默认按设备自动判断）。 |

## ⚡ 性能 (Performance)

* **装饰物和金尘全部走 `InstancedMesh`**，4000 个实例只产生个位数 draw call，另有 1000 片雪花统一批量渲染。
* **按设备自动分档**：所有设备保留 2000 个装饰物、2000 粒金尘和 1000 片雪花；触摸屏 / 低核心数只降低 `pixelRatio`，不减少视觉元素。辉光（Bloom）在所有档位保留。
* 每帧的向量和矩阵全部复用，热路径上没有临时对象分配。

## 🛠️ 用了什么 (Tech)

纯前端，没有框架，没有打包工具，依赖通过 importmap 从 CDN 引入：

* **[Three.js](https://threejs.org/) 0.160** — 3D 渲染、粒子系统、Bloom 后期
* **[MediaPipe Tasks Vision](https://developers.google.com/mediapipe) 0.10** — 手势识别
* **原生 JS (ES Modules)** — 手搓核心逻辑

## 📁 项目结构

```
index.html          入口
css/style.css       样式
js/
  main.js           启动流程 + 渲染主循环
  config.js         所有可调参数（颜色、粒子数、手势阈值、画质分档…）
  scene.js          渲染器 / 相机 / 灯光 / 后期 / 鼠标控制
  tree.js           树身装饰物（InstancedMesh）、顶端星星、金尘
  particle.js       单个粒子在三种形态间的运动
  photos.js         照片加载、金框、螺旋排布
  snow.js           飘雪
  gestures.js       MediaPipe 手势识别
  capture.js        导出带标题的成品图
  demo.js           ?demo=1 自动循环演示
  ui.js             按钮、引导层、快捷键、状态提示
  utils.js          阻尼函数与程序化生成的贴图
images/             放你自己的照片
```

想调效果的话，绝大多数参数都集中在 `js/config.js` 一个文件里。

## 📄 License

MIT，见 [LICENSE](LICENSE)。

---

<div align="center">

**Merry Christmas! 🎅**

如果你觉得这项目有点意思，欢迎 Star ⭐，或者 Fork 改成你喜欢的颜色！

</div>
