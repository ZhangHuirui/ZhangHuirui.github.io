---
layout:     post
title:      "Apache Druid"
subtitle:   "druid"
date:       2019-06-18 12:00:00
author:     "Zhang huirui"
header-img: "img/post-bg-nextgen-web-pwa.jpg"
header-mask: 0.3
catalog:    true
tags:
    - druid
    - olap
---

> Apache Druid is a data store designed for high-performance slice-and-dice analytics ("[OLAP](http://en.wikipedia.org/wiki/Online_analytical_processing)"-style) on large data sets. Druid is most often used as a data store for powering GUI analytical applications, or as a backend for highly-concurrent APIs that need fast aggregations.

## Apache Druid

### 一、版本

- 0.14.2

### 二、开始

#### 1、简介

Apache Druid (incubating) is a data store designed for high-performance slice-and-dice analytics ("[OLAP](http://en.wikipedia.org/wiki/Online_analytical_processing)"-style) on large data sets. Druid is most often used as a data store for powering GUI analytical applications, or as a backend for highly-concurrent APIs that need fast aggregations. 

#### 2、用途

Common application areas for Druid include:

- Clickstream analytics
- Network flow analytics
- Server metrics storage
- Application performance metrics
- Digital marketing analytics
- Business intelligence / OLAP

#### 3、特性

Druid关键特性：

1. **列式存储格式**  Druid uses column-oriented storage, meaning it only needs to load the exact columns needed for a particular query. This gives a huge speed boost to queries that only hit a few columns. In addition, each column is stored optimized for its particular data type, which supports fast scans and aggregations.
2. **可扩展的分布式文件系统**  Druid is typically deployed in clusters of tens to hundreds of servers, and can offer ingest rates of millions of records/sec, retention of trillions of records, and query latencies of sub-second to a few seconds.
3. **大规模并行处理(Massively parallel processing，MPP)**  Druid can process a query in parallel across the entire cluster.
4. **实时或批量数据导入**  Druid can ingest data either realtime (ingested data is immediately available for querying) or in batches.
5. **自愈，自平衡，操作方便**  As an operator, to scale the cluster out or in, simply add or remove servers and the cluster will rebalance itself automatically, in the background, without any downtime. If any Druid servers fail, the system will automatically route around the damage until those servers can be replaced. Druid is designed to run 24/7 with no need for planned downtimes for any reason, including configuration changes and software updates.
6. **云原生的、容错的架构，不会丢失数据.**  Once Druid has ingested your data, a copy is stored safely in  [deep storage](https://druid.apache.org/docs/latest/design/index.html#deep-storage)  (typically cloud storage, HDFS, or a shared filesystem). Your data can be recovered from deep storage even if every single Druid server fails. For more limited failures affecting just a few Druid servers, replication ensures that queries are still possible while the system recovers.
7. **快速过滤的索引.**  Druid uses  [CONCISE](https://arxiv.org/pdf/1004.0403)  or  [Roaring](https://roaringbitmap.org/)  compressed bitmap indexes to create indexes that power fast filtering and searching across multiple columns.
8. **近似算法.**  Druid includes algorithms for approximate count-distinct, approximate ranking, and computation of approximate histograms and quantiles. These algorithms offer bounded memory usage and are often substantially faster than exact computations. For situations where accuracy is more important than speed, Druid also offers exact count-distinct and exact ranking.
9. **导入时自动汇总**  Druid optionally supports data summarization at ingestion time. This summarization partially pre-aggregates your data, and can lead to big costs savings and performance boosts.

#### 4、适用

Druid is likely a good choice if your use case fits a few of the following descriptors:

- **Insert rates are very high, but updates are less common**.
- Most of your queries are **aggregation and reporting queries** ("group by" queries). You may also have **searching and scanning queries**.
- You are targeting query latencies of 100**ms** to a few seconds.
- Your data has a **time** component (Druid includes optimizations and design choices specifically related to time).
- You may have more than one table, but **each query hits just one big distributed table**. Queries may potentially hit more than one smaller "lookup" table.
- You have high cardinality data columns (e.g. URLs, user IDs) and need **fast counting and ranking** over them.
- You want to **load data** from Kafka, HDFS, flat files, or object storage like Amazon S3.

Situations where you would likely  *not*  want to use Druid include:

- You need low-latency updates of  *existing*  records using a primary key. Druid supports streaming inserts, but **not streaming updates** (updates are done using background batch jobs).
- You are building an offline reporting system where **query latency is not very important**.
- You want to do "big" **joins** (joining one big fact table to another big fact table).

### 三、架构

Druid has a multi-process, distributed architecture that is designed to be cloud-friendly and easy to operate. Each Druid process type can be configured and scaled independently, giving you maximum flexibility over your cluster. This design also provides enhanced fault tolerance: an outage of one component will not immediately affect other components.

## Processes and Servers

Druid has several process types, briefly described below:

- [**Coordinator**](https://druid.apache.org/docs/latest/design/coordinator.html)  管理集群上的数据可用性。
- [**Overlord**](https://druid.apache.org/docs/latest/design/overlord.html)  控制数据导入工作负载的分配。
- [**Broker**](https://druid.apache.org/docs/latest/design/broker.html)  处理外部客户端的查询。
- [**Router**](https://druid.apache.org/docs/latest/development/router.html) 是可选的进程，可以将请求路由到Brokers、Coordinators和Overlords.
- [**Historical**](https://druid.apache.org/docs/latest/design/historical.html)  存储可查询的数据。
- [**MiddleManager**](https://druid.apache.org/docs/latest/design/middlemanager.html)  负责导入数据。

Druid进程可按照你喜欢的方式部署，但是为了便于部署我们建议组织他们为三类服务器: Master, Query, and Data.

- **Master**: Runs Coordinator and Overlord processes, manages data availability and ingestion.
- **Query**: Runs Broker and optional Router processes, handles queries from external clients.
- **Data**: Runs Historical and MiddleManager processes, executes ingestion workloads and stores all queryable data.

For more details on process and server organization, please see  [Druid Processses and Servers](https://druid.apache.org/docs/latest/design/processes.html).

### External dependencies

In addition to its built-in process types, Druid also has three external dependencies. These are intended to be able to leverage existing infrastructure, where present.

#### Deep storage

Shared file storage accessible by every Druid server. This is typically going to be a distributed object store like S3 or HDFS, or a network mounted filesystem. Druid uses this to store any data that has been ingested into the system.

Druid uses deep storage only as a backup of your data and as a way to transfer data in the background between Druid processes. To respond to queries, Historical processes do not read from deep storage, but instead read pre-fetched segments from their local disks before any queries are served. This means that Druid never needs to access deep storage during a query, helping it offer the best query latencies possible. It also means that you must have enough disk space both in deep storage and across your Historical processes for the data you plan to load.

For more details, please see  [Deep storage dependency](https://druid.apache.org/docs/latest/dependencies/deep-storage.html).

#### Metadata存储

The metadata storage holds various shared system metadata such as segment availability information and task information. This is typically going to be a traditional RDBMS like PostgreSQL or MySQL.

For more details, please see  [Metadata storage dependency](https://druid.apache.org/docs/latest/dependencies/metadata-storage.html)

#### Zookeeper

Used for internal service discovery, coordination, and leader election.

For more details, please see  [Zookeeper dependency](https://druid.apache.org/docs/latest/dependencies/zookeeper.html).

The idea behind this architecture is to make a Druid cluster simple to operate in production at scale. For example, the separation of deep storage and the metadata store from the rest of the cluster means that Druid processes are radically fault tolerant: even if every single Druid server fails, you can still relaunch your cluster from data stored in deep storage and the metadata store.

### 架构图

The following diagram shows how queries and data flow through this architecture, using the suggested Master/Query/Data server organization:

![druid-architecture](../img/druid-architecture.png)

# Datasources and segments

Druid 的数据存储在 "datasources"中, 它类似于传统RDBMS中的表。每一个 datasource根据时间分割，或者根据其他属性分割（可选） 。每个时间范围被叫做一个 "chunk" (例如, 一天，如果你的datasource是按照天划分的). chunk中数据被划分成一个或多个"segments"。每个segment是个单独的文件,包含数百万的数据行。 因为 segments被组织成时间chunks，有时候，把segments想象成在时间轴上是有帮助的，就像下面这样:

![druid-timeline](../img/druid-timeline.png)

A datasource may have anywhere from just a few segments, up to hundreds of thousands and even millions of segments. Each segment starts life off being created on a MiddleManager, and at that point, is mutable and uncommitted. The segment building process includes the following steps, designed to produce a data file that is compact and supports fast queries:

- Conversion to columnar format
- Indexing with bitmap indexes
- Compression using various algorithms
  - Dictionary encoding with id storage minimization for String columns
  - Bitmap compression for bitmap indexes
  - Type-aware compression for all columns

Periodically, segments are committed and published. At this point, they are written to  [deep storage](https://druid.apache.org/docs/latest/design/index.html#deep-storage), become immutable, and move from MiddleManagers to the Historical processes (see  [Architecture](https://druid.apache.org/docs/latest/design/index.html#architecture)  above for details). An entry about the segment is also written to the  [metadata store](https://druid.apache.org/docs/latest/design/index.html#metadata-storage). This entry is a self-describing bit of metadata about the segment, including things like the schema of the segment, its size, and its location on deep storage. These entries are what the Coordinator uses to know what data  *should*  be available on the cluster.

# Query processing

Queries first enter the Broker, where the Broker will identify which segments have data that may pertain to that query. The list of segments is always pruned by time, and may also be pruned by other attributes depending on how your datasource is partitioned. The Broker will then identify which Historicals and MiddleManagers are serving those segments and send a rewritten subquery to each of those processes. The Historical/MiddleManager processes will take in the queries, process them and return results. The Broker receives results and merges them together to get the final answer, which it returns to the original caller.

Broker pruning is an important way that Druid limits the amount of data that must be scanned for each query, but it is not the only way. For filters at a more granular level than what the Broker can use for pruning, indexing structures inside each segment allow Druid to figure out which (if any) rows match the filter set before looking at any row of data. Once Druid knows which rows match a particular query, it only accesses the specific columns it needs for that query. Within those columns, Druid can skip from row to row, avoiding reading data that doesn't match the query filter.

So Druid uses three different techniques to maximize query performance:

- Pruning which segments are accessed for each query.
- Within each segment, using indexes to identify which rows must be accessed.
- Within each segment, only reading the specific rows and columns that are relevant to a particular query.

#### 导入数据



### 四、安装

### 五、使用

#### 1、Load

- Loading a file
  
  - ```bash
    bin/post-index-task --file quickstart/tutorial/wikipedia-index.json
    ```
  
  - ```bash
    curl -X 'POST' -H 'Content-Type:application/json' -d @quickstart/tutorial/wikipedia-index.json http://localhost:8090/druid/indexer/v1/task
    ```

- Load stream data from Apache Kafka
  
  - ```bash
    curl -XPOST -H'Content-Type: application/json' -d @quickstart/tutorial/wikipedia-kafka-supervisor.json http://localhost:8090/druid/indexer/v1/supervisor
    ```

- Load batch data using Hadoop
  
  - ```bash
    bin/post-index-task --file quickstart/tutorial/wikipedia-index-hadoop.json
    ```

- Load streaming data with HTTP push
  
  - ```bash
    curl -XPOST -H'Content-Type: application/json' --data-binary @quickstart/tutorial/wikiticker-2015-09-12-sampled.json http://localhost:8200/v1/post/wikipedia
    ```

#### #### 2、查询

**TopN**

1、json：`wikipedia-top-pages.json`

```json
{
  "queryType" : "topN",
  "dataSource" : "wikipedia",
  "intervals" : ["2015-09-12/2015-09-13"],
  "granularity" : "all",
  "dimension" : "page",
  "metric" : "count",
  "threshold" : 10,
  "aggregations" : [
    {
      "type" : "count",
      "name" : "count"
    }
  ]
}
```

```bash
curl -X 'POST' -H 'Content-Type:application/json' -d @quickstart/tutorial/wikipedia-top-pages.json http://localhost:8082/druid/v2?pretty
```

2、sql：wikipedia-top-pages-sql.json

```sql
SELECT page, COUNT(*) AS Edits FROM wikipedia WHERE "__time" BETWEEN TIMESTAMP '2015-09-12 00:00:00' AND TIMESTAMP '2015-09-13 00:00:00' GROUP BY page ORDER BY Edits DESC LIMIT 10;
```

HTTP

```bash
curl -X 'POST' -H 'Content-Type:application/json' -d @quickstart/tutorial/wikipedia-top-pages-sql.json http://localhost:8082/druid/v2/sql
```

dsql客户

**Timeseries**

**GroupBy**

**Scan**

**EXPLAIN PLAN FOR**

#### 3、Rollup

Roll-up is a first-level aggregation operation over a selected set of columns that reduces the size of stored segments.

```json
{
  "type" : "index",
  "spec" : {
    "dataSchema" : {
      "dataSource" : "rollup-tutorial",
      "parser" : {
        "type" : "string",
        "parseSpec" : {
          "format" : "json",
          "dimensionsSpec" : {
            "dimensions" : [
              "srcIP",
              "dstIP"
            ]
          },
          "timestampSpec": {
            "column": "timestamp",
            "format": "iso"
          }
        }
      },
      "metricsSpec" : [
        { "type" : "count", "name" : "count" },
        { "type" : "longSum", "name" : "packets", "fieldName" : "packets" },
        { "type" : "longSum", "name" : "bytes", "fieldName" : "bytes" }
      ],
      "granularitySpec" : {
        "type" : "uniform",
        "segmentGranularity" : "week",
        "queryGranularity" : "minute",
        "intervals" : ["2018-01-01/2018-01-03"],
        "rollup" : true
      }
    },
    "ioConfig" : {
      "type" : "index",
      "firehose" : {
        "type" : "local",
        "baseDir" : "quickstart/tutorial",
        "filter" : "rollup-data.json"
      },
      "appendToExisting" : false
    },
    "tuningConfig" : {
      "type" : "index",
      "maxRowsPerSegment" : 5000000,
      "maxRowsInMemory" : 25000,
      "forceExtendableShardSpecs" : true
    }
  }
}
```









数据格式

- 数据源datasources（类比数据库表）

- 时间列TimeStamp

- 维度列Dimension，标示一个事件（Event）

- 指标列Metric，用于聚合和计算的列（Fact）

数据摄入

- 实时Kafka

- 批量HDFS，CVS等

数据查询

- JSON+HTTP

- 不支持SQL

- 支持多中语言Java、Python、R、JavaScript和Ruby

- 不支持join







Druid Console

[http://localhost:8888/](http://localhost:8888/)

- DataSources

- Segments

- Tasks

- Data servers

- SQL

- Config

### 参考资料

[1]:[Apache Druid](https://druid.apache.org/)

[2]:《企业大数据处理：Spark、Druid、Flume与Kafka应用实践》

[3]:《Druid实时大数据分析原理与实践》
