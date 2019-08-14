---
layout:     post
title:      "《大规模分布式存储系统》"
subtitle:   "原理解析与架构实战"
date:       2019-06-22 18:12:00
author:     "Zhang huirui"
header-img: "img/post-bg-nextgen-web-pwa.jpg"
header-mask: 0.3
catalog:    true
tags:
    - 分布式存储系统
---

> Kubernetes

## 大规模分布式存储系统

### 前言

#### 1 分布式存储

`分布式存储系统`是大量普通PC服务器通过Internet互联，对外作为一个整体提供存储服务。

`特性`可扩展、低成本、高性能和易用。

`挑战`数据、状态信息的持久化，要求在自动迁移、自动容错、并发读写的过程中保证数据的一致性。

`涉及技术`

- 数据分布：分布均匀，实现跨服务器读写。

- 一致性：将多个副本复制到多台服务器，并保证副本之间的数据一致性。

- 容错：检测服务器故障，数据和服务迁移。

- 负载均衡：新增服务或正常运行时自动负载均衡，数据迁移时不影响已有服务。

- 事务与并发控制：分布式事务，多版本并发控制。

- 易用性：对外接口易用，监控易用。

- 压缩/解压缩：设计合理的压缩/解压缩算法。

`数据`非结构化数据、结构化数据和半结构化数据。

### 一、基础

#### 2 单机存储系统

`硬件`CPU、IO总线、网络拓扑、存储

`存储引擎`

`哈希存储引擎`

**Bitcask**

- 数据结构：

> 数据（key，value，key_size、value_size、timestamp）
> 
> 内存中的哈希表（key -> file id，value_file_position，value_size，timestamp）
> 
> 磁盘（crc，timestamp，key_size，value_size，key，value）

- 操作：只针对key做操作，只追加，不修改老数据。

- 定期合并（Compaction）：对同一个key的多个操作只保留最新的一个为原则。

- 数据恢复：通过索引文件（hint file，简单来说就是把内存中的哈希索引表转存到磁盘上的文件）来提高重建哈希表的速度。

- 典型：Riak，Beansdb

`B树存储引擎`

- 数据结构：

> 按照页面（Page）来组织数据，每个页面对应B+树的一个节点。其中叶子节点保存每行的完整数据，非叶子节点保存索引信息。数据在节点中有序，从根通过二分查找直到找到叶子节点。所需的页面不在内存中则从磁盘中读取并缓存。修改需要先提交日志，接着修改B+树。页面修改超过一定比率则刷新到磁盘中持久化。

- 操作：随机读写，范围扫描。

- 缓存区管理：LRU（Least Recently Used，最近最少使用）淘汰最长时间没有读写的块、LIRS（）

- 典型：MySQL InnoDB

`LSM（Log-Structured Merge Tree）树存储引擎`

#### 3 分布式存储系统

### 二、范型

#### 4 分布式文件系统

`数据类型`非结构化数据对象，三种类型的数据：Blob（Binary Large Object，二进制大对象）、定长块和大文件。按照块组织数据，块包括多个Blob和块，大文件可分为多个块。

`典型`Facebook Haystack、Taobao File System（TFS）、GFS（Google File System，存储大文件）作为Google Bigtable的底层存储、EBS（Elastic Block Store，弹性块存储）作为Amazon RDS底层存储

#### 5 分布式键值系统

`数据类型`半结构化数据，只提供和键相关的操作。

`典型`Amazon Dynamo、Tabbao Tair、Memcache

#### 6 分布式表格系统

`数据类型`半结构化数据，以表格为单位组织数据。主要针对单张表操作。同一个表中多行数据也不要求包含相同类型的列。

`典型`Google Bigtable、Megastore、Microsoft Azure Table Storage、Amazon DynamoDB

#### 7 分布式数据库

`数据类型`结构化数据，采用二维表组织数据。支持多表查询。

`典型`MySQL数据库分片集群（MySQL Sharding Cluster）、Amazon RDS、Microsoft SQL Azure、Google Spanner、Alibaba OceanBase。

### 三、实战

#### 8 OceanBase架构初探

#### 9 分布式存储引擎

#### 10 数据库功能

#### 11 质量保证、运维及实践

### 四、专题

#### 12 云存储

#### 13 大数据

《大规模分布式存储系统》

《分布式系统原理与范型》
