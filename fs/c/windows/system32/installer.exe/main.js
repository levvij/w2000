async function main() {
	if (!process.arguments[0]) {
		for (let file of await fs.list(configuration.msi)) {
			const content = JSON.parse(await fs.read(file));

			application.log.action("install/" + content.name, content);

			if (content.services) {
				for (let service of content.services) {
					application.log.action("install/" + content.name, "installing service...", service);

					const process = await Application.load(...configuration.registerService.replace("%f", service));
					await new Promise(done => {
						process.onexit.subscribe(() => {
							done();
						});
					});

					application.log.action("install/" + content.name, "service installed");
				}
			}

			application.log.action("install/" + content.name, "deleting installer...", file);
			await fs.delete(file);

			application.log.action("install/" + content.name, "installed");
		}
	}

	exit();
}