---
layout:     post
title:      "Apache Hbase"
subtitle:   "Apache Hbase"
date:       2019-06-18 12:00:00
author:     "Zhang huirui"
header-img: "img/post-bg-nextgen-web-pwa.jpg"
header-mask: 0.3
catalog:    true
tags:
    - HBase
    - NoSQL
    - Hadoop
---

> [Apache](http://www.apache.org/)  HBase™ is the  [Hadoop](http://hadoop.apache.org/)  database, a distributed, scalable, big data store.
> 
> Use Apache HBase™ **when you need random, realtime read/write access to your Big Data**. This project's goal is the hosting of very large tables -- billions of rows X millions of columns -- atop clusters of commodity hardware. Apache HBase is an open-source, distributed, versioned, non-relational database modeled after Google's  [Bigtable: A Distributed Storage System for Structured Data](http://research.google.com/archive/bigtable.html)  by Chang et al. Just as Bigtable leverages the distributed data storage provided by the Google File System, Apache HBase provides Bigtable-like capabilities on top of Hadoop and HDFS.

## Apache Hbase

#### Version

1.x

2.x

#### Data Model

- Table（表）
  
  - rows

- Row（行）
  
  - row key + columns
  
  - Row按照row key字母排序
  
  - row key是不可分割的字节数组。行是按字典排序由低到高存储在表中的。一个空的数组是用来标识表空间的起始或者结尾。

- Column（列）
  
  - column family + column qualifier
  
  - column family:column qualifier

- Column Family（列族）
  
  - 在HBase是*列族*一些列的集合。一个列族所有列成员是有着相同的前缀。比如，列*courses:history*  和  *courses:math*都是 列族  *courses*的成员.冒号(:)是列族的分隔符，用来区分前缀和列名。column 前缀必须是可打印的字符，剩下的部分(称为qualify),可以由任意字节数组组成。列族必须在表建立的时候声明。column就不需要了，随时可以新建。在物理上，一个的列族成员在文件系统上都是存储在一起。因为存储优化都是针对列族级别的，这就意味着，一个colimn family的所有成员的是用相同的方式访问的。

- Column Qualifier（列标识）

- Cell（单元格）
  
  - row + column family + column qualifier + [value] + timestamp
  - A  *{row, column, version}* 元组就是一个HBase中的一个  `cell`。Cell的内容是不可分割的字节数组。

- Timestamp（时间戳）
  
  - 每个值都有一个时间戳，标示版本。默认为RegionServer的时间

##### 逻辑视图

Table `webtable`

| Row Key           | Time Stamp | Column Family  contents    | Column Family anchor          | Column Family people       |
| ----------------- |:---------- | -------------------------- | ----------------------------- | -------------------------- |
| "com.cnn.www"     | t9         |                            | anchor:cnnsi.com = "CNN"      |                            |
| "com.cnn.www"     | t8         |                            | anchor:my.look.ca = "CNN.com" |                            |
| "com.cnn.www"     | t6         | contents:html = "<html>…​" |                               |                            |
| "com.cnn.www"     | t5         | contents:html = "<html>…​" |                               |                            |
| "com.cnn.www"     | t3         | contents:html = "<html>…​" |                               |                            |
| "com.example.www" | t5         | contents:html = "<html>…​" |                               | people:author = "John Doe" |

##### 物理视图

ColumnFamily `anchor`

| Row Key       | Time Stamp | Column Family anchor          |
| ------------- | ---------- | ----------------------------- |
| "com.cnn.www" | t9         | anchor:cnnsi.com = "CNN"      |
| "com.cnn.www" | t8         | anchor:my.look.ca = "CNN.com" |

ColumnFamily `contents`

| Row Key       | Time Stamp | Column Family contents     |
| ------------- | ---------- | -------------------------- |
| "com.cnn.www" | t6         | contents:html = "<html>…​" |
| "com.cnn.www" | t5         | contents:html = "<html>…​" |
| "com.cnn.www" | t3         | contents:html = "<html>…​" |

##### Namespace

namespace命名空间指对一组表的逻辑分组，类似RDBMS中的database

##### 数据模型操作

- Get
  
  - [Get](http://hbase.apache.org/apidocs/org/apache/hadoop/hbase/client/Get.html)  返回特定行的属性。 Gets 通过  [HTable.get](http://hbase.apache.org/apidocs/org/apache/hadoop/hbase/client/HTable.html#get%28org.apache.hadoop.hbase.client.Get%29)  执行。

- Put
  
  - [Put](http://hbase.apache.org/apidocs/org/apache/hadoop/hbase/client/Put.html)  要么向表增加新行 (如果key是新的) 或更新行 (如果key已经存在)。 Puts 通过  [HTable.put](http://hbase.apache.org/apidocs/org/apache/hadoop/hbase/client/HTable.html#put%28org.apache.hadoop.hbase.client.Put%29)  (writeBuffer) 或  [HTable.batch](http://hbase.apache.org/apidocs/org/apache/hadoop/hbase/client/HTable.html#batch%28java.util.List%29)  (non-writeBuffer)执行。

- Scan
  
  - [Scan](http://hbase.apache.org/apidocs/org/apache/hadoop/hbase/client/Scan.html)  允许多行特定属性迭代。
    
    下面是一个在 HTable 表实例上的示例。 假设表有几行键值为 "row1", "row2", "row3", 还有一些行有键值 "abc1", "abc2", 和 "abc3". 下面的示例展示startRow 和 stopRow 可以应用到一个Scan 实例，以返回"row"打头的行。
    
    ```java
    public static final byte[] CF = "cf".getBytes();
    public static final byte[] ATTR = "attr".getBytes();
    ...
    
    Table table = ...      // instantiate a Table instance
    
    Scan scan = new Scan();
    scan.addColumn(CF, ATTR);
    scan.setRowPrefixFilter(Bytes.toBytes("row"));
    ResultScanner rs = table.getScanner(scan);
    try {
      for (Result r = rs.next(); r != null; r = rs.next()) {
        // process result...
      }
    } finally {
      rs.close();  // always close the ResultScanner!
    }
    ```

- Delete
  
  - [Delete](http://hbase.apache.org/apidocs/org/apache/hadoop/hbase/client/Delete.html)  从表中删除一行. 删除通过[HTable.delete](http://hbase.apache.org/apidocs/org/apache/hadoop/hbase/client/HTable.html#delete%28org.apache.hadoop.hbase.client.Delete%29)  执行。
    
    HBase 没有修改数据的合适方法。所以通过创建名为墓碑(*tombstones*)的新标志进行处理。这些墓碑和死去的值，在主紧缩时清除。

##### Version

一个  *{row, column, version}* 元组是HBase中的一个单元(`cell`).但是有可能会有很多的单元的行和列是相同的，可以使用版本来区分不同的单元.

rows和column key是用字节数组表示的，version则是用一个长整型表示。这个long的值使用  `java.util.Date.getTime()`  或者  `System.currentTimeMillis()`产生的。这就意味着他的含义是“当前时间和1970-01-01 UTC的时间差，单位毫秒。”

在HBase中，版本是按倒序排列的，因此当读取这个文件的时候，最先找到的是最近的版本。

有些人不是很理解HBase单元(`cell`)的意思。一个常见的问题是:

- 如果有多个包含版本写操作同时发起，HBase会保存全部还是会保持最新的一个？目前，只有最新的那个是可以获取到的。

- 可以发起包含版本的写操作，但是他们的版本顺序和操作顺序相反吗?是

###### 存储时指定版本号

###### HBase包含版本的操作

Get/Scan

- 默认情况下，如果你没有指定版本，当你使用`Get`操作的时候，会返回最近版本的Cell(该Cell可能是最新写入的，但不能保证)。

- 如果想要返回返回两个以上的把版本,参见[Get.setMaxVersions()](http://hbase.apache.org/docs/current/api/org/apache/hadoop/hbase/client/Get.html#setMaxVersions())

- 如果想要返回的版本不只是最近的，参见  [Get.setTimeRange()](http://abloz.com/hbase/book.html???)

- 要向查询的最新版本要小于或等于给定的这个值，这就意味着给定的'最近'的值可以是某一个时间点。可以使用0到你想要的时间来设置，还要把max versions设置为1.

Put

- 一个Put操作会给一个`cell`,创建一个版本，默认使用当前时间戳，当然你也可以自己设置时间戳。这就意味着你可以把时间设置在过去或者未来，或者随意使用一个Long值。

- 要想覆盖一个现有的值，就意味着你的row,column和版本必须完全相等。

Delete

- Delete: 删除列的指定版本

- Delete column: 删除列的所有版本

- Delete family: 删除特定列族所有列

- 当删除一行，HBase将内部对每个列族创建墓碑(非每个单独列)。
  
  删除操作的实现是创建一个*墓碑标记*。例如，我们想要删除一个版本，或者默认是`currentTimeMillis`。就意味着“删除比这个版本更早的所有版本”.HBase不会去改那些数据，数据不会立即从文件中删除。他使用删除标记来屏蔽掉这些值。若你知道的版本比数据中的版本晚，就意味着这一行中的所有数据都会被删除。

##### 排序

所有数据模型操作 HBase 返回排序的数据。先是行，再是列族，然后是列修饰(column qualifier), 最后是时间戳(反向排序,所以最新的在前)。

##### 列的元数据

对列族，没有内部的KeyValue之外的元数据保存。这样，HBase不仅在一行中支持很多列，而且支持行之间不同的列。 由你自己负责跟踪列名。

唯一获取列族的完整列名的方法是处理所有行。

##### Joins

HBase是否支持联合是一个网上常问问题。简单来说 : 不支持。至少不想传统RDBMS那样支持(如 SQL中带 equi-joins 或 outer-joins). 正如本章描述的，读数据模型是 Get 和 Scan.

但并不表示等价联合不能在应用程序中支持，只是必须自己做。 两种方法，要么指示要写到HBase的数据，要么查询表并在应用或MapReduce代码中做联合(如 RDBMS所展示,有几种步骤来实现，依赖于表的大小。如 nested loops vs. hash-joins). 哪个更好？依赖于你准备做什么，所以没有一个单一的回答适合所有方面。

##### ACID

#### HBase Meta表

##### Meta表作用

我们知道HBase的表是会分割为多个Region的，不同Region分布到不同RegionServer上。Region 是 HBase中分布式存储和负载均衡的最小单元。

所以当我们从客户端读取，写入数据的时候，我们就需要知道我么数据的 Rowkey是在哪个Region的范围以及我们需要的Region是在哪个RegionServer上。

而这正是HBase Meta表所记录的信息。

##### Mete表的Rowkey

region所在的表名+region的StartKey+时间戳。而这三者的MD5值也是HBase在HDFS上存储的region的名字。

##### Mete表的列族和列

表中最主要的Family：info

info里面包含三个Column：regioninfo, server, serverstartcode。

其中regioninfo就是Region的详细信息，包括StartKey, EndKey 以及每个Family的信息等。server存储的就是管理这个Region的RegionServer的地址。

所以当Region被拆分、合并或者重新分配的时候，都需要来修改这张表的内容。

##### Region的定位

第一次读取： 步骤1：读取ZooKeeper中META表的位置。 步骤2：读取.META表中用户表的位置。 步骤3：读取数据。

如果已经读取过一次，则root表和.META都会缓存到本地，直接去用户表的位置读取数据。

#### HBase HBCK



### 参考文档
