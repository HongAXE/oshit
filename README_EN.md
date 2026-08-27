<p align="center">
  <a href="https://hongaxe.github.io/oshit"><img src="https://hongaxe.github.io/oshit/static/image/oshit.png" width="100" height="100" alt="oshit!"></a>
</p>
<div align="center">

# oshit!

_Stamina Practice_

</div>


## Introduction

A mini-game: oshit!

[Chinese](README.md)
|
[HongAX](https://github.com/HongAXE)
|
[Live Demo](https://hongaxe.github.io/oshit)
|
[GitHub Pages](https://github.com/HongAXE/oshit)

## Credits

This project is a modified version of "Eat Kano", a web mini-game originally developed by Xingye.  
oshit! is a modified version with UI adjustments and parameter tweaks by HongAX, and also includes an offline Android app build.

[Original Repository](https://github.com/arcxingye/EatKano)
|
[Eat Kano Live](https://xingye.me/game/eatkano/)

[Xingye's GitHub](https://github.com/arcxingye/)
|
[Xingye's Notebook](https://xingye.me)

## Requirements
+ MySQL 5+
+ PHP 5+

## Download & Install
There are two ways to download oshit!:
 
[GitHub Release](https://github.com/HongAXE/oshit/releases/)
|
[蓝奏云(password：hong)](https://wwamp.lanzouu.com/iCVya44wdocf)

Currently supports **Android 5.0+** only.

Already available on Taptap:[oshit!](https://www.taptap.cn/app/919451)
## How to Use

> Note: If you just want to play the game, head to the live demo link above.  
> The following instructions are for creating your own modified version.

### GitHub Pages

Watch the video tutorial [here](https://www.bilibili.com/video/BV1r94y1d765) (Chinese).

To customize the text displayed in the game, follow these steps:

1. **Fork this repository** — do not edit directly on this page, as you won't be able to save changes.

2. **Open your forked repository**, locate `static/i18n/zh.json`, and find the following configuration keys:

   ```json
   {
     "game-title": "oshit!",
     "game-intro1": "Your hands are built for rhythm games",
     "game-intro2": "not for wasting your life",
     "text-level-1": "Useless",
     "text-level-2": "Noob",
     "text-level-3": "Decent",
     "text-level-4": "Impressive",
     "text-level-5": "Legendary"
   }
   ```

You can freely change the text on the right side — just don't delete the double quotes.

3. Navigate to the static/image folder:
   · The pre-click image is ClickBefore.png
   · The post-click image is ClickAfter.png
        Replace them with your own images.
        Note: PNG format is required.
4. Navigate to the static/music folder:
   · tap.mp3 – sound on correct click
   · end.mp3 – sound on game over (normal)
   · err.mp3 – sound on wrong click
        Replace them with your own audio files.
        Note: MP3 format is required.
5. After making changes, go to your project's Settings → Pages → Source, select the main branch, and click Save.

Miscellaneous

Don't forget to leave a star ⭐ — Pull requests are always welcome!

```