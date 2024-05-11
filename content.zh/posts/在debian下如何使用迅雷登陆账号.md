---
title: 在debian下如何使用迅雷登陆账号
date: 2016-08-24 13:08:47
url: p/how-to-use-thunder-login-account-under-debian
tags: ['Linux']
description: "使用wine在Linux打开迅雷时，是无法进行登陆的，这里使用wireshark来解决这个问题"
aliases: ['/2016/08/24/how-to-use-thunder-login-account-under-debian/']
---

## 前言：

今天在QQ空间看到有人分享了“惊天魔盗团2”的电影资源

![](/images/how-to-use-thunder-login-account-under-debian/1.png)

正好这几天被mongoose搞的有点烦，想看会电影放松一下心情，但是代码还是要写的，于是我想把电影下载下来，然后等bug解决了，再看。所以问题来了。

## 下载迅雷：

可能是我们这边地区的问题，在迅雷官网下载的迅雷都很慢，于是使用“百度管家”下载。[fuck me down XunLei](http://112.29.142.181/sw.bos.baidu.com/sw-search-sp/software/66cfb7c33b400/Thunder_9.0.12.332_baidu.exe)

## 环境搭建：

就是用wine来使用exe程序，这里不介绍，请自己百度

## 安装注意事项：

不要使用`sudo wine Thunder_9.0.12.332_baidu.exe`，请使用`wine Thunder_9.0.12.332_baidu.exe`，不然你的迅雷会被安装到root用户下

## 如何启动

迅雷安装好后，会在你的桌面放一个快捷方式。如果没有，请像我这么做：

1. `cd ~/.wine/drive_c/Program\ Files\ \(x86\)/Thunder\ Network/Thunder9/Program/`

2. `wine Thunder.exe`

然后，他就启动成功了。

就像这样：

![](/images/how-to-use-thunder-login-account-under-debian/2.png)

## 为什么会出现黑色的框框呢？

黑色的框框是个浏览器，迅雷自带的XBrowser浏览器。个人猜测是因为dll的问题，等我有时间的时候，我去找台window电脑，看一下这个浏览器以来上面dll。这个浏览器无所谓的，没有他照样下载。

## 登陆

重点来了，点击登陆时，会让你输入账号密码

![](/images/how-to-use-thunder-login-account-under-debian/3.png)

但是你会发现，你输入的字符串没有显示，不用慌，就像linux终端输入密码时一样，其实你输入了，只是不可见而已。然后就可以登陆了。但是有时候会出现让你填写验证码的框。

![](/images/how-to-use-thunder-login-account-under-debian/4.png)

于是你会蛋疼的发现，验证码去吃屎了。所以现在我们就来解决这个问题。先想象一下验证码的特性。当我点击“看不清，换一张”的时候，那么一定会发送一个数据包。然后返回新的验证码数据包，我们只需要截取这个数据就行了。这里我使用wireshark来进行抓包。

debian安装wireshark，需要添加kali的源，然后`sudo apt-get update&&sudo apt-get install wireshark`就行了。记得使用`sudo wireshark`来运行

![](/images/how-to-use-thunder-login-account-under-debian/5.png)

我这里的网卡是wlan0，有可能不一样，选一个你觉得是对的就行了。

然后你就看到很多的数据包

![](/images/how-to-use-thunder-login-account-under-debian/6.png)

这个时候我们在Filter里填写`http&& http contains "image/jpeg"`

然后打开迅雷，登陆。当出现验证码验证的时候再次切换到wireshark看就行了。

![](/images/how-to-use-thunder-login-account-under-debian/7.png)

选中（就是让它的背景色变成蓝色，单击）

然后File->Export Objects->HTTP

![](/images/how-to-use-thunder-login-account-under-debian/8.png)

选中地址是`verify2.xunlei.com`且Content Type为`image/jpeg`选中后，点击另存为xx.jpg。

![](/images/how-to-use-thunder-login-account-under-debian/9.png)

![](/images/how-to-use-thunder-login-account-under-debian/10.png)

![](/images/how-to-use-thunder-login-account-under-debian/11.png)

拿验证码登陆就行了。
