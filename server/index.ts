import { DbContext } from "./managed/database";
import { join } from "path";
import { DbClient, RunContext } from "vlquery";
import { createReadStream, exists, existsSync } from "fs";
import { readdir, readFile, stat } from "fs/promises";
import express from 'express';
import { registerStatic } from "./static";
import { registerBucker } from "./bucket";

DbClient.connectedClient = new DbClient({});

DbClient.connectedClient.connect().then(async () => {
	const app = express();

	const database = new DbContext(new RunContext());

	registerStatic(app);
	registerBucker(app, database);

	app.get('/config/init', (request, response) => {
		response.json({});
	});

	app.use('/', express.static(join(process.cwd(), '..', 'page')));
	app.use((request, response) => response.sendFile(join(process.cwd(), '..', 'page', 'index.html')));

	app.listen(+process.env.PORT! || 2000, () => {
		console.log('app started');
	});
});
