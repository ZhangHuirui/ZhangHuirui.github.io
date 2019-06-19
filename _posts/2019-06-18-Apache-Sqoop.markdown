---
layout:     post
title:      "Apache Sqoop"
subtitle:   "Apache Sqoop"
date:       2019-06-18 12:00:00
author:     "Zhang huirui"
header-img: "img/post-bg-nextgen-web-pwa.jpg"
header-mask: 0.3
catalog:    true
tags:
    - sqoop
    - Relational databases
    - Cassandra
    - Hbase
    - HDFS
---

> Apache Sqoop is a tool designed for efficiently transferring data betweeen structured, semi-structured and unstructured data sources. Relational databases are examples of structured data sources with well defined schema for the data they store. Cassandra, Hbase are examples of semi-structured data sources and HDFS is an example of unstructured data source that Sqoop can support.

## Apache Sqoop

data sources

- structured data sources
  
  - Relational databases
    
    - MySQL

- semi-structured data sources
  
  - Cassandra, Hbase

- unstructured data sources
  
  - HDFS

Sqoop(1.4.7)

[`sqoop-import`](http://sqoop.apache.org/docs/1.4.7/SqoopUserGuide.html#_literal_sqoop_import_literal)

The  `import`  tool imports an individual table from an RDBMS to HDFS. Each row from a table is represented as a separate record in HDFS. Records can be stored as text files (one record per line), or in binary representation as Avro or SequenceFiles.[`sqoop-import-all-tables`](http://sqoop.apache.org/docs/1.4.7/SqoopUserGuide.html#_literal_sqoop_import_all_tables_literal)

The  `import-all-tables`  tool imports a set of tables from an RDBMS to HDFS. Data from each table is stored in a separate directory in HDFS.

[`sqoop-import-mainframe`](http://sqoop.apache.org/docs/1.4.7/SqoopUserGuide.html#_literal_sqoop_import_mainframe_literal)

The  `import-mainframe`  tool imports all sequential datasets in a partitioned dataset(PDS) on a mainframe to HDFS. A PDS is akin to a directory on the open systems. The records in a dataset can contain only character data. Records will be stored with the entire record as a single text field.

[`sqoop-export`](http://sqoop.apache.org/docs/1.4.7/SqoopUserGuide.html#_literal_sqoop_export_literal)

The  `export`  tool exports a set of files from HDFS back to an RDBMS. The target table must already exist in the database. The input files are read and parsed into a set of records according to the user-specified delimiters.

[`validation`](http://sqoop.apache.org/docs/1.4.7/SqoopUserGuide.html#validation)

[`sqoop-job`](http://sqoop.apache.org/docs/1.4.7/SqoopUserGuide.html#_literal_sqoop_job_literal)



[`sqoop-metastore`](http://sqoop.apache.org/docs/1.4.7/SqoopUserGuide.html#_literal_sqoop_metastore_literal)

[`sqoop-merge`](http://sqoop.apache.org/docs/1.4.7/SqoopUserGuide.html#_literal_sqoop_merge_literal)

[`sqoop-codegen`](http://sqoop.apache.org/docs/1.4.7/SqoopUserGuide.html#_literal_sqoop_codegen_literal)

[`sqoop-create-hive-table`](http://sqoop.apache.org/docs/1.4.7/SqoopUserGuide.html#_literal_sqoop_create_hive_table_literal)



Sqoop2(1.99.7)

Apache Sqoop is a tool designed for efficiently transferring data betweeen **structured, semi-structured and unstructured data sources**. Relational databases are examples of structured data sources with well defined schema for the data they store. Cassandra, Hbase are examples of semi-structured data sources and HDFS is an example of unstructured data source that Sqoop can support.

Client modes

- interactive mode

- batch mode
  
  - create
  
  - update
  
  - clone



### 参考文档

[http://sqoop.apache.org](http://sqoop.apache.org/)
