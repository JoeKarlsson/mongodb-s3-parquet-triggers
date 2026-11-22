"""Runs verify.sql's query against a local Parquet file shaped like the tutorial's output.

S3 needs credentials CI doesn't have, so this swaps the bucket path for a local file and
skips the secret setup; it checks the query itself.
"""
import pathlib, tempfile, duckdb

sql = pathlib.Path(__file__).parent.parent.joinpath('verify.sql').read_text()
query = sql[sql.index('SELECT'):]
with tempfile.TemporaryDirectory() as d:
    con = duckdb.connect()
    con.execute(f"COPY (SELECT now() - INTERVAL (i) SECOND AS time, random() * 100 AS aNumber, 'event' AS type FROM range(3) t(i)) TO '{d}/events.1.parquet' (FORMAT parquet)")
    count, first, last = con.execute(query.replace('s3://mongodb-data-lake-demo/', f'{d}/')).fetchone()
    assert count == 3 and first < last, (count, first, last)
    print(f'verify.sql query ok: {count} documents')
