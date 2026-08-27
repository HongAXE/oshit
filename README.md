<p align="center">
  <a href="https://hongaxe.github.io/oshit"><img src="https://hongaxe.github.io/oshit/static/image/oshit.png" width="100" height="100" alt="oshit!"></a>
</p>
<div align="center">

# oshit!

_底力练习_

</div>


## 简介

小游戏：oshit!

[English](README_EN.md)
|
[HongAX](https://github.com/HongAXE)
|
[线上版本](https://hongaxe.github.io/oshit)
|
[Github Pages](https://github.com/HongAXE/oshit)

## 声明

源项目是由星夜大佬开发的网页小游戏吃掉小鹿乃，oshit!是由HongAX修改了UI和参数，并制作了离线APP的魔改版。

[源项目仓库](https://github.com/arcxingye/EatKano)
|
[吃掉小鹿乃](https://xingye.me/game/eatkano/)

[星夜GitHub](https://github.com/arcxingye/)
|
[星夜笔记本](https://xingye.me)

## 版本需求
+ MySQL 5+
+ PHP 5+

## 下载安装
在页面最下方的Release部分可以下载离线版。

目前只支持Android 5.0+

己上架Taptap [oshit!](https://www.taptap.cn/app/919451)

## 使用方法

注: 如果你想玩的话直接去玩就可以, 这里是如何制造你的改版

### Github Pages

点 [这里](https://www.bilibili.com/video/BV1r94y1d765) 看视频步骤

按照如下方法更改你想要显示的文字

1. **Fork本项目,不要在现在这个页面直接改,然后发现改不了.**

2. **打开你Fork的项目**, 找到`static/i18n/zh.json`, 找到下面这几项配置

   ```json
   {
     "game-title": "oshit!",
     "game-intro1": "你的手是为音游服务的",
     "game-intro2": "而不是为了你的一生",
     "text-level-1": "废物",
     "text-level-2": "菜比",
     "text-level-3": "尚可",
     "text-level-4": "拜谢",
     "text-level-5": "龙比"
   }
   ```

   你可以随意更改右侧文字, 就可以显示你想要的内容 **不要删掉双引号**

3. 找到`static/image`文件夹, 点击前显示的图片是`ClickBefore.png`, 点击后的图片是`ClickAfter.png`, 把他们改成你想要的即可.

    **注意文件格式, 需要是png**

4. 找到`static/music`文件夹, 点击时的音效是`tap.mp3`, 正常结束的音效是`end.mp3`, 点击错误的音效是`err.mp3`, 把他们改成你想要的即可.

   **注意文件格式, 需要是mp3**

5. 更改完毕后前往项目的`Settings` -> `Pages` -> `Source`, 选择`main` 分支然后点击`Save`.

## 其它事项

点下star吧~ 欢迎pr代码
