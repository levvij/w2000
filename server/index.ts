import { Inject, StaticFileRoute, ViewModel } from "vlserver";
import { ManagedServer } from "./managed/server";
import { DbContext } from "./managed/database";
import { join } from "path";
import { DbClient, RunContext } from "vlquery";
import { createReadStream, exists, existsSync } from "fs";
import { readdir, readFile, stat, stat, stat } from "fs/promises";
import { lookup } from "mime-types";

DbClient.connectedClient = new DbClient({});

DbClient.connectedClient.connect().then(async () => {
	const app = new ManagedServer();
	const database = new DbContext(new RunContext());

	app.createInjector = context => new Inject({
		Context: context,
		DbContext: database
	});

	app.prepareRoutes();

	const root = join(process.cwd(), '..', 'root');

	app.app.get('/root/index', async (request, response) => {
		const index = [];

		const scan = async (base: string) => {
			for (let fileName of await readdir(join(root, base))) {
				if (fileName[0] != '.' || fileName == '.meta') {
					const source = join(root, base, fileName);
					const stats = await stat(source);

					const item: any = {
						name: join(base, fileName),
						source: join('root', 'blob', base, fileName),

						ctime: +stats.ctime,
						mtime: +stats.mtime
					}

					if (stats.isDirectory()) {
						item.type = 'd';
						item.size = 0;
					} else {
						item.type = 'f';
						item.size = stats.size;
						item.mime = lookup(base);

						if (fileName.endsWith('.lnk')) {
							const content = (await readFile(source)).toString().split('\n');

							item.link = {
								path: content[0],
								title: content[1],
								icon: content[2]
							};
						}
					}

					index.push(item);

					if (stats.isDirectory()) {
						await scan(join(base, fileName));
					}
				}
			}
		};

		await scan('c');

		response.json(index);
	});

	app.app.use('/root/blob', async (request, response) => {
		const path = join(root, request.path);
		console.log(path, request.path)

		if (!path.startsWith(root)) {
			console.log('path traversal attempted');

			return response.status(404).end();
		}

		if (!existsSync(path)) {
			console.log('not found', path);

			return response.status(404).end();
		}

		const stats = await stat(path);

		if (stats.isFile()) {
			return createReadStream(path).pipe(response);
		}

		console.log('not a file', path);
		response.status(500).end();
	});

	app.app.get('/config/init', (request, response) => {
		response.json({});
	});

	app.use(new StaticFileRoute('/', join(process.cwd(), '..', 'page')));
	app.app.use('*', (request, response) => response.sendFile(join(process.cwd(), '..', 'page', 'index.html')));

	ViewModel.globalFetchingContext = database;

	app.start(+process.env.PORT! || 2000);
});
