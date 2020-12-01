async function main() {
	const path = await Path.programData(process.path) + "/services.json";

	if (!(await fs.exists(path))) {
		await fs.create(path, JSON.stringify({
			versionFormat: configuration.version,
			services: []
		}));
	}

	const content = JSON.parse(await fs.read(path));

	if (configuration.version == content.versionFormat) {		
		if (process.arguments.has("r")) {
			const service = process.arguments.get("r");
			const old = content.services.find(t => t.id == service.id);

			if (!service.id) {
				throw new Error("Cannot register service: id missing");
			}
			
			if (!service.start) {
				throw new Error("Cannot register service: start missing");
			}
			
			if (!service.name) {
				throw new Error("Cannot register service: name missing");
			}
			
			application.out.write("Registering service " + service.name + " [" + service.id + "]");
			
			if (old) {
				application.out.write("Removing old service version");

				if (old.uninstall) {
					application.out.write("Running uninstaller...");
					
					const app = await Application(...old.uninstall);
					await app.startAndWaitForExit();
				}

				content.services.splice(content.services.indexOf(old), 1);
				
				application.out.write("Uninstalled old version");
			}

			content.services.push(service);
			await fs.write(path, JSON.stringify(content));

			if (process.arguments.has("s")) {
				application.out.write("Starting service...");

				await Application.load(...service.start);
			}

			exit();
		} else if (process.arguments.has("l")) {
			for (let service of content.services) {
				application.out.write(service.id + ": " + service.name);
			}
			
			exit();
		} else if (process.arguments.has("s")) {
			const service = content.services.find(s => s.id == arguments.get("s"));
			
			if (!service) {
				throw new Error("Service with id '" + process.arguments.get("s") + "' does not exist");
			}
			
			const app = await Application(...service.start);

			if (process.arguments.has("a")) {
				await app.startAndWaitForSuccessfulExit();
			} else {
				app.start();
			}
			
			exit();
		} else if (process.arguments.has("x")) {
			const service = content.services.find(s => s.id == process.arguments.get("x"));
			
			if (!service) {
				throw new Error("Service with id '" + process.arguments.get("x") + "' does not exist");
			}
			
			application.out.write("Removing service " + service.name);

			if (!process.arguments.has("f")) {
				if (service.uninstall) {
					application.out.write("Running uninstaller...");

					const app = await Application(...old.uninstall);
					await app.startAndWaitForExit();
				}
			}

			content.services.splice(content.services.indexOf(service), 1);
			await fs.write(path, JSON.stringify(content));
			
			application.out.write("Uninstalled service");
			
			exit();
		} else {
			for (let service of content.services) {
				application.out.write("starting " + service.start[0] + "...");

				const app = await Application(...service.start);

				if (process.arguments.has("a")) {
					await app.startAndWaitForSuccessfulExit();
				} else {
					app.start();
				}

				application.out.write("completed " + service.start[0] + "...");
			}

			exit();
		}
	} else {
		throw new Error("Invalid services.json format version '" + content.versionFormat + "'");
	}
}