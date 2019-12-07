# touchbar-emoji #

**使用touchbar来控制飘落emoji表情雨。**

## 运行源码 🤣 ##

```sh
git clone git@github.com:KaiOrange/touchbar-emoji.git
cd touchbar-emoji

# MacOS
ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/ npm install

# WindowsOS
npm install -g cross-env
cross-env ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron npm install
cross-env PYTHON_MIRROR=http://npm.taobao.org/mirrors/python npm install --global --production windows-build-tools

npm start
```

## 下载最新安装包 😇 ##

[MacOS](http://touchbar-emoji.cn-bj.ufileos.com/touchbar-emoji-darwin-x64.zip)

[WindowsOS 安装版](http://touchbar-emoji.cn-bj.ufileos.com/touchbar-emoji-Setup-win32.zip)

[WindowsOS 免安装版](http://touchbar-emoji.cn-bj.ufileos.com/touchbar-emoji-win32-x64.zip)

> `安装版`运行后会安装并创建桌面快捷方式，下次启动直接运行桌面上的快捷方式。
