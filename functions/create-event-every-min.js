// Scheduled trigger 1 (Create_Event_Every_Min_Trigger): writes a test document every minute.
// Linked data source: your Atlas cluster (named mongodb-atlas by default).
exports = async function () {
	const mongodb = context.services.get('mongodb-atlas');
	const db = mongodb.db('NAME_OF_YOUR_DATABASE');
	const events = db.collection('NAME_OF_YOUR_COLLECTION');

	const result = await events.insertOne({
		time: new Date(),
		aNumber: Math.random() * 100,
		type: 'event',
	});

	return JSON.stringify(result);
};
