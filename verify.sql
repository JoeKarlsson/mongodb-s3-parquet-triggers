-- Check the Parquet landed in S3. Uses the AWS credentials from the AWS CLI.
-- Run: duckdb < verify.sql
INSTALL httpfs;
LOAD httpfs;
CREATE SECRET (TYPE s3, PROVIDER credential_chain);
SELECT count(*) AS documents, min(time) AS first, max(time) AS last
FROM 's3://mongodb-data-lake-demo/events*.parquet';
