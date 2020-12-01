async function main() {
	const path = configuration.providers.replace("%p", await Path.programData(process.path));

	if (!(await fs.exists(path))) {
		application.log.action("main", "creating providers directory", path);
		await fs.mkdir(path);
	}

	if (process.arguments.has("m")) {
		let added = false;

		for (let type of fs.availableProviders) {
			const typePath = configuration.list.replace("%p", path).replace("%t", type);

			application.log.action("mount/" + type, typePath);

			if (await fs.exists(typePath)) {
				for (let p of JSON.parse(await fs.read(typePath))) {
					application.log.action("mount/" + type, "adding provider...", p);
					
					try {
						await fs.addProvider(type, p);
					} catch (e) {
						UI.ErrorBox("network drive / " + type, e + "");
					}

					added = true;
				}
			} else {
				application.log.action("mount/" + type, "no drives found");
			}
		}

		exit();
	} else {
		const wizard = new Wizard({
			title: "FTP Wizard",
			welcome: "Welcome to the FTP Wizard",
			description: "You can create a new connection to a FTP Server using this wizard.",
			image: application.resource("wizard.png"),
			steps: [
				{
					title: "FTP Connection type",
					description: "Select the type of FTP based on your server",
					render(ui, root, onchange) {
						const input = ui.RadioSelect([
							{
								title: "Classic FTP",
								description: "Standard FTP connection",
								value: "ftpsp"
							},
							{
								title: "Secure FTP (FTPS)",
								description: "Secure FTP connection over TLS",
								disabled: true,
								value: "ftpssp"
							},
							{
								title: "FTP over SSH (SFTP)",
								description: "Secure FTP connection over TLS",
								disabled: true,
								value: "sftpsp"
							}
						]);
						
						input.onchange.subscribe(() => onchange());
						root.add(input);
						
						return {
							get() {
								return input.value;
							},
							set(value) {
								input.value = value;
							},
							valid() {
								return !!input.value;
							}
						};
					}
				},
				{
					title: "Host",
					description: "Enter the server name or IP of the FTP Server",
					render(ui, root, onchange) {
						root.add(ui.Label("Type the host name or IP address of the computer or network to which you are connecting.")).margin = "0 0 10px 0";
						root.add(ui.Label("Host name or IP address (such as google.com or 123.45.6.78)")).margin = "0 0 3px 0";
						
						const host = root.add(ui.TextBox(""));
						host.onchange.subscribe(() => onchange());
						
						root.add(ui.Label("Port (default: 21)")).margin = "10px 0 3px 0";
						
						const port = root.add(ui.TextBox("21", "number"));
						port.onchange.subscribe(() => onchange());
						
						return {
							get() {
								return [
									host.value,
									port.value
								];
							},
							set(value) {
								host.value = value[0];
								port.value = value[1];
							},
							valid() {
								return host.value.length && port.value;
							}
						}
					}
				},
				{
					title: "Credentials",
					description: "Enter the servers FTP credentials",
					render(ui, root, onchange) {
						root.add(ui.Label("Type your user information to connect to the FTP server.")).margin = "0 0 10px 0";
						root.add(ui.Label("Username")).margin = "0 0 3px 0";
						
						const username = root.add(ui.TextBox(""));
						username.onchange.subscribe(() => onchange());
						
						root.add(ui.Label("Password")).margin = "10px 0 3px 0";
						
						const password = root.add(ui.TextBox("", "password"));
						password.onchange.subscribe(() => onchange());
						
						return {
							get() {
								return [
									username.value,
									password.value
								];
							},
							set(value) {
								username.value = value[0];
								password.value = value[1];
							},
							valid() {
								return username.value.length;
							}
						}
					}
				},
				{
					title: "Name",
					description: "Enter a name for your FTP connection",
					render(ui, root, onchange) {
						root.add(ui.Label("Type a name for your FTP connection. This name will be visible in \"My Computer\"")).margin = "0 0 10px 0";
						root.add(ui.Label("Name")).margin = "0 0 3px 0";
						
						const name = root.add(ui.TextBox(wizard.results[1][0] + " - FTP"));
						name.onchange.subscribe(() => onchange());
						
						return {
							get() {
								return name.value;
							},
							set(v) {
								name.value = v;
							},
							valid() {
								return name.value.length;
							}
						};
					}
				},
				{
					title: "Advanced Settings",
					description: "Change advanced properties of your connection",
					render(ui, root, onchange) {
						root.add(ui.Label("Default Settings"));
						root.add(ui.Label("Proxy Server (default: " + configuration.defaultProxy + ")")).margin = "0 0 3px 0";
						
						const proxy = root.add(ui.TextBox(configuration.defaultProxy));
						proxy.onchange.subscribe(() => onchange());
						
						root.add(ui.Label("Initial Directory")).margin = "10px 0 3px 0";
						
						const initialDirectory = root.add(ui.TextBox(""));
						initialDirectory.onchange.subscribe(() => onchange());
						
						root.add(ui.Label("FSP Order (default: 800)")).margin = "10px 0 3px 0";
						
						const order = root.add(ui.TextBox(800, "number"));
						order.onchange.subscribe(() => onchange());
						
						return {
							get() {
								return [
									proxy.value,
									initialDirectory.value,
									order.value
								];
							},
							set(value) {
								proxy.value = value[0];
								initialDirectory.value = value[1];
								order.value = value[2];
							},
							valid() {
								return true;
							}
						}
					}
				},
				{
					title: "Connecting to FTP Server...",
					description: "Trying to connect to the FTP server...",
					install() {
						let config;
						
						return [
							{
								title: "Adding connection information to persistent connections file",
								async action() {
									const p = configuration.list.replace("%p", path).replace("%t", "ftpsp");
									
									if (!(await fs.exists(p))) {
										await fs.create(p, "[]");
									}
									
									config = {
										type: wizard.results[0],
										order: +wizard.results[4][2].trim(),
										name: wizard.results[3].trim(),
										proxy: wizard.results[4][0].trim(),
										host: wizard.results[1][0].trim(),
										port: +wizard.results[1][1].trim(),
										user: wizard.results[2][0].trim(),
										password: wizard.results[2][1],
										initialDirectory: wizard.results[4][1].trim()
									};
									
									const items = JSON.parse(await fs.read(p));
									items.push(config);
									await fs.write(p, JSON.stringify(items));
								}
							},
							{
								title: "Adding provider to file system",
								async action() {
									await fs.addProvider(config.type, config);
								}
							},
							{
								title: "Reloading file system...",
								async action() {
									await fs.reload();
								}
							}
						];
					}
				}
			],
			onfinish() {
				application.log.mark("AAA", wizard.results);
			}
		});
	}
}