---
title: 自动化检测CSRF(第二篇)
date: 2016-06-23 23:49:34
url: p/automated-detection-of-CSRF-second-part
tags: ['Web Security', 'CSRF']
description: "使用浏览器插件做到自动检测CSRF漏洞"
aliases: ['/2016/06/23/automated-detection-of-CSRF-second-part/']
---

#### 0x00 前言：
***
上一篇只是大致说明整个思路和流程。本篇就详细说说如何检测CSRF。为什么不在上一篇中放出插件呢。是因为误报率确实是比较多，而且无法检测Referer。而本章，重点就说明“如何检测对方是否开启了Referer检测机制”。在我的认知范围内，这是首款检测Referer的工具(不知廉耻的笑了)。今天发现腾讯在2013年就做了类似的[产品](https://security.tencent.com/index.php/blog/msg/24) (这就尴尬了..)，不过还好。而且思路和实现方法有所区别。本章说检测Referer，第三章说检测token机制的强化,让检测token的成功率达到80~90%以上(其实就是写第二篇的时候，忘记写了。推到第三章了....)。而且这些是腾讯产品所没有的撒。

#### 0x01一些小的变化：
***
之前的黑白名单列表
```javascript
var placeholderFilterKeyword = ['跳','搜','查','找','登陆','注册','search'];  //无用表单黑名单，用于验证这个form表单有没有用（针对input验证）
var actionFilterKeyword = ['search','find','login','reg'];   //无用表单黑名单，用于验证这个form表单有没有用（针对form表单验证）
}
```
现在的黑白名单列表：
```javascript
var placeholderFilterKeyword = ['跳','搜','查','找','登陆','注册','search'];
var actionFilterKeyword = ['search','find','login','reg',"baidu.com","google.com","so.com","bing.com","soso.com","sogou.com"];
```
此处的代码，决定了整体插件检测时的误报率大体走向。你也可以自己修改来达到自我感觉不错的地步。

现在的初始化变量：
```javascript
var actionCache,actionPath;
var actionvParameter = "";
var ajaxParameter = "";
```

#### 0x02：插件的整体框架
***
因为Maxthon浏览器的API实在是太少，没有这些API我无法进行Referer检测，于是，检测CSRF插件，就不写Maxthon的插件了，下面是Chrome插件的框架：

![](/images/automated-detection-of-CSRF-second-part/1.png)

>icons 是存放插件图标的地方，我比较懒，直接使用AutoFindXSS插件的图标。

>background.html 是为了让我们修改插件的作用域，让我们可控，可以在Chrome的API中使用`jquery插件`

>background.js 这里我们把它理解为后端程序，类似于服务端的存在。用于处理`base.js`文件的数据

>base.js 会在网站加载完成后调用。在`检测Referer`的时候，把数据传给`background.js`文件

>manifest.json Chrome插件的核心文件，用于配置插件参数。

这里我先给大家看一下manifest.json文件的内容：
```json
{
  "background": {
    "page": "background.html",
    "persistent": true
  },
  "name": "AutoFindCSRF",
  "version": "1.0.0",
  "manifest_version": 2,
  "description": "CSRF[by:Black-Hole&158099591@qq.com]",
  "content_security_policy": "script-src 'self' 'unsafe-eval'; object-src 'self'",
  "permissions": [
    "<all_urls>","tabs"
  ],
  "icons":{"16": "icons/icon_16.png","48": "icons/icon_48.png","128": "icons/icon_128.png"},
  "content_scripts": [{
    "matches": ["*://*/*"],
    "js": ["jquery.js","base.js"],
    "run_at": "document_end"
  }]
}
```
>content_security_policy 简称CSP，用户限制插件的安全性

>permissions 是插件向Chrome申请的权限。

>content_scripts 意思是，在任何协议下，当网站加载完成后，都会运行jquery.js和base.js文件。JavaScript this指向的是当前网页

>background JavaScript this指向的是插件，用户处理base.js和background.js通信的存在

而[上一篇文章](http://www.freebuf.com/articles/web/107207.html)的JavaScript代码，都存放在base.js里，待会说“检测Referer机制”时，也是写在这个文件里。

#### 0x03：检测对方是否开启了Referer检测机制
***
首先为了下面程序的简洁，先把当前表单的action地址赋值给一个变量：
`actionCache = formDom.attr("action");`

然后匹配action地址。为什么要匹配action地址呢，因为action分为以下几种情况：
>\#test

>./test.php && ./test(处理方式一样)

>/test.php?a=11

>test.php

>http://baidu.com/?s=

这里我们使用switch来实现匹配，代码如下：
```javascript
switch(actionCache[0]){
    case "#":
        actionPath = location.href + actionCache;
        break;
    case "/":
        actionPath = location.origin + actionCache;
        break;
    case ".":
        if(actionCache.indexOf("?") != "-1"){
            actionvParameter = "?" + actionCache.split("?")[1];
            actionCache = actionCache.slice(0,actionCache.indexOf("?"));
        }
        if(location.href.split("/").pop().split(".").length == 1){
            actionPath = location.href + actionCache.substr(1,actionCache.length-1) + actionvParameter;
        }else{
            actionPath = location.href.substr(location.href,location.href.lastIndexOf(location.href.split("/").pop())) + actionCache.substring(1,actionCache.length) + actionvParameter;
        }
        break;
    default:
        if(location.protocol == "http:" || location.protocol == "https:"){
            actionPath = location.href;
            break;
        }
        if(location.href.split("/").pop().split(".").length == 1){
            actionPath = location.href + "/" + actionCache;
        }else{
            actionPath = location.href.substr(location.href,location.href.lastIndexOf(location.href.split("/").pop())) + actionCache;
        }
        break;
}
```
当action地址的第一个值是`#`时，直接使用`location.href + actionCache;`拼接。

当action地址的第一个值是`/`时，使用`location.origin + actionCache;`来进行拼接

当action地址的第一个值是`.`时：
先使用indexOf函数来把参数赋值给一个变量并去除，
```javascript
if(actionCache.indexOf("?") != "-1"){
    actionvParameter = "?" + actionCache.split("?")[1];
    actionCache = actionCache.slice(0,actionCache.indexOf("?"));
}
```
详细的情况如下：

![](/images/automated-detection-of-CSRF-second-part/2.png)

然后根据有无后缀进行匹配：
```JavaScript
if(location.href.split("/").pop().split(".").length == 1){
    actionPath = location.href + actionCache.substr(1,actionCache.length-1) + actionvParameter;
}else{
    actionPath = location.href.substr(location.href,location.href.lastIndexOf(location.href.split("/").pop())) + actionCache.substring(1,actionCache.length) + actionvParameter;
}
```
`location.href.split("/").pop().split(".").length`是检测`当前url`有无后缀，如果有那么长度是为2.如果没有后缀长度是1。如果没有参数，将不会加任何字符串，因为在初始变量的时候就已经设为空了。详情如下：

![](/images/automated-detection-of-CSRF-second-part/3.png)

![](/images/automated-detection-of-CSRF-second-part/4.png)

除去这些之外，还有直接是文件名或者直接是url，这里呢，我直接写到switch的default分之上去了，因为无法使用`actionCache[0]`来匹配，代码如下：
```javascript
default:
    if(location.protocol == "http:" || location.protocol == "https:"){
        actionPath = location.href;
        break;
    }
    if(location.href.split("/").pop().split(".").length == 1){
        actionPath = location.href + "/" + actionCache;
    }else{
        actionPath = location.href.substr(location.href,location.href.lastIndexOf(location.href.split("/").pop())) + actionCache;
    }
    break;
```
首先是判断`location.protocol`是否为http或https协议。如果是的话，直接使用`location.href;`。当不为http://或者https://的时候，跳过此if判断。接下来就是判断url的后缀存在。如果存在将运行：`actionPath = location.href + "/" + actionCache;`，反馈如图：

![](/images/automated-detection-of-CSRF-second-part/5.png)

当存在后缀时，运行：`actionPath = location.href.substr(location.href,location.href.lastIndexOf(location.href.split("/").pop())) + actionCache;`。反馈如图：

![](/images/automated-detection-of-CSRF-second-part/6.png)

#### 0x04：模拟form的参数
***
代码如下：
```javascript
for(var v = 0;v < formDom.find(":text").length;v++){
    var input = formDom.find(":text").eq(v);
    if(input.attr("name") != ""){
        if(input.val() == ""){
            ajaxParameter += input.attr("name") + "=" + "15874583485&";
        }else{
            ajaxParameter += input.attr("name") + "=" + input.val() + "&";
        }
    }else{
        continue;
    }
}
ajaxParameter = ajaxParameter.substring(0,ajaxParameter.length-1);
```
使用for循环对当前form表单下属性为text的input标签，然后使用`var input = formDom.find(":text").eq(v);`来进行赋值，把当前的input赋值给input变量。

再使用if判断，当前的input标签是否存在name属性，如果没有，则使用`continue;`跳出初始化表达式变量为v的本次循环。如果存在，再判断当前的input的value属性里是否有值，如果有值则直接赋值给ajaxParameter。代码：`ajaxParameter += input.attr("name") + "=" + input.val() + "&";`，如果不存在则把`15874583485`赋值给ajaxParameter变量，为什么要使用类似于手机号码的呢，因为容错率挺高的。可以看到我在每次赋值的时候，都会在后面加上&字符。因为方便下面发送ajax。当然需要去掉最后一个&。于是乎，有了下面的代码：`ajaxParameter = ajaxParameter.substring(0,ajaxParameter.length-1);`。

#### 0x04：与插件的background.js进行通信
***
这里呢，我先说说“检测Referer的思路”，在当前网站发送一次ajax请求，Referer的地址肯定是当前的URL，是正常的，和普通提交form表单是一样的，这里呢，把action地址和method值及参数传给插件，在插件里再发送一次AJAX请求，chrome插件发送AJAX时，Refere是为空的。两次提交，如果存在Referer检测，那么返回的结果长度肯定是不一样的，如果不存在Referer检测，长度是一样的（当然可能存在个别的差异，因为可能要显示时间等，结果长度不一样，但是是不存在“Referer检测”的，下面会增加容错率）

Chrome对插件通信提供了发送`chrome.runtime.sendMessage`和接受`chrome.runtime.onMessage.addListener`的API。
首先让我们来看看base.js文件里的发送`chrome.runtime.sendMessage`API代码:
```javascript
$.ajax({
    url: actionPath,
    type: (formDom.attr("method") == undefined) || (formDom.attr("method") == 'get')?'get':'post',
    dataType: 'html',
    data: (formDom.attr("method") == undefined) || (formDom.attr("method") == 'get')?'':ajaxParameter,
    async: false,
})
.done(function(data){
    var firstAjax = data.length;
    var formCache = formDom;
    chrome.runtime.sendMessage({action: actionPath, parameter: (formDom.attr("method") == undefined) || (formDom.attr("method") == 'get')?'':ajaxParameter},function (response) {
        if(Math.abs(firstAjax - response.status) < 10){
            formCache.attr("style","border: 1px red solid;")
        }
    });
})
```
因为form的method属性的值是不确定的。所以就需要对ajax的参数type进行设置：`(formDom.attr("method") == undefined) || (formDom.attr("method") == 'get')?'get':'post'`，这里使用了三目运算符。当method的值不存在、为get的时候，type为get。当存在的时候，则为post。

下面的data参数同理。只不过没有了get、post选项。改为`'':ajaxParameter`。因为method值为get时，参数是附在actionPath变量里的。当为post的时候，将把之前拼接的参数传给data参数。这里计算一下返回页面的长度`var firstAjax = data.length;`，至于下面的为什么要给变量再赋值一次呢，我也不知道，可能下面的Chrome API的作用域不同，导致在下面使用API的时候，使用formDom变量，结果不对。只能重新赋值给formCache变量，这个时候API才算正常。

下面就是Chrome的API了：
```javascript
chrome.runtime.sendMessage({action: actionPath, parameter: (formDom.attr("method") == undefined) || (formDom.attr("method") == 'get')?'':ajaxParameter},function (response) {
        if(Math.abs(firstAjax - response.status) < 10){
            formCache.attr("style","border: 1px red solid;")
        }
    });
```
这里的action和parameter是发送的参数及值。至于代码`(formDom.attr("method") == undefined) || (formDom.attr("method") == 'get')?'':ajaxParameter`和上面同理，当为get的时候，不给parameter值，当为post的时候，值为ajaxParameter。`response`为回调函数，类似ajax的done函数，返回background.js的处理结果。

那background.js是如何处理的呢：
```JavaScript
chrome.runtime.onMessage.addListener(function(message,sender,sendResponse){
    $.ajax({
        url: message.action,
        type: (message.parameter == "")?'get':'post',
        dataType: 'html',
        data: (message.parameter == "")?'':message.parameter,
        async: false,
    })
    .done(function(data) {
        sendResponse({status: data.length})
    })
})
```
`chrome.runtime.onMessage.addListener`是接受函数，然后就是AJAX了，在done函数里，有一个API是`sendResponse({status: data.length})`返回插件发送AJAX时的长度。这个时候前端base.js将会受到background.js文件的返回结果。代码就返回上面的处理方式了：
```javascript
if(Math.abs(firstAjax - response.status) < 10){
    formCache.attr("style","border: 1px red solid;")
}
```
这里的Math.abs是求绝对值的，当两次ajax返回的长度差值小于10的时候，说明不存在“Referer检测”，当大于10时，就说明存在“检测Referer的机制”了。这里的10就是`容错值`。

当存在CSRF漏洞的时候，会在form表单的外部包含一个红色的框，如图：

![](/images/automated-detection-of-CSRF-second-part/7.png)
