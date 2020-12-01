/// core library
/// C 2019 levvij

// corelib loggin unit
const unit = globalConsole.createUnit("mscorlib");

// dll run
function DLL() {}

// all loaded modules
DLL.loadedModules = [];

// all modules (loading ones too)
DLL.modules = [];

// crossloader
DLL.crossload = {};

// load DLL
DLL.load = async (path, forceReload, files = ["/main.js"]) => {
	if (!forceReload) {
		const loaded = DLL.loadedModules.find(m => m.path == path);
		if (loaded) {
			unit.action("load", path, "cached");

			return loaded;
		}
	}

	unit.action(forceReload ? "force-load" : "load", path);

	const public = {
		path,
		name: path.split("/").pop(),
		exports: {},
		submodules: [],
		dependencies: []
	};

	DLL.modules.push(public);

	const private = {};

	let exeinfo;

	// check meta
	const loadMeta = async () => {
		exeinfo = await (global.fs ? await fs.exeinfo(path) : fetch(config.fs.root + path + "/meta.json?v=" + Math.random().toString(36).substr(2)).then(r => r.json()));

		for (let dll of exeinfo.dependencies) {
			await DLL.load(dll);
		}

		if (Version(config.version) < Version(exeinfo.requirements.os.version)) {
			throw new Error("Application '" + exeinfo.name + "' requires OS version '" + exeinfo.requirements.os.version + "' (Currently installed version is '" + config.version + "')");
		}
	};

	// inner load with body
	const load = (body, p) => {
		return new Promise(done => {
			const id = "_" + Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2) + +(new Date());
			DLL.crossload[id] = {};
			
			const fname = "library_" + path.replace(/[^a-zA-Z0-9]/g, "_");

			let compiledFunction;

			try {
				compiledFunction = (new(Object.getPrototypeOf(async function() {}).constructor)("DLL", "configuration", "// " + path + "\n\n" + body));
			} catch (e) {
				// throw parsing errors
				throw new Error(e.message.trim() + "@" + p);
			}
			
			const blob = new Blob([
				"DLL.crossload." + id + "." + fname + " = " + compiledFunction.toString().replace("anonymous", fname)
			], {
				type: "text/plain"
			});

			const script = document.createElement("script");
			script.src = URL.createObjectURL(blob);
			script.async = true;
			
			script.onload = () => {
				// run main dll function with DLL object (masked)
				DLL.crossload[id][fname]({
					path,
					private,
					loadedModules: DLL.loadedModules,
					modules: DLL.modules,
					async load(path) {
						// add dependency
						const dll = await DLL.load(path, forceReload);

						public.dependencies.push(dll);

						return dll;
					},
					export(name, value) {
						// add export

						public.exports[name] = value;
						global[name] = value;
					},
					resource(p) {
						return Path.fix(path + "/resources/" + p);
					},
					log: globalConsole.createUnit(p)
				}, exeinfo.configuration).then(() => {
					done();
				});
			};
			
			document.head.appendChild(script);
		});
	};

	// if fs is already loaded
	if (global.fs) {
		// search for path
		if (await fs.exists(path)) {
			await loadMeta();

			for (let file of files) {
				await load(await fs.read(path + "/" + file), Path.name(path));
			}

			for (let file of await fs.listAll(path)) {
				if (!files.map(f => Path.fix(path + "/" + f)).includes(file) && Path.ext(file) == "js") {
					unit.action("subload", file);

					await load(await fs.read(file), (Path.name(path) + "/" + Path.name(file)));

					public.submodules.push(file);
				}
			}
		} else {
			// use searchpaths to find dll
			const find = await fs.search(path, config.dll.paths);

			if (find) {
				// load dll with full name
				return await DLL.load(find, forceReload);
			} else {
				throw new Error("Cannot find '" + path + "'");
			}
		}
	} else {
		// load directly from fetch
		await loadMeta();

		for (let file of files) {
			await load(await (await fetch(config.fs.root + path + "/" + file + config.cacheArgs)).text(), path);
		}
	}

	// add to loaded modules (for caching / monitoring)
	DLL.loadedModules.push(public);

	return public;
};

// converts version string into a string for comparing
// up to 6 segments, each containing 3 digits
// format: 1.2.3.4.5.6~canary
function Version(str = "0") {
	const rc = str.split("-")[1];

	return [...str.split("-")[0].split(".").map(v => v.padStart(8, 0)), ...Array(16).fill("0".repeat(8))].slice(0, 16).join(".") + (rc ? "-" + rc : "");
}