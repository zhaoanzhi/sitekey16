# SiteKey 16

[打开静态网站](https://zhaoanzhi.github.io/sitekey16/) · [下载 Android APK](./SiteKey16-v1.0-compatible.apk) · [下载完整源码](./SiteKey16-source.zip)

这是纯静态 GitHub Pages 页面和共用同一 HTML 的离线 APK。Android 8.0 及以上可安装；新包名不会覆盖旧 APK。

仓库根目录的网页直接用于 Pages；完整 Android 源码、构建脚本及旧 APK 差分测试在 **SiteKey16-source.zip** 中。

在仓库根目录运行 `node compatibility.mjs` 可验证网页；解压完整源码后，按下文构建说明使用。GitHub Actions 每次提交会校验四组官方向量和边界输入。

## 使用

输入主密码与网站名，点击“生成密码”。主密码默认隐藏，可切换显示；结果可复制。每次打开页面自动校验四组官方向量，失败时禁用生成。

主密码不裁剪空格、不转小写、不做 Unicode normalization。网站名遵循 v1 的规范化规则。SHA-256 输入里的每个 `\0` 是 **0x5C + 0x30 两个 ASCII 字符**，不是 NUL。字符集、取模和 shuffle 顺序保持 v1。

### 网站名边界约定

按作者确认，网站名**只规范化一次**，严格遵循需求文档。旧 APK 的按钮处理器会先规范化，再调用内部会规范化的 `derive`，因此旧界面对 `www.www.example.com` 等少见输入会去掉两次 `www.`。本版本按文档得到 `www.example.com`，所以该边界与旧 APK 界面结果有意不同；四组官方向量和旧 APK 的核心 `derive` 行为一致。不得宣称所有任意输入均与旧界面完全相同。

实现使用标准 UTF-8 编码。不可配对的 UTF-16 surrogate 会按 TextEncoder 标准替换为 U+FFFD；旧 APK 使用 encodeURIComponent，对这种无效字符串会报错。正常 Unicode 文本不受影响。

计算在本机进行，输入不写入浏览器存储、URL 或日志；CSP 禁止网络连接。用户点击复制时，仅生成结果进入系统剪贴板。浏览器扩展、系统输入法和系统剪贴板属于应用之外的环境。

## Android

- 安装文件：`SiteKey16-v1.0-compatible.apk`。
- Android 8.0 / API 26 及以上；使用系统 WebView。
- 包名 `com.sitekey16.offline`，可与原版 `com.openai.sitekey16` 并存，不覆盖旧版。
- APK 不声明 INTERNET 权限，不启用备份、文件访问、WebView 存储或 Cookie。
- 新 APK 的签名独立于旧版；它不是旧版的原签名升级包。

## 自动兼容测试

需要 Node.js 18 或更新版本，仅使用内置模块：

```sh
node tests/compatibility.mjs
```

四组测试逐项检查 normalizedSite、SHA-256 hex 和 16 个密码字符，同时覆盖端口、子域名、www2、Unicode、空格和分隔符等边界。

如有旧 APK，可直接提取其内嵌算法，在每种架构上比较 1,200 组确定性输入；只在本机读取 APK，不上传旧 APK：

```sh
python tests/compare-apk.py /path/to/SiteKey16-v1.0.apk
```

已通过四组官方向量、14 组规范化边界、UTF-8/空格/分隔符检查、网页生成和复制操作，以及旧 APK arm64-v8a / x86_64 两种架构共 2,400 组核心算法对比。APK 已通过 v2/v3 签名校验及内嵌页面字节一致性校验。本机未连接 Android 设备，也没有可启动的模拟器，尚未完成真机安装与操作验证。

## 构建 APK

需要 Python 3、JDK 11、Node.js 和 Android SDK（platforms / build-tools）。Windows 示例：

```powershell
python build-apk.py --sdk "$env:LOCALAPPDATA\Android\Sdk" --java-home "C:\Program Files\Microsoft\jdk-11.0.16.101-hotspot"
```

产物位于 `artifacts/`。首次构建会在 `private/` 创建本地签名密钥与密码，已在 `.gitignore` 排除。请保管这些文件，用于以后签名更新，**不要上传到公开仓库或发给他人**。公开源代码包不包含签名密钥。

## GitHub Pages

可以单独将 `web/index.html` 与 `web/.nojekyll` 放到仓库根目录，使用 main 分支根目录发布；或者将本项目的 `web` 文件夹作为静态部署产物。Pages 不需要服务器或构建依赖。

官方配置说明：[GitHub Pages 发布源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。
