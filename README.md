# MongoDB to S3 Parquet Triggers

[![Check](https://github.com/JoeKarlsson/mongodb-s3-parquet-triggers/actions/workflows/check.yml/badge.svg)](https://github.com/JoeKarlsson/mongodb-s3-parquet-triggers/actions/workflows/check.yml) [![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE) [![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.24451386.svg)](https://doi.org/10.5281/zenodo.24451386)

The two MongoDB Atlas trigger functions, the AWS IAM policy and the DuckDB check that copy new MongoDB documents into an S3 bucket as Parquet every minute.

[Read the tutorial](https://www.joekarlsson.com/blog/how-to-automate-continuous-data-copying-from-mongodb-to-s3/)

## Quick start

You need a MongoDB Atlas cluster with some data in it, the Project Owner role, and an AWS account that can create IAM roles and S3 buckets. The tutorial walks through each step in the Atlas UI; this repo holds the pieces you paste in.

1. Create a federated database instance in Atlas (Data Federation, then Manual setup), connect your S3 bucket with Read and write access, and add your cluster's collection as a data source.
2. Give the IAM role Atlas uses the policy in [`iam/read-write-policy.json`](iam/read-write-policy.json), with `<your-bucket>` replaced by your bucket's name.
3. In Atlas, under Streaming Data, then Triggers, add two Scheduled triggers that repeat every minute:

| Trigger | Linked data source | Function |
| --- | --- | --- |
| `Create_Event_Every_Min_Trigger` | your cluster (`mongodb-atlas`) | [`functions/create-event-every-min.js`](functions/create-event-every-min.js) |
| `Copy_Events_To_S3_Trigger` | your federated database instance (`mongodb-datafederation`) | [`functions/copy-events-to-s3.js`](functions/copy-events-to-s3.js) |

Replace the database and collection names, the bucket and the region in each function with your own.

4. After a minute or two, check the Parquet landed, with your AWS CLI credentials:

```bash
duckdb < verify.sql
```

## Development

GitHub Actions runs each function against a stand-in for the `context` object Atlas provides, checks the IAM policy has every permission `$out` needs, and runs the DuckDB query against a local Parquet file. It can't reach Atlas or S3, so it checks the logic, not the setup.

```bash
node --test test/functions.test.mjs
pip install duckdb && python test/verify_sql.py
```

## Citing

GitHub's "Cite this repository" button uses [CITATION.cff](CITATION.cff), which points to the tutorial.

## License

[MIT](LICENSE)
