import { randomBytes } from "crypto";
import { Bucket, DbContext, File } from "./managed/database"

export const registerBucker = (app, database: DbContext) => {
	app.get('/bucket/create', async (request, response) => {
		const bucket = new Bucket();
		bucket.created = new Date();
		bucket.key = randomBytes(12).toString('base64url');

		await bucket.create();

		response.json(bucket.key);
	});

	app.get('/bucket/index/:key', async (request, response) => {
		const bucket = await database.bucket.first(bucket => bucket.key == request.params.key);

		if (!bucket) {
			return response.json([]);
		}

		const files = await bucket.items
			.includeTree({
				path: true,
				created: true,
				modified: true,
				size: true,
				mimeType: true
			})
			.where(item => item.deleted == null)
			.toArray();

		response.json(files.map(file => ({
			name: file.path,
			ctime: +file.created,
			mtime: +file.modified,
			size: file.size,
			mimeType: file.mimeType
		})));
	});

	app.get('/bucket/:key/:path', async (request, response) => {
		const file = await database.file
			.where(file => file.deleted == null)
			.where(file => file.bucket.key == request.params.key)
			.first(file => file.path == request.params.path);

		if (!file || !file.mimeType) {
			return response.end();
		}

		response.end(file.content);
	});

	app.post('/bucket/directory/:key/:path', async (request, response) => {
		const bucket = await database.bucket.first(bucket => bucket.key == request.params.key);

		if (!bucket) {
			return response.status(500).end();
		}

		const existing = await bucket.items
			.where(item => item.deleted == null)
			.where(item => item.path == request.params.path)
			.count();

		if (existing) {
			return response.status(500).end();
		}

		const entry = new File();
		entry.bucket = bucket;
		entry.created = new Date();
		entry.path = request.params.path;

		await entry.create();

		response.json(true);
	});

	app.post('/bucket/file/:key/:path/:type', async (request, response) => {
		const bucket = await database.bucket.first(bucket => bucket.key == request.params.key);

		if (!bucket) {
			return response.status(500).end();
		}

		let entry = await bucket.items
			.where(item => item.deleted == null)
			.first(item => item.path == request.params.path)

		if (entry && entry.mimeType === null) {
			return response.status(500).end();
		}

		if (!entry) {
			entry = new File();
			entry.bucket = bucket;
			entry.created = new Date();
			entry.path = request.params.path;
			entry.mimeType = request.params.type;

			await entry.create();
		}

		const content = [];

		request.on('data', chunk => content.push(chunk));

		request.on('end', async () => {
			entry.content = Buffer.concat(content);
			entry.size = entry.content.byteLength;
			entry.modified = new Date();

			await entry.update();

			response.json(true);
		});
	});

	app.delete('/bucket/:key/:path', async (request, response) => {
		const bucket = await database.bucket.first(bucket => bucket.key == request.params.key);

		if (!bucket) {
			return response.status(500).end();
		}

		const entry = await bucket.items
			.where(item => item.deleted == null)
			.first(item => item.path == request.params.path);

		if (!entry) {
			return response.status(500).end();
		}

		entry.deleted = new Date();
		await entry.update();

		response.json(true);
	});
};
