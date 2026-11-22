// Runs each Atlas Function against a stand-in for the `context` global Atlas provides,
// and checks it does what the tutorial says. It can't reach Atlas or S3; it checks the logic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function load(file, services) {
	const sandbox = { context: { services: { get: (name) => services(name) } }, exports: undefined, JSON, Math, Date };
	vm.runInNewContext(readFileSync(new URL(`../functions/${file}`, import.meta.url), 'utf8'), sandbox);
	return sandbox.exports;
}

test('trigger 1 inserts one event document into the cluster', async () => {
	const inserted = [];
	const fn = load('create-event-every-min.js', (name) => {
		assert.equal(name, 'mongodb-atlas');
		return { db: () => ({ collection: () => ({ insertOne: async (doc) => (inserted.push(doc), { insertedId: 1 }) }) }) };
	});
	await fn();
	assert.equal(inserted.length, 1);
	assert.equal(inserted[0].type, 'event');
	assert.ok(inserted[0].time instanceof Date);
});

test('trigger 2 copies the last 60 seconds of documents to S3 as Parquet', async () => {
	let pipeline;
	const fn = load('copy-events-to-s3.js', (name) => {
		assert.equal(name, 'mongodb-datafederation');
		return { db: () => ({ collection: () => ({ aggregate: (p) => ((pipeline = p), []) }) }) };
	});
	const before = Date.now();
	await fn();
	const { $gt, $lt } = pipeline[0].$match.time;
	assert.ok(Math.abs($lt - $gt - 60 * 1000) < 1000, 'the window is 60 seconds');
	assert.ok($lt.getTime() >= before - 1000);
	const { s3 } = pipeline[1].$out;
	assert.equal(s3.format.name, 'parquet');
	assert.ok(s3.bucket && s3.filename && s3.region);
});

test('the IAM policy grants what $out needs to read and write the bucket', () => {
	const policy = JSON.parse(readFileSync(new URL('../iam/read-write-policy.json', import.meta.url), 'utf8'));
	const actions = policy.Statement.flatMap((s) => s.Action);
	for (const a of ['s3:ListBucket', 's3:GetObject', 's3:GetBucketLocation', 's3:PutObject', 's3:DeleteObject'])
		assert.ok(actions.includes(a), a);
	assert.ok(policy.Statement[0].Resource.some((r) => r.endsWith('/*')), 'object actions need the bucket/* ARN');
});
