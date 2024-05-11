---
title: 在vmware里运行qcow2镜像
date: 2018-01-23 09:12:31
url: p/run-qcow2-image-in-vmware
tags: ['Virtualization']
description: "使用qemu-img把qcow2转化为vmdk格式"
aliases: ['/2018/01/23/run-qcow2-image-in-vmware/']
---

# 前言

因为一些原因，需要在自己的笔记本上运行qcow2镜像。做个OpenStack平台吧，系统配置吃不消。想试一下能不能在vmware里直接跑qcow2镜像。网上的答案都是使用`qemu-img`工具进行转化，但是都后面也就没有说明了。于是自己折腾了一下，把过程记录一下。

# 准备

需要先下载`qemu-img`工具，因为我是在windows64位上，所以就下载了[win64的镜像](https://qemu.weilnetz.de/w64/)，工具安装好后，最好在环境变量里的`PATH`里加入下一安装目录，方便后面的操作

Vmware虚拟机、qcow2原始镜像包就不说了，必备的。

# 流程

首先使用`qemu-img`工具，把qcow2的镜像转化成vmdk格式的：

```bash
$ qemu-img convert -f qcow2 CentOS_7.2_x86_64_XD.qcow2 -O vmdk Centos.vmdk
```

然后会在根目录出现Centos.vmdk镜像，但是无法导入，因为没有vmx文件。导入到Vmware里会报错。

所以，我们先使用VMware建立一个空的虚拟机，系统因你的qcow2进行选择，因为我是Centos7。我这里选择的是Centos 7 64位系统。

创建好了之后，进入`Virtual Machines`目录下的你刚刚创建虚拟机的目录，把vmdk文件删除，用之间`qemu-img`转化后的文件，覆盖过去，启动Vmware就成功了。

下面是演示视频：

<iframe width="560" height="315" src="https://www.youtube.com/embed/GE1dkDgRSPA" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
