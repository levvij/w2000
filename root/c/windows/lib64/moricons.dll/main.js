const scaleCache = {};
const moduleCache = {};
const pathCache = {};

const scaled = async (img, sizes) => {
	for (let size of sizes) {
		if (scaleCache[img + size]) {
			return scaleCache[img + size];
		}
	}

	for (let q of configuration.qualities) {
		for (let s of [...sizes, -1, ...configuration.sizes]) {
			if (await fs.exists(img + "/" + s + "/" + q + ".png")) {
				return scaleCache[img + s] = (img + "/" + s + "/" + q + ".png");
			}
		}
	}
};

const Icon = {
	async from(any, ...sizes) {
		if (Path.ext(any) == "png" && await fs.exists(any)) {
			return any;
		}

		if (any.split("/").length == 2) {
			const fm = await Icon.fromModule(any.split("/")[0], any.split("/")[1], ...sizes);

			if (fm) {
				return fm;
			}
		}

		return await Icon.fromPath(any, ...sizes);
	},
	async fromPath(path, ...sizes) {
		if (!path) {
			return await Icon.computer(...sizes);
		}

		if (await fs.isDisk(path)) {
			return await Icon.disk(...sizes);
		}

		if (await fs.exists(path)) {
			if (await fs.isLink(path)) {
				const resolve = await fs.resolve(path);

				if (resolve.icon) {
					return await Icon.from(resolve.icon, ...sizes);
				}

				if (resolve.path != path) {
					return await Icon.from(resolve.path, ...sizes);
				}
			}

			if (await fs.isExecuteable(path)) {
				const meta = await Path.exeInfo(path);

				if (meta && meta.icon) {
					return await Icon.from(meta.icon, ...sizes);
				}
			}

			if (await fs.isNotExecuteableDirectory(path)) {
				return await Icon.directory(...sizes);
			}
		}

		return await Icon.fromExt(Path.ext(path), ...sizes);
	},
	async fromExt(ext, ...sizes) {
		if (!ext) {
			return await Icon.directory(...sizes);
		}

		if (ext == "exe") {
			return await Icon.program(...sizes);
		}

		if (ext == "dll") {
			return await Icon.library(...sizes);
		}

		const extinfo = await Path.extInfo(ext);

		if (extinfo && extinfo.icon) {
			return await Icon.from(extinfo.icon, sizes);
		}

		return await Icon.default(...sizes);
	},
	async fromModule(module, address, ...sizes) {
		if (module.includes("/")) {
			return await Icon.fromModule(module.split("/")[0], module.split("/")[1], address, ...sizes);
		}

		if (moduleCache[module + address]) {
			return await scaled(moduleCache[module + address], sizes);
		}

		for (let path of config.dll.paths) {
			for (let file of await fs.list(path)) {
				if (Path.nameWithoutExt(file) == module) {
					const path = configuration.moduleInner.replace("%f", file).replace("%a", address);
					
					if (await fs.exists(path)) {
						moduleCache[module + address] = path;
						
						return await scaled(path, sizes);
					}
				}
			}
		}
	}
};

for (let key in configuration.statics) {
	Icon[key] = async (...sizes) => {
		return await Icon.from(configuration.statics[key], ...sizes);
	}
}

DLL.export("Icon", Icon);