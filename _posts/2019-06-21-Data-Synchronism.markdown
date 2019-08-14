---
layout:     post
title:      "数据同步"
subtitle:   "数据同步"
date:       2019-06-18 12:00:00
author:     "Zhang huirui"
header-img: "img/post-bg-nextgen-web-pwa.jpg"
header-mask: 0.3
catalog:    true
tags:
    - 数据同步
---

> 数据同步

## 数据同步

#### 实时增量



##### Kafka-connector

Confluent Platform

![confluentPlatform](../img/confluentPlatform.png)

由confluence公司围绕kafka开发的一款数据异构组件，社区也支持了不少插件来充实异构功能，本身思想就是以log形式做流式数据，而kafka随着版本升级，在性能、可靠性、安全性上有很大提升

优点：source / sink也是完全解耦的，可以随时更新source和sink，而且本身支持offset记录，对于数据恢复和可靠性保障也不错，source端也不会担心阻塞带来的流量峰值，对source影响较小，对balance支持对也非常不错

缺点：对于一组数据同步多增加一次网络IO；由于是共享集群是同步数据，对磁盘要求不高，但是对cpu要求较高，理论上随着集群对扩容会增加同步能力，但也不排除性能上可能会有所限制的可能，当然如果分不同的集群也是可以；如果是kafka的数据同步到hdfs，从一组kafka又走了一组kafka，而且本身利用kafka-connect就会限制kafka的版本，公司目前使用0.8.2.1+的版本，而connect版本至少在0.9以上，从classloader上也不容易解决；从架构上来看，增加了kafka集群，kafka集群的稳定性会增加同步性能的因素

[https://github.com/confluentinc](https://github.com/confluentinc)

##### Apache Flume

轻量级的数据传输工具，除了source/sink ，增加了fliter，可以利用filter做数据清洗，安全校验等，也支持多层传输，如聚合数据等，channel支持事务

优点：只要配置好了source / sink，就建立起数据源之间对通道

缺点：source 和 sink 相互都有影响，如：source 太快 或者sink较慢或者sink不稳定等，都容易导致flume进程挂掉；channel 内存级别、文件、kafkachannel数据可靠性上逐渐增强；source /sink在同一classLoader中，容易产生冲突，不过有些公司针对冲突问题用多classLoader解决；

因source sink在同一个agent 进程中，对于source 和 sink的上下线不够灵活，未解耦合；

可能存在一个 source 对应多个 sink的情况，如果都放在一个进程中都话，有相互影响

[http://flume.apache.org/](http://flume.apache.org/)

##### DataLink

DataLink是一个满足各种异构数据源之间的实时增量同步，分布式、可扩展的数据交换平台。

[https://github.com/ucarGroup/DataLink](https://github.com/ucarGroup/DataLink)

##### FileBeat

Filebeat是一个日志文件托运工具，在你的服务器上安装客户端后，filebeat会监控日志目录或者指定的日志文件，追踪读取这些文件（追踪文件的变化，不停的读），并且转发这些信息到elasticsearch或者logstarsh中存放。

##### DataPipeLine

目前datapipeline作为商业化产品出现，主要也是解决各种数据源，是以kafka-connector作为内核开发的，在kafka-connector定制化了基于mysql-binlog等日志方式的实时数据流同步，在同步周边加入了元数据管理可视化管理数据，和相关同步监控，目前如果接入公司同步还需要定制化开发相关的数据同步插件

[产品功能介绍](https://www.datapipeline.com/product)

[产品操作手册](http://manual.datapipeline.com/443750)

优势：已经有这种商业化产品出现，在监控，管理运维上相对容易

劣势：接入应该会成本高些，还需要定制化开发很多组件来满足当前的数据同步需求，业务侵入型高

将来公司产品也将以这种形式出现，方便管理、监控数据同步拓扑结构

#### 离线批量

##### DataX

阿里巴巴开源产品，也是插件化同步数据，任务是一次性的批量的异构，不支持断点续传

##### Camus

目前基于partition offset区间，通过map的方式dump数据，公司内部开发了相关的 序列化 / 反序列化 插件

##### Gobblin



### 数据异构

在任何一个互联网应用甚至传统行业应用中，为满足不同场景下都数据需求，存在不同的数据源，这些数据源可能是关系型数据库mysql、oracle；也有非关系型数据库nosql 如 hbase Tikv，甚至一些数据日志等，为了将这些数据应用到各个数据源下，业务方可能会双写数据，或者提供数据服务，将自己维护到数据以接口的方式提供给使用方，又甚至通过离线dump的方式进行数据源的转变，也有可能在数据源转变过程中存在数据清洗，数据转化等过程的发生。这些数据源的转化后，数据使用方基本上使用相同的数据源类型来处理数据，无论是通过sql方式又或是程序的rdd编程方式，再或是业务数据的函数式完成定义的输入输出。

那么，通过这样简答的分析，我们可以将这种数据源转换为一种抽象思维，在去除掉业务逻辑处理后，我们仅仅将数据源之间的转化称之为数据异构，这种抽象出来的应用可以简化业务方对不同数据源兼容，也不必为了多种数据源数据不一致问题而担心，更能够提高数据处理速度，数据安全上那就完全借助抽象的数据异构来做统一的权限。

我们知道，大部分在线存储，为了提高存储软件本身的写入吞吐量，都逐渐采用预写Log不断合并数据的方式来更改数据，而Log只要打开了一个channel，利用磁盘顺序写方式，减少磁盘寻址开销提高持久化性能。那么我们做数据异构的突破点则就是一靠这种阀做接口适配将数据以日志的方式订阅起来，并将所有的数据无论是关系型数据还是非关系型数据，都映射为统一都数据模型，输出方由我们所定义的配置决定。

数据异构所产生的数据价值有以下几个方面 :

1. 数据同步实时化
2. 异步缓存清理策略
3. 数据迁移
4. 跨机房数据同步
5. 数据变更可以流处理


