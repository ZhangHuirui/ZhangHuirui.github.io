---
layout:     post
title:      "Prometheus"
subtitle:   "Prometheus"
date:       2019-06-19 12:00:00
author:     "Zhang huirui"
header-img: "img/post-bg-nextgen-web-pwa.jpg"
header-mask: 0.3
catalog:    true
tags:
    - 监控
    - 报警
---

> Prometheus 是一款开源的系统监控和报警套件。它可以通过 Pull 或 Push 采集被监控系统的监控项，存入自身的时序数据库中。并且通过丰富的多维数据查询语言，满足用户的不同数据展示需求。

## Prometheus

Prometheus 是一款开源的系统监控和报警套件。它可以通过 Pull 或 Push 采集被监控系统的监控项，存入自身的时序数据库中。并且通过丰富的多维数据查询语言，满足用户的不同数据展示需求。

## 监控架构

整个监控架构如下图所示：

![](https://github.com/apache/incubator-doris/raw/master/docs/resources/monitor_arch.png)

1. 黄色部分为 Prometheus 相关组件。Prometheus Server 为 Prometheus 的主进程，目前 Prometheus 通过 Pull 的方式访问 Doris 节点的监控接口，然后将时序数据存入时序数据库 TSDB 中（TSDB 包含在 Prometheus 进程中，无需单独部署）。Prometheus 也支持通过搭建  [Push Gateway](https://github.com/prometheus/pushgateway)  的方式，允许被监控系统将监控数据通过 Push 的方式推到 Push Gateway, 再由 Prometheus Server 通过 Pull 的方式从 Push Gateway 中获取数据。
2. [Alert Manager](https://github.com/prometheus/alertmanager)  为 Prometheus 报警组件，需单独部署（暂不提供方案，可参照官方文档自行搭建）。通过 Alert Manager，用户可以配置报警策略，接收邮件、短信等报警。
3. 绿色部分为 Grafana 相关组件。Grafana Server 为 Grafana 的主进程。启动后，用户可以通过 Web 页面对 Grafana 进行配置，包括数据源的设置、用户设置、Dashboard 绘制等。这里也是最终用户查看监控数据的地方。
