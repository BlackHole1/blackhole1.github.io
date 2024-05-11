---
title: 基于URLProtocol攻击的一些想法
date: 2017-03-26 16:33:52
url: p/some-ideas-based-on-URLProtocol-attacks
tags: ['Web Security', 'JavaScript']
description: "基于URLProtocol协议的一些攻击手法的想法"
aliases: ['/2017/03/26/some-ideas-based-on-URLProtocol-attacks/']
---

浏览器调起本地应用的原理是`URLProtocol`技术，详情可以在

1. http://www.cnblogs.com/wang726zq/archive/2012/12/11/UrlProtocol.html
2. http://blog.csdn.net/zssureqh/article/details/25828683

里查看。

其中 在注册表的 `[HKEY_CLASSES_ROOT]`主键下，我们可以看到很多的`URLProtocol`。

比如阿里旺旺的：

![](/images/some-ideas-based-on-URLProtocol-attacks/1.png)

而阿里旺旺在网页端的`和我联系`按钮，是跳转到`https://amos.alicdn.com/getcid.aw?v=3&groupid=0&s=1&charset=utf-8&uid=淘宝店铺名&site=cntaobao&groupid=0&s=1&fromid=cntaobao淘宝用户名`链接的，而这个页面调用了下面的javascript代码：

```javascript
!function() {
    var a = window,
    b = function() {
        try {
            window.open("", "_top"),
            a.opener = null,
            a.close()
        } catch(b) {}
    },
    c = function() {
        a.location.href = "aliim:sendmsg?touid=" + a.site + a.touid + "&site=" + a.site + "&status=1",
        setTimeout(function() {
            b()
        },
        6e3)
    };
    a.isInstalled ? a.isInstalled(function(b) {
        if (b) c();
        else {
            var d = confirm("\u68c0\u6d4b\u5230\u4f60\u672a\u5b89\u88c5\u963f\u91cc\u65fa\u65fa\u5ba2\u6237\u7aef,\u662f\u5426\u8981\u8df3\u8f6c\u5230\u5b98\u7f51\u4e0b\u8f7d?");
            d === !0 && (a.location.href = "https://wangwang.taobao.com")
        }
    }) : c()
} ();
```

其中最核心的代码就是`a.location.href = "aliim:sendmsg?touid=" + a.site + a.touid + "&site=" + a.site + "&status=1"`代码，而这段代码的aliim就是在注册表的 `[HKEY_CLASSES_ROOT]`主键下的阿里旺旺主键名。

在上面的图中，我们可以看到当打开时，调用了`"D:\Program Files (x86)\AliWangWang\8.60.03C\wwcmd.exe" %1`命令，wwcmd.exe就是阿里旺旺处理网页端信息的API接口，当处理成功时，就会调起回话窗口。%1就是`sendmsg?touid=" + a.site + a.touid + "&site=" + a.site + "&status=1"`这段参数。让我们替换下WWCmd.exe。看下是如何传递参数的：

```cpp
 #include<stdio.h>
 int main(int argc,char **argv) {
      FILE *fp = fopen("c:/123.txt","w+");
      if(NULL == fp)
          return -1;
      while(argc-->0){
          fputs(*++argv,fp);
          fputs(" ",fp);
      }
      return 0;
  }
```
这段C语言代码是会把后面的参数另存为c盘下的123.txt文件，替换掉WWCmd.exe后，点击`和我联系`，C盘下存在了一个123.txt文件

![](/images/some-ideas-based-on-URLProtocol-attacks/2.png)

发现，把`aliim:`也传递进去了，按照这个请求的话，我们可以构造一个exe程序，来进行接收参数了。个人能力有限，说说大体的思路吧。

exe程序替换掉原有的`WWCmd.exe`程序，然后来生成特定的插件，植入到浏览器里，然后用户每打开一个网站都会从服务器端接收一个特定的base64编码后的shell代码。然后执行`aliim:cmd=服务端的base64`，然后运行。当参数为`sendmsg`时，调起阿里旺旺，当为`cmd`时执行代码。这样的话，木马的隐藏及唤醒条件都达到了。同理迅雷下载等也都可以。

好处是在哪呢，一般来说浏览器调起阿里旺旺、迅雷等应用都会弹窗，但是一般用户都会点击 不在提示。这样的话，目标就打成了。

这只是一个思路，不太成熟。欢迎大家补充。

