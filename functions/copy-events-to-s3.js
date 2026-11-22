// Scheduled trigger 2 (Copy_Events_To_S3_Trigger): copies the last minute of documents to S3 as Parquet.
// Linked data source: your federated database instance (named mongodb-datafederation by default).
exports = function () {
	const service = context.services.get('mongodb-datafederation');
	const db = service.db('NAME_OF_YOUR_VIRTUAL_DATABASE');
	const events = db.collection('NAME_OF_YOUR_VIRTUAL_COLLECTION');

	const pipeline = [
		{
			$match: {
				time: {
					$gt: new Date(Date.now() - 60 * 1000),
					$lt: new Date(Date.now()),
				},
			},
		},
		{
			$out: {
				s3: {
					bucket: 'mongodb-data-lake-demo', // your bucket
					region: 'us-east-1', // your bucket's region
					filename: 'events',
					format: {
						name: 'parquet',
						maxFileSize: '10GB',
						maxRowGroupSize: '100MB',
					},
				},
			},
		},
	];

	return events.aggregate(pipeline);
};
