---
layout:     post
title:      "Apache Doris"
subtitle:   "Doris is a MPP-based interactive SQL data warehousing for reporting and analysis."
date:       2019-06-18 12:00:00
author:     "Zhang huirui"
header-img: "img/doris-logo-2.png"
header-mask: 0.3
catalog:    true
tags:
    - doris
    - palo
    - olap
    - data-warehouse
    - mpp    
---

> Doris is a MPP-based interactive SQL data warehousing for reporting and analysis.

## Apache Doris

### Doris

Doris是一个MPP的OLAP系统，主要整合了**Google Mesa**（数据模型），**Apache Impala**（MPP Query Engine)和**Apache ORCFile**  (存储格式，编码和压缩) 的技术。

![apache-doris](http://static.zybuluo.com/kangkaisen/km2dj2w80iiv9kpuqnrkpzec/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202018-04-14%20%E4%B8%8B%E5%8D%886.43.15.png)

Doris的系统架构如下，Doris主要分为FE和BE两个组件，FE主要负责查询的编译，分发和元数据管理（基于内存，类似HDFS NN）；BE主要负责查询的执行和存储系统。

![apache-doris](http://static.zybuluo.com/kangkaisen/fr37ra96hr5yntvbld0bbizy/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202018-04-18%20%E4%B8%8B%E5%8D%8811.09.33.png)

### Doris的聚合模型

Doris的聚合模型借鉴自Mesa，但本质上和Kylin的聚合模型一样，只不过Doris中将维度称作Key，指标称作Value。

![doris-data-model](http://static.zybuluo.com/kangkaisen/ia4fwu6uh9bmkujl7f9ugiki/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202018-04-14%20%E4%B8%8B%E5%8D%887.21.25.png)

Doris中比较独特的聚合函数是Replace函数，这个聚合函数能够**保证相同Keys的记录只保留最新的Value**，可以借助这个Replace函数来实现**点更新**。一般OLAP系统的数据都是只支持Append的，但是像电商中交易的退款，广告点击中的无效点击处理，都需要去更新之前写入的单条数据，在Kylin这种没有Relpace函数的系统中我们必须把包含对应更新记录的整个Segment数据全部重刷，但是有了Relpace函数，我们只需要再追加1条新的记录即可。 但是Doris中的Repalce函数有个缺点：**无法支持预聚合**，就是说只要你的SQL中包含了Repalce函数，即使有其他可以已经预聚合的Sum，Max指标，也必须现场计算。

为什么Doirs可以支持点更新呢？

Kylin中的Segment是不可变的，也就是说HFile一旦生成，就不再发生任何变化。但是Doirs中的Segment文件和HBase一样，是可以进行Compaction的，具体可以参考[Google Mesa 论文解读中的Mesa数据版本化管理](https://blog.bcmeng.com/post/google-mesa.html#mesa%E6%95%B0%E6%8D%AE%E7%89%88%E6%9C%AC%E5%8C%96%E7%AE%A1%E7%90%86)

Doris的聚合模型相比Kylin有个缺点：**就是一个Column只能有一个预聚合函数，无法设置多个预聚合函数**。 不过Doris可以现场计算出其他的聚合函数。 Apache Doris的开发者Review时提到，针对这个问题，Doris还有一种解法：由于**Doris支持多表导入的原子更新**，所以1个Column需要多个聚合函数时，可以在Doris中建多张表，同一份数据导入时，Doris可以同时原子更新多张Doris表，缺点是多张Doris表的查询路由需要应用层来完成。

Doris中和Kylin的Cuboid等价的概念是RollUp表，**Cuboid和RollUp表都可以认为是一种Materialized Views或者Index**。Doris的RollUp表和Kylin的Cuboid一样，**在查询时不需要显示指定**，系统内部会根据查询条件进行路由。 如下图所示：

![Doris Rollup](http://static.zybuluo.com/kangkaisen/5gnpkz5j27hmn9aep0dskwr5/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202018-04-14%20%E4%B8%8B%E5%8D%887.26.07.png)

Doris中RollUp表的路由规则如下：

1. 选择包含所有查询列的RollUp表
2. 按照过滤和排序的Column筛选最符合的RollUp表
3. 按照Join的Column筛选最符合的RollUp表
4. 行数最小的
5. 列数最小的

### Kylin Cuboid VS Doris RollUp

![Kylin cuboid vs Doris rollup](https://blog.bcmeng.com/post/media/15545480639031/Kylin%20cuboid%20vs%20Doris%20rollup.png)

### Doris的明细模型

由于Doris的聚合模型存在下面的缺陷，Doris引入了明细模型。

- 必须区分维度列和指标列
- 维度列很多时，Sort的成本很高
- Count成本很高，需要读取所有维度列（可以参考Kylin的解决方法进行优化）

Doris的明细模型不会有任何预聚合，不区分维度列和指标列，但是在建表时需要指定Sort Columns，**数据导入时会根据Sort Columns进行排序，查询时根据Sort Column过滤会比较高效**。

如下图所示，Sort Columns是Year和City。

![Doris-detail-model](http://static.zybuluo.com/kangkaisen/z0mv4e70sxcl13bj7yqojcxj/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202018-04-14%20%E4%B8%8B%E5%8D%887.33.43.png)

这里需要注意一点，**Doris中一张表只能有一种数据模型**，即要么是聚合模型，要么是明细模型，而且**Roll Up表的数据模型必须和Base表一致**，也就是说明细模型的Base 表不能有聚合模型的Roll Up表。

**Doris存储引擎：**

![屏幕快照 2018-04-18 下午11.19.19.png-125.8kB](http://static.zybuluo.com/kangkaisen/3o3ree6nao9m8njpo9gbgphx/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202018-04-18%20%E4%B8%8B%E5%8D%8811.19.19.png)

如上图所示，Doris的Table支持二级分区，可以先按照日期列进行一级分区，再按照指定列Hash分桶。具体来说，1个Table可以按照日期列分为多个Partition， 每个Partition可以包含多个Tablet，**Tablet是数据移动、复制等操作的最小物理存储单元**，各个Tablet之间的数据没有交集，并且在物理上独立存储。Partition 可以视为逻辑上最小的管理单元，**数据的导入与删除，仅能针对一个 Partition进行**。1个Table中Tablet的数量= Partition num * Bucket num。Tablet会按照一定大小（256M）拆分为多个Segment文件，Segment是列存的，但是会按行（1024）拆分为多个Rowblock。

![Doris segment file](http://static.zybuluo.com/kangkaisen/d727k37k30w9beq259zr1g89/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202018-04-18%20%E4%B8%8B%E5%8D%8811.26.13.png)

下面我们来看下Doris Segment文件的具体格式，Doris文件格式主要参考了Apache ORC。如上图所示，Doris文件主要由Meta和Data两部分组成，Meta主要包括文件本身的Header，Segment Meta，Column Meta，和每个Column 数据流的元数据，每部分的具体内容大家看图即可，比较详细。 Data部分主要包含每一列的Index和Data，这里的Index指每一列的Min,Max值和数据流Stream的Position；Data就是每一列具体的数据内容，Data根据不同的数据类型会用不同的Stream来存储，Present Stream代表每个Value是否是Null，Data Stream代表二进制数据流，Length Stream代表非定长数据类型的长度。 下图是String使用字典编码和直接存储的Stream例子。

![Doris String encoding](http://static.zybuluo.com/kangkaisen/0hfdk7masogmajyj1kh59rry/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202018-04-18%20%E4%B8%8B%E5%8D%8811.29.34.png)

下面我们来看下Doris的前缀索引：

![Doris index](http://static.zybuluo.com/kangkaisen/kpjuv1cokgdipur7fjo1um5p/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202018-04-18%20%E4%B8%8B%E5%8D%8811.32.12.png)

本质上，Doris 的数据存储是类似 SSTable（Sorted String Table）的数据结构。该结构是一种有序的数据结构，可以按照指定的列有序存储。在这种数据结构上，以排序列作为条件进行查找，会非常的高效。而前缀索引，即在排序的基础上，实现的一种根据给定前缀列，快速查询数据的索引方式。前缀索引文件的格式如上图所示，**索引的Key是每个Rowblock第一行记录的Sort Key的前36个字节，Value是Rowblock在Segment文件的偏移量**。

有了前缀索引后，我们查询特定Key的过程就是两次二分查找：

1. 先加载Index文件，二分查找Index文件获取包含特定Key的Row blocks的Offest,然后从Sement Files中获取指定的Rowblock；
2. 在Rowblocks中二分查找特定的Key

**Doris数据导入：**  ![Doris data loading](http://static.zybuluo.com/kangkaisen/iaztr5b7lfu7oj7ohmyjae49/%E5%B1%8F%E5%B9%95%E5%BF%AB%E7%85%A7%202018-04-18%20%E4%B8%8B%E5%8D%8811.29.48.png)

Doris 数据导入的两个核心阶段是ETL和LOADING, ETL阶段主要完成以下工作：

- 数据类型和格式的校验
- 根据Teblet拆分数据
- 按照Key列进行排序, 对Value进行聚合

LOADING阶段主要完成以下工作：

- 每个Tablet对应的BE拉取排序好的数据
- 进行数据的格式转换，生成索引

LOADING完成后会进行元数据的更新。

**Doris查询：**

![Doris-impala-query](http://static.zybuluo.com/kangkaisen/79z437wez74gf51x9ceec4ov/palo-impala.png)

Doris的查询引擎使用的是Impala，是MPP架构。 Doris的FE 主要负责SQL的解析，语法分析，查询计划的生成和优化。查询计划的生成主要分为两步：

1. 生成单节点查询计划 （上图左下角）
2. 将单节点的查询计划分布式化，生成PlanFragment（上图右半部分）

第一步主要包括Plan Tree的生成，谓词下推， Table Partitions pruning，Column projections，Cost-based优化等；第二步 将单节点的查询计划分布式化，分布式化的目标是**最小化数据移动和最大化本地Scan**，分布式化的方法是增加ExchangeNode，执行计划树会以ExchangeNode为边界拆分为PlanFragment，1个PlanFragment封装了在一台机器上对同一数据集的部分PlanTree。如上图所示：各个Fragment的数据流转和最终的结果发送依赖：DataSink。

当FE生成好查询计划树后，BE对应的各种Plan Node（Scan, Join, Union, Aggregation, Sort等）执行自己负责的操作即可。

**Doris的精确去重：**

Doris的精确去重是现场精确去重，Doris计算精确去重时会拆分为两步：

1. 按照所有的group by 字段和精确去重的字段进行聚合
2. 按照所有的group by 字段进行聚合

```
SELECT a, COUNT(DISTINCT b, c), MIN(d), COUNT(*) FROM T GROUP BY a
* - 1st phase grouping exprs: a, b, c
* - 1st phase agg exprs: MIN(d), COUNT(*)
* - 2nd phase grouping exprs: a
* - 2nd phase agg exprs: COUNT(*), MIN(<MIN(d) from 1st phase>), SUM(<COUNT(*) from 1st phase>)
```

下面是个简单的等价转换的例子：

```
select count(distinct lo_ordtotalprice) from ssb_sf20.v2_lineorder;

select count(*) from (select count(*) from ssb_sf20.v2_lineorder group by lo_ordtotalprice) a;
```

Doris现场精确去重计算性能和**去重列的基数**、**去重指标个数**、**过滤后的数据大小**成**负相关**；

**Doris的元数据**：

Doris的元数据是基于内存的，这样做的好处是性能很好且不需要额外的系统依赖。 缺点是单机的内存是有限的，扩展能力受限，但是根据Doris开发者的反馈，由于Doris本身的元数据不多，所以元数据本身占用的内存不是很多，目前用大内存的物理机，应该可以支撑数百台机器的OLAP集群。 此外，OLAP系统和HDFS这种分布式存储系统不一样，我们部署多个集群的运维成本和1个集群区别不大。

关于Doris元数据的具体原理大家可以参考Doris官方文档[Doris 元数据设计文档](https://github.com/baidu/palo/wiki/Metadata-Design)

**Why Doris Query Fast：**

1. In-Memory Metadata。 Doris的元数据就在内存中，元数据访问速度很快。
2. 聚合模型可以在数据导入时进行预聚合。
3. 和Kylin一样，也支持预计算的RollUp Table。
4. MPP的查询引擎。
5. 向量化执行。相比Kylin中Calcite的代码生成，向量化执行在处理高并发的低延迟查询时性能更好，**Kylin的代码生成本身可能会花费几十ms甚至几百ms**。
6. 列式存储 + 前缀索引。

**Doris高可用：**

**Doris FE的高可用**： Doris FE的高可用主要基于BerkeleyDB java version实现，BDB-JE实现了**类Paxos一致性协议算法**。

**Doris BE的高可用：**  Doris会保证每个Tablet的多个副本分配到不同的BE上，所以一个BE down掉，不会影响查询的可用性。

#### 客户端

Doris采用mysql协议进行通信，用户可通过mysql client或者JDBC连接到Doris集群。

#### 数据模型

Doris数据模型上目前分为三类: AGGREGATE KEY, UNIQUE KEY, DUPLICATE KEY。三种模型中数据都是按KEY进行排序。

AGGREGATE KEY: AGGREGATE KEY相同时，新旧记录进行聚合，目前支持的聚合函数有SUM, MIN, MAX, REPLACE。 AGGREGATE KEY模型可以提前聚合数据, 适合报表和多维分析业务。

UNIQUE KEY: UNIQUE KEY相同时，新记录覆盖旧记录。目前UNIQUE KEY实现上和AGGREGATE KEY的REPLACE聚合方法一样，二者本质上可以认为相同。适用于有更新的分析业务。

DUPLICATE KEY: 只指定排序列，相同DUPLICATE KEY的记录会同时存在。适用于数据无需提前聚合的分析业务。

##### 大宽表与star schema

业务方建表时, 为了和前端业务适配, 往往不对维度信息和指标信息加以区分, 而将schema定义成大宽表。对于Doris而言, 这类大宽表往往性能不尽如人意:

- schema中字段数比较多, 聚合模型中可能key列比较多, 导入过程中需要排序的列会增加。
- 维度信息更新会反应到整张表中，而更新的频率直接影响查询的效率。

使用过程中，建议用户尽量使用star schema区分维度表和指标表。频繁更新的维度表可以放在mysql中, 而如果只有少量更新, 可以直接放在Doris中。在Doris中存储维度表时，可对维度表设置更多的副本，提升join的的性能。

##### 行存和列存

Doris提供行存和列存, 建议用户选择列存，列存在存储空间以及scan上更加友好。 而且Doris针对列存做了相应的优化，例如delete优化, 支持NULL等。 行存如今存在的作用只为兼容Doris早期的部分业务。

##### 数据模型的选择建议

因为数据模型在建表时就已经确定，且**无法修改**。所以，选择一个合适的数据模型**非常重要**。

1. Aggregate 模型可以通过预聚合，极大地降低聚合查询时所需扫描的数据量和查询的计算量，非常适合有固定模式的报表类查询场景。但是该模型对 count(*) 查询很不友好。同时因为固定了 Value 列上的聚合方式，在进行其他类型的聚合查询时，需要考虑语意正确性。
2. Uniq 模型针对需要唯一主键约束的场景，可以保证主键唯一性约束。但是无法利用 ROLLUP 等预聚合带来的查询优势（因为本质是 REPLACE，没有 SUM 这种聚合方式）。
3. Duplicate 适合任意维度的 Ad-hoc 查询。虽然同样无法利用预聚合的特性，但是不受聚合模型的约束，可以发挥列存模型的优势（只读取相关列，而不需要读取所有 Key 列）。

## 聚合模型的局限性

这里我们针对 Aggregate 模型（包括 Uniq 模型），来介绍下聚合模型的局限性。

在聚合模型中，模型对外展现的，是**最终聚合后的**数据。也就是说，任何还未聚合的数据（比如说两个不同导入批次的数据），必须通过某种方式，以保证对外展示的一致性。我们举例说明。

假设表结构如下：

| ColumnName | Type     | AggregationType | Comment |
| ---------- | -------- | --------------- | ------- |
| user_id    | LARGEINT |                 | 用户id    |
| date       | DATE     |                 | 数据灌入日期  |
| cost       | BIGINT   | SUM             | 用户总消费   |

假设存储引擎中有如下两个已经导入完成的批次的数据：

**batch 1**

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017-11-20 | 50   |
| 10002   | 2017-11-21 | 39   |

**batch 2**

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017-11-20 | 1    |
| 10001   | 2017-11-21 | 5    |
| 10003   | 2017-11-22 | 22   |

可以看到，用户 10001 分属在两个导入批次中的数据还没有聚合。但是为了保证用户只能查询到如下最终聚合后的数据：

| user_id | date       | cost |
| ------- | ---------- | ---- |
| 10001   | 2017-11-20 | 51   |
| 10001   | 2017-11-21 | 5    |
| 10002   | 2017-11-21 | 39   |
| 10003   | 2017-11-22 | 22   |

我们在查询引擎中加入了聚合算子，来保证数据对外的一致性。

另外，在聚合列（Value）上，执行与聚合类型不一致的聚合类查询时，要注意语意。比如我们在如上示例中执行如下查询：

`SELECT MIN(cost) FROM table;`

得到的结果是 5，而不是 1。

同时，这种一致性保证，在某些查询中，会极大的降低查询效率。

我们以最基本的 count(*) 查询为例：

`SELECT COUNT(*) FROM table;`

在其他数据库中，这类查询都会很快的返回结果。因为在实现上，我们可以通过如“导入时对行进行计数，保存count的统计信息”，或者在查询时“仅扫描某一列数据，获得count值”的方式，只需很小的开销，即可获得查询结果。但是在 Doris 的聚合模型中，这种查询的开销**非常大**。

所以，`select count(*) from table;`  的正确结果应该为  **4**。但如果我们只扫描  `user_id`  这一列，如果加上查询时聚合，最终得到的结果是  **3**（10001, 10002, 10003）。而如果不加查询时聚合，则得到的结果是  **5**（两批次一共5行数据）。可见这两个结果都是不对的。

为了得到正确的结果，我们必须同时读取  `user_id`  和  `date`  这两列的数据，**再加上查询时聚合**，才能返回  **4**  这个正确的结果。也就是说，在 count(*) 查询中，Doris 必须扫描所有的 AGGREGATE KEY 列（这里就是  `user_id`  和  `date`），并且聚合后，才能得到语意正确的结果。当聚合列非常多时，count(*) 查询需要扫描大量的数据。

因此，当业务上有频繁的 count(*) 查询时，我们建议用户通过增加一个**值衡为 1 的，聚合类型为 SUM 的列来模拟 count(*)**。如刚才的例子中的表结构，我们修改如下：

| ColumnName | Type   | AggreateType | Comment   |
| ---------- | ------ | ------------ | --------- |
| user_id    | BIGINT |              | 用户id      |
| date       | DATE   |              | 数据灌入日期    |
| cost       | BIGINT | SUM          | 用户总消费     |
| count      | BIGINT | SUM          | 用于计算count |

增加一个 count 列，并且导入数据中，该列值**衡为 1**。则  `select count(*) from table;`  的结果等价于  `select sum(count) from table;`。而后者的查询效率将远高于前者。不过这种方式也有使用限制，就是用户需要自行保证，不会重复导入 AGGREGATE KEY 列都相同的行。否则，`select sum(count) from table;`  只能表述原始导入的行数，而不是  `select count(*) from table;`  的语义。

另一种方式，就是  **将如上的  `count`  列的聚合类型改为 REPLACE，且依然值衡为 1**。那么  `select sum(count) from table;`  和  `select count(*) from table;`  的结果将是一致的。并且这种方式，没有导入重复行的限制。

#### 逻辑存储

在 Doris 中，数据都以表（Table）的形式进行逻辑上的描述。

##### Row & Column

一张表包括行（Row）和列（Column）。Row 即用户的一行数据。Column 用于描述一行数据中不同的字段。

Column 可以分为两大类：Key 和 Value。从业务角度看，Key 和 Value 可以分别对应维度列和指标列。从聚合模型的角度来说，Key 列相同的行，会聚合成一行。其中 Value 列的聚合方式由用户在建表时指定。

##### Tablet & Partition

在 Doris 的存储引擎中，用户数据被水平划分为若干个数据分片（Tablet，也称作数据分桶）。每个 Tablet 包含若干数据行。各个 Tablet 之间的数据没有交集，并且在物理上是独立存储的。

多个 Tablet 在逻辑上归属于不同的分区（Partition）。一个 Tablet 只属于一个 Partition。而一个 Partition 包含若干个 Tablet。因为 Tablet 在物理上是独立存储的，所以可以视为 Partition 在物理上也是独立。Tablet 是数据移动、复制等操作的最小物理存储单元。

若干个 Partition 组成一个 Table。Partition 可以视为是逻辑上最小的管理单元。数据的导入与删除，都可以或仅能针对一个 Partition 进行。

#### 分区(parition)和分桶(bucket)

Doris支持支持单分区和复合分区两种建表方式。

在复合分区中：

- 第一级称为Partition，即分区。用户可以指定某一维度列作为分区列（当前只支持整型和时间类型的列），并指定每个分区的取值范围。

- 第二级称为Distribution，即分桶。用户可以指定某几个维度列（或不指定，即所有KEY列）以及桶数对数据进行HASH分布。

以下场景推荐使用复合分区

- 有时间维度或类似带有有序值的维度：可以以这类维度列作为分区列。分区粒度可以根据导入频次、分区数据量等进行评估。

- 历史数据删除需求：如有删除历史数据的需求（比如仅保留最近N 天的数据）。使用复合分区，可以通过删除历史分区来达到目的。也可以通过在指定分区内发送DELETE语句进行数据删除。

- 解决数据倾斜问题：每个分区可以单独指定分桶数量。如按天分区，当每天的数据量差异很大时，可以通过指定分区的分桶数，合理划分不同分区的数据,分桶列建议选择区分度大的列。

用户也可以不使用复合分区，即使用单分区。则数据只做HASH分布。

可以对复合分区表动态的增删分区。

数据导入可以导入指定的partition。

Doris支持两级分区存储, 第一层为RANGE分区(partition), 第二层为HASH分桶(bucket)。

- RANGE分区(partition) : RANGE分区用于将数据划分成不同区间, 逻辑上可以理解为将原始表划分成了多个子表。 业务上，多数用户会选择采用按时间进行partition, 让时间进行partition有以下好处：
  - 可区分冷热数据
  - 可用上Doris分级存储(SSD + SATA)的功能
  - 按分区删除数据时，更加迅速
- HASH分桶(bucket) : 根据hash值将数据划分成不同的bucket。
  - 建议采用区分度大的列做分桶, 避免出现数据倾斜
  - 为方便数据恢复, 建议单个bucket的size不要太大, 保持在10GB左右, 所以建表或增加partition时请合理考虑buckets数目, 其中不同partition可指定不同的buckets数。
  - random分桶的方式不建议采用，建表时烦请指定明确的hash分桶列。

#### 稀疏索引和bloomfilter，前缀索引

##### 前缀索引

不同于传统的数据库设计，Doris 不支持在任意列上创建索引。Doris 这类 MPP 架构的 OLAP 数据库，通常都是通过提高并发，来处理大量数据的。  

本质上，Doris 的数据存储在类似 SSTable（Sorted String Table）的数据结构中。该结构是一种有序的数据结构，可以按照指定的列进行排序存储。在这种数据结构上，以排序列作为条件进行查找，会非常的高效。

在 Aggregate、Uniq 和 Duplicate 三种数据模型中。底层的数据存储，是按照各自建表语句中，AGGREGATE KEY、UNIQ KEY 和 DUPLICATE KEY 中指定的列进行排序存储的。

而前缀索引，即在排序的基础上，实现的一种根据给定前缀列，快速查询数据的索引方式。所以在建表时，**正确的选择列顺序，能够极大地提高查询效率**。

因为建表时已经指定了列顺序，所以一个表只有一种前缀索引。这对于使用其他不能命中前缀索引的列作为条件进行的查询来说，效率上可能无法满足需求。因此，我们可以通过创建 ROLLUP 来人为的调整列顺序。

Doris对数据进行有序存储, 在数据有序的基础上为其建立稀疏索引,索引粒度为block(1024行)。

- 稀疏索引选取schema中固定长度的前缀作为索引内容, 目前Doris选取36个字节的前缀作为索引。
  
  - 建表时建议将查询中常见的过滤字段放在schema的前面, 区分度越大，频次越高的查询字段越往前放。
  - 这其中有一个特殊的地方,就是varchar类型的字段,varchar类型字段只能作为稀疏索引的最后一个字段，索引会在varchar处截断, 因此varchar如果出现在前面，可能索引的长度不足36个字节。
  
  对于上述site_visit表
  
  ```
  site_visit(siteid, city, username, pv)
  ```
  
  排序列有siteid, city, username三列, siteid所占字节数为4, city所占字节数为2，username占据32个字节, 所以前缀索引的内容为siteid + city + username的前30个字节

- 除稀疏索引之外, Doris还提供bloomfilter索引, bloomfilter索引对区分度比较大的列过滤效果明显。 如果考虑到varchar不能放在稀疏索引中, 可以建立bloomfilter索引。

#### 物化视图(rollup)

ROLLUP 在多维分析中是“上卷”的意思，即将数据按某种指定的粒度进行进一步聚合。

Rollup本质上可以理解为原始表(base table)的一个物化索引。建立rollup时可只选取base table中的部分列作为schema，schema中的字段顺序也可与base table不同。 下列情形可以考虑建立rollup:

- base table中数据聚合度不高，这一般是因base table有区分度比较大的字段而导致。此时可以考虑选取部分列，建立rollup。
- base table中的前缀索引无法命中，这一般是base table的建表方式无法覆盖所有的查询模式。此时可以考虑调整列顺序，建立rollup。
- 因为 Duplicate 模型没有聚合的语意。所以该模型中的 ROLLUP，已经失去了“上卷”这一层含义。而仅仅是作为调整列顺序，以命中前缀索引的作用。

##### ROLLUP 的几点说明

- ROLLUP 最根本的作用是提高某些查询的查询效率（无论是通过聚合来减少数据量，还是修改列顺序以匹配前缀索引）。因此 ROLLUP 的含义已经超出了 “上卷” 的范围。这也是为什么我们在源代码中，将其命名为 Materized Index（物化索引）的原因。
- ROLLUP 是附属于 Base 表的，可以看做是 Base 表的一种辅助数据结构。用户可以在 Base 表的基础上，创建或删除 ROLLUP，但是不能在查询中显式的指定查询某 ROLLUP。是否命中 ROLLUP 完全由 Doris 系统自动决定。
- ROLLUP 的数据是独立物理存储的。因此，创建的 ROLLUP 越多，占用的磁盘空间也就越大。同时对导入速度也会有影响（导入的ETL阶段会自动产生所有 ROLLUP 的数据），但是不会降低查询效率（只会更好）。
- ROLLUP 的数据更新与 Base 表示完全同步的。用户无需关心这个问题。
- ROLLUP 中列的聚合方式，与 Base 表完全相同。在创建 ROLLUP 无需指定，也不能修改。
- 查询能否命中 ROLLUP 的一个必要条件（非充分条件）是，查询所涉及的**所有列**（包括 select list 和 where 中的查询条件列等）都存在于该 ROLLUP 的列中。否则，查询只能命中 Base 表。
- 某些类型的查询（如 count(*)）在任何条件下，都无法命中 ROLLUP。具体参见接下来的  **聚合模型的局限性**  一节。
- 可以通过  `EXPLAIN your_sql;`  命令获得查询执行计划，在执行计划中，查看是否命中 ROLLUP。
- 可以通过  `DESC tbl_name ALL;`  语句显示 Base 表和所有已创建完成的 ROLLUP。
- 以下文档有一些对这里Rollup说明的补充[Rollup](https://github.com/apache/incubator-doris/wiki/Rollup)

#### 元数据

- FE：Frontend，即 Doris 的前端节点。主要负责接收和返回客户端请求、元数据以及集群管理、查询计划生成等工作。
- BE：Backend，即 Doris 的后端节点。主要负责数据存储与管理、查询计划执行等工作。
- bdbje：[Oracle Berkeley DB Java Edition](http://www.oracle.com/technetwork/database/berkeleydb/overview/index-093405.html)。在 Doris 中，我们使用 bdbje 完成元数据操作日志的持久化、FE 高可用等功能。

Doris 的整体架构分为两层。多个 FE 组成第一层，提供 FE 的横向扩展和高可用。多个 BE 组成第二层，负责数据存储于管理。本文主要介绍 FE 这一层中，元数据的设计与实现方式。

1. FE 节点分为 follower 和 observer 两类。各个 FE 之间，通过 bdbje（[BerkeleyDB Java Edition](http://www.oracle.com/technetwork/database/database-technologies/berkeleydb/overview/index-093405.html)）进行 leader 选举，数据同步等工作。

2. follower 节点通过选举，其中一个 follower 成为 leader 节点，负责元数据的写入操作。当 leader 节点宕机后，其他 follower 节点会重新选举出一个 leader，保证服务的高可用。

3. observer 节点仅从 leader 节点进行元数据同步，不参与选举。可以横向扩展以提供元数据的读服务的扩展性。

Doris 的元数据是全内存的。每个 FE 内存中，都维护一个完整的元数据镜像。在百度内部，一个包含2500张表，100万个分片（300万副本）的集群，元数据在内存中仅占用约 2GB。（当然，查询所使用的中间对象、各种作业信息等内存开销，需要根据实际情况估算。但总体依然维持在一个较低的内存开销范围内。）

同时，元数据在内存中整体采用树状的层级结构存储，并且通过添加辅助结构，能够快速访问各个层级的元数据信息。

下图是 Doris 元信息所存储的内容。

![](https://github.com/apache/incubator-doris/raw/master/docs/resources/metadata_contents.png)

如上图，Doris 的元数据主要存储4类数据：

1. 用户数据信息。包括数据库、表的Schema、分片信息等。
2. 各类作业信息。如导入作业，Clone作业、SchemaChange作业等。
3. 用户及权限信息。
4. 集群及节点信息。

## 数据流

![](https://github.com/apache/incubator-doris/raw/master/docs/resources/metadata_stream.png)

元数据的数据流具体过程如下：

1. 只有 leader FE 可以对元数据进行写操作。写操作在修改 leader 的内存后，会序列化为一条log，按照 key-value 的形式写入 bdbje。其中 key 为连续的整型，作为 log id，value 即为序列化后的操作日志。

2. 日志写入 bdbje 后，bdbje 会根据策略（写多数/全写），将日志复制到其他 non-leader 的 FE 节点。non-leader FE 节点通过对日志回放，修改自身的元数据内存镜像，完成与 leader 节点的元数据同步。

3. leader 节点的日志条数达到阈值后（默认 10w 条），会启动 checkpoint 线程。checkpoint 会读取已有的 image 文件，和其之后的日志，重新在内存中回放出一份新的元数据镜像副本。然后将该副本写入到磁盘，形成一个新的 image。之所以是重新生成一份镜像副本，而不是将已有镜像写成 image，主要是考虑写 image 加读锁期间，会阻塞写操作。所以每次 checkpoint 会占用双倍内存空间。

4. image 文件生成后，leader 节点会通知其他 non-leader 节点新的 image 已生成。non-leader 主动通过 http 拉取最新的 image 文件，来更换本地的旧文件。

5. bddje 中的日志，在 image 做完后，会定期删除旧的日志。

#### 特性

可以动态修改表的Schema。

可以对Table增加上卷表（Rollup）以提高查询性能，这部分可以参见高级使用指南关于Rollup的描述。Rollup可以理解为Table的一个物化索引结构。**物化**是因为其数据在物理上独立存储，而**索引**的意思是，Rollup可以调整列顺序以增加前缀索引的命中率，也可以减少key列以增加数据的聚合度。

#### 导入数据

Doris 支持两种数据导入方式：

- 小批量导入：针对小批量数据的导入。详见'HELP MINI LOAD'
- 批量导入：支持读取HDFS文件，部署不同broker可以读取不同版本HDFS数据。详见 'HELP LOAD'

#### Join

系统默认实现join的方式，是将小表进行条件过滤后，将其广播到大表所在的各个节点上，形成一个内存hash表，然后流式读出大表的数据进行hash join（broadcast join）。但是如果当小表过滤后的数据量无法放入内存的话，此时join 将无法完成，通常的报错应该是首先造成内存超限。

如果遇到上述情况，建议使用（shuffle join）的方式，也被称作partitioned join。即将小表和大表都按照join的key进行hash，然后进行分布式的 join。这个对内存的消耗就会分摊到集群的所有计算节点上。

### 参考资料

[1]: [Apache Doris](http://doris.incubator.apache.org/)

[2]:[ Apache Kylin VS Apache Doris](https://blog.bcmeng.com/post/apache-kylin-vs-baidu-palo.html)

[3]:[Apache Doris Wiki](https://github.com/apache/incubator-doris/wiki)

[4]:[Apache Doris Colocate Join 原理与实践](https://blog.bcmeng.com/post/doris-colocate-join.html)
