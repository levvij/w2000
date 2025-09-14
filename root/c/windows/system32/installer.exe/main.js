async function main() {
	if (!process.arguments[0]) {
		for (let file of await fs.list(configuration.msi)) {
			if (file in application.persistentState) {
				continue;
			}

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

			application.log.action("install/" + content.name, 'marking complete');

			application.persistentState[file] = true;
			application.persistentState.save();

			application.log.action("install/" + content.name, "installed");
		}
	}

	exit();
}
