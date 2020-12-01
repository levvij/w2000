function Shell(path) {
	if (!path) {
		throw new Error("Shell has no path defined");
	}
	
	const shellex = buffer => Array.from(buffer.match(/(\"([\S\t ]*?)\")|\S*/g) || []).filter(p => p).map(v => v[0] == "\"" ? v.slice(1, -1) : v);

	const public = {
		echo: true,
		get ps1() {
			return path + "> ";
		},
		onout: Event("Shell out"),
		onerror: Event("Shell error"),
		onclear: Event("Shell clear"),
		run(text) {
			return new Promise(async done => {
				const parts = shellex(text);

				if (parts.length) {
					switch (parts[0]) {
						case "echo":
							{
								public.onout(parts.slice(1).join(" ") + "\n");
								done();
								
								break;
							}
						case "clear":
							{
								public.onclear();
								done();
								
								break;
							}
						case "dir":
							{
								public.onout(await fs.list(Path.abs(parts[1], path)).join("\n") + "\n");
								done();
								
								break;
							}
						default:
							{
								const paths = [path, ...config.path];
								const program = (await fs.search(parts[0], paths)) || (await fs.search(parts[0] + ".exe", paths));
								
								if (program) {
									const instance = await Application(program, ...parts.slice(1));
									
									instance.process.out.onmessage.subscribe(message => {
										public.onout(message + "\n");
									});
									
									instance.process.onexit.subscribe(code => {
										if (code) {
											public.onerror("Program exited with error: " + code + "\n");
										}
										
										done(code);
									});
									
									instance.start();
								} else {
									public.onerror("No program or shell internal '" + parts[0] + "' found\n");
									
									done();
								}
							}
					}
				} else {
					done(0);
				}
			});
		},
		runBatch(text) {
			return new Promise(done => {
				const lines = text.split("\n").map(l => l.trim());
				let index = -1;
				const jumps = {};

				const next = async () => {
					index++;

					const line = lines[index];

					if (index < lines.length) {
						const elements = shellex(line);

						if (!line || line[0] == ";") {
							next();
						} else if (line[0] == ":") {
							jumps[line.substr(1)] = index;

							setTimeout(() => next(), configuration.commandDelay);
						} else if (line[0] == "@" && elements[0] == "@echo") {
							public.echo = elements[1] == "on";

							setTimeout(() => next(), configuration.commandDelay);
						} else if (elements[0] == "goto") {
							index = jumps[elements[1]];

							setTimeout(() => next(), configuration.commandDelay);
						} else {
							await public.run(line);

							setTimeout(() => next(), configuration.commandDelay);
						}
					} else {
						done();
					}
				};

				next();
			});
		}
	}

	return public;
}

DLL.export("Shell", Shell);