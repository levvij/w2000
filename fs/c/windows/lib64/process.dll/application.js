const unit = globalConsole.createUnit("application");

function Application(path, ...args) {
	return new Promise(async done => {
		unit.action("load", path, ...args);

		const exeinfo = await Path.exeInfo(path);

		for (let dll of exeinfo.dependencies) {
			await DLL.load(dll);
		}

		if (Version(config.version) < Version(exeinfo.requirements.os.version)) {
			throw new Error("Application '" + exeinfo.name + "' requires OS version '" + exeinfo.requirements.os.version + "' (Currently installed version is '" + config.version + "')");
		}

		const process = new Process(path, args);
		process.log.mark("start");

		const proxies = {
			Window: {
				object: Window,
				construct() {
					return function(...args) {
						const w = new Window(...args);
						process.addWindow(w);

						return w;
					};
				},
				set(k, value) {
					Window[k] = value;
				},
				get(k) {
					return Window[k];
				}
			},
			Timer: {
				object: {
					get top() {
						return Timer.top;
					}
				},
				construct() {
					return function(fx, time) {
						const t = new Timer(fx, time);
						process.addTimer(t);

						return t;
					};
				},
				get(k) {
					return Timer[k];
				}
			},
			Thread: {
				object: {},
				construct() {
					return function(...args) {
						const thread = DLL.private.thread(args.pop(), args);
						process.addThread(thread);

						return thread;
					}
				}
			}
		};

		const proxy = prop => {
			const f = prop.construct();

			for (let k in prop.object) {
				Object.defineProperty(f, k, {
					get() {
						return prop.get(k);
					},
					set(value) {
						prop.set(k, value);
					}
				});
			}

			return f;
		};

		args.has = p => {
			return args.includes("-" + p) || args.includes("/" + p);
		};

		args.get = (p, osse = 0) => {
			return args[((args.indexOf("-" + p) + 1) || (args.indexOf("/" + p) + 1) || -1) + osse];
		};

		const exports = {};

		for (let dll of DLL.loadedModules) {
			for (let exp in dll.exports) {
				exports[exp] = dll.exports[exp];
			}
		}

		const persistentState = {};
		const persistentPath = await Path.programData(path) + "/pstate.json";

		if (await fs.exists(persistentPath)) {
			const d = JSON.parse(await fs.read(persistentPath)).state;

			for (let k in d) {
				persistentState[k] = d[k];
			}
		}

		persistentState.save = async () => {
			let f = "";
			for (let part of persistentPath.split("/")) {
				if (!(await fs.exists(f + part))) {
					await fs.mkdir(f + part);
				}

				f += part + "/"
			}

			if (!(await fs.exists(persistentPath))) {
				await fs.create(persistentPath, "{}");
			}

			await fs.write(persistentPath, JSON.stringify({
				value: exeinfo.version,
				state: persistentState
			}));
		};

		if (!(await fs.exists(persistentPath))) {
			for (let key in (exeinfo.initialPersistentState || {})) {
				persistentState[key] = exeinfo.initialPersistentState[key];
			}

			await persistentState.save();
		}

		const params = {
			...exports,

			application: {
				persistentState,
				path,
				log: process.log,
				out: {
					write(text) {
						text = text + "";

						process.out.onmessage(text);
						process.log.info("*", text);
					}
				},
				arguments: args,
				process,
				async resource(p) {
					const pp = Path.fix(path + "/resources/" + p);

					if (await fs.exists(pp)) {
						return Path.fix(pp);
					}

					throw new Error("Resource '" + p + "' not found");
				}
			},
			configuration: exeinfo.configuration,
			process,
			fs,
			DLL,
			console,
			exit: process.exit
		};

		for (let key in proxies) {
			params[key] = proxy(proxies[key]);
		}

		if (await fs.exists(path)) {
			requestAnimationFrame(async () => {
				let content = "";
				const poolId = `pool_${Cypp.createId()}`;
				
				for (let file of [
					path + "/init.js",
					...(await fs.listAll(path)).filter(l => Path.name(l) != "main.js" && Path.name(l) != "init.js"),
					path + "/main.js"
				]) {
					if (Path.ext(file) == "js" && await fs.exists(file) && !file.startsWith(Path.fix(path + "/resources"))) {
						content += "\n\n/* " + file + " */\n" + await fs.read(file);
					}
				}
				
				// create script
				const script = document.createElement("script");
				script.setAttribute("application", path);
				script.setAttribute("poolid", poolId);
				
				const keys = [...Object.keys(window), ...Object.keys(params)].filter((e, i, a) => a.indexOf(e) == i);
				
				const blob = new Blob([
					`Application[${JSON.stringify(poolId)}] = function (${keys}) { ${content}; main(process.arguments); }`
				]);
				
				// assign arguments
				script.src = URL.createObjectURL(blob);
				script.onload = () => {
					const app = {
						start() {
							Application[poolId](...keys.map(k => params[k]));
						},
						startAndWaitForExit() {
							return new Promise(done => {
								process.onexit.subscribe(error => {
									done(error);
								});
								
								app.start();
							});
						},
						startAndWaitForSuccessfulExit() {
							return new Promise((done, reject) => {
								process.onexit.subscribe(error => {
									if (error) {
										reject(new Error("Application exited with error: '" + error + "'"));
									}
									
									done(error);
								});
								
								app.start();
							});
						},
						process
					};
					
					done(app);
				};
		
				document.head.appendChild(script);
			});
		} else {
			throw new Error("Application " + path + " does not exist");
		}
	});
}

// edit file in appropriate software
Application.edit = async path => {
	unit.action("edit", path);

	const extinfo = await Path.extInfo(Path.ext(path));

	if (extinfo && extinfo.editor) {
		return await Application.load(extinfo.editor, path);
	} else {
		return await Application.load(await Path.extInfo("*").editor, path);
	}
};

// open / run file in appropriate software
// follows links
// opens exes
Application.run = async (path, ...args) => {
	unit.action("run", path, ...args);

	if (global.Cursor) {
		Cursor.type = await Cursor.load("busy");
	}

	// open links in browser
	for (let protocol of ["http://", "https://", "nttp://"]) {
		if (path.startsWith(protocol)) {
			return await Application.load(await Path.extInfo(protocol).opener, path);
		}
	}

	if (await fs.isNotExecuteableDirectory(path)) {
		return await Application.load((await Path.extInfo(".")).opener, path, ...args);
	}

	switch (Path.ext(path)) {
		case "exe":
			{
				return await Application.load(path, ...args);
			}
		case "lnk":
			{
				return await Application.run((await fs.resolve(path)).path, ...args);
			}
		default:
			{
				const extinfo = await Path.extInfo(Path.ext(path));

				if (extinfo && extinfo.opener) {
					return await Application.load(extinfo.opener, path, ...args);
				} else {
					throw new Error("Can't open or run '" + Path.fix(path) + "'");
				}
			}
	}
};

// load application with arguments
Application.load = (path, ...args) => {
	return new Promise(done => Application(path, ...args).then(instance => {
		instance.start();

		done(instance.process);
	}));
};

DLL.export("Application", Application);
