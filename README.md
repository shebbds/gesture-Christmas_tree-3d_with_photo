# 🎄 Grand Luxury Tree

哈喽！这是一个为了庆祝圣诞节写的小项目。✨

原本只是想画一棵普通的 3D 圣诞树，但觉得不够酷，于是加上了 **手势识别** 和 **粒子特效**。现在你可以通过摄像头「隔空」控制这棵树，还能把自己喜欢的照片挂上去。

纯前端，没有构建步骤，起个本地服务器就能跑。

<img width="2559" height="1439" alt="image" src="https://github.com/user-attachments/assets/45f3ec57-00b5-4989-b3b2-484772ad95cf" />

## 🤔 这是啥？(Intro)

这不是那种静态的网页贺卡，而是一棵由 **几千个粒子** 组成的动态树。接入了 Google 的 MediaPipe，所以它能看懂你的手势。

* **粒子特效**：1500 个装饰物 + 2000 粒金尘 + 1000 片雪花，树会呼吸、旋转，还能炸裂成满天星。
* **隔空控物**：不需要鼠标，对着摄像头挥挥手就能控制它（感觉像奇异博士）。
* **挂载回忆**：上传照片，它们会变成带金框的拍立得，沿着树身螺旋飘着。
* **极简审美**：午夜蓝 + 香槟金，主打一个「高级感」。

<img width="2557" height="1291" alt="image" src="https://github.com/user-attachments/assets/d7d31b4c-bf4d-49b2-b922-79813bbddba5" />

<img width="2559" height="1294" alt="image" src="https://github.com/user-attachments/assets/d7e4e982-3042-449d-8898-105048aeac1d" />

## 🚀 跑起来 (How to Run)

⚠️ **别直接双击 `index.html`**。项目用了 ES Modules，而且摄像头只在安全上下文里可用，`file://` 协议下两样都会挂。必须起一个本地服务器：

```bash
# Python
python3 -m http.server 8000

# 或者 Node.js
npx http-server .
```

然后访问 `http://localhost:8000`。

用 VS Code 的话，装个 `Live Server` 插件，右键 `index.html` → "Open with Live Server" 也行。

> 摄像头是可选的。**拒绝授权、没有摄像头、或者手势模型加载失败，都不影响这棵树正常显示**，只是手势控制不可用，鼠标和键盘照常。

## 🎮 怎么玩？(Controls)

### 🖐️ 手势模式
确保浏览器允许使用摄像头，然后：

| 手势 | 效果 |
| --- | --- |
| **握紧拳头 ✊** | 收！粒子聚合成圣诞树 |
| **张开手掌 🖐️** | 炸裂模式，树散开成星云，左右移动手掌可以转动视角 |
| **捏合手指 🤏** | 随机抓取一张照片放大到眼前 |

识别用的是**相对比例**（以手腕到中指指根的长度为基准），所以手离摄像头远一点近一点都能稳定触发。阈值可以在 `js/config.js` 的 `gestures` 里调，按 **D** 能实时看到原始数值。

### 🖱️ 鼠标 & 键盘

| 操作 | 效果 |
| --- | --- |
| 左键拖拽 | 旋转视角 |
| 滚轮 | 缩放 |
| **H** | 隐藏所有 UI（截图 / 录屏当壁纸很棒） |
| **T** / **S** | 手动切换「聚成树」/「散开」 |
| **D** | 显示手势识别的调试数值 |

## 🖼️ 换成自己的照片

有两种方式：

**1. 页面上传（最简单）**
点右上角 `Select Files` 选图片，或者 `Select Folder` 一次性选一整个文件夹。

**2. 放进 `images/` 自动加载**
把照片丢进 `images/`，再建一个 `images/manifest.json` 列出文件名：

```json
["photo-01.jpg", "photo-02.jpg", "photo-03.png"]
```

可以直接复制 `images/manifest.example.json` 改。没有这个文件也没关系，会自动回退到示例图。

> `images/` 里的内容已经写进 `.gitignore`，你的私人照片不会被误提交上去。

## 🛠️ 用了什么 (Tech)

纯前端，没有框架，没有打包工具，依赖通过 importmap 从 CDN 引入：

* **Three.js 0.160** — 3D 渲染、粒子系统、Bloom 后期
* **MediaPipe Tasks Vision 0.10** — 手势识别
* **原生 JS (ES Modules)** — 手搓核心逻辑

## 📁 项目结构

```
index.html          入口
css/style.css       样式
js/
  main.js           启动流程 + 渲染主循环
  config.js         所有可调参数（颜色、粒子数、手势阈值…）
  scene.js          渲染器 / 相机 / 灯光 / 后期 / 鼠标控制
  tree.js           树身装饰物、顶端星星、金尘
  particle.js       单个粒子在三种形态间的运动
  photos.js         照片加载、金框、螺旋排布
  snow.js           飘雪
  gestures.js       MediaPipe 手势识别
  ui.js             按钮、快捷键、状态提示
  utils.js          阻尼函数与程序化生成的贴图
images/             放你自己的照片
```

想调效果的话，绝大多数参数都集中在 `js/config.js` 一个文件里。

## 📄 License

MIT，见 [LICENSE](LICENSE)。

**Merry Christmas! 🎅**
如果你觉得这项目有点意思，欢迎 Star，或者 Fork 改成你喜欢的颜色！
