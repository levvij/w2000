function main() {
	const window = new Window("cmd.exe " + (process.arguments[0] || ""), 500, 300);
	window.onclose.subscribe(() => exit());

	window.state.path = process.arguments[0] || configuration.defaultPath;
	window.state.buffer = "";

	const shell = new Shell(window.state.path);

	if (process.arguments.has("h")) {
		window.min();
	}

	window.render(async ui => {
		const scroll = ui.Scroll();
		ui.root.add(scroll);

		const box = ui.ColorConsole();
		scroll.add(box);

		const clear = () => {
			window.state.buffer = "";
			box.console.clear();
		};

		const insert = t => {
			box.console.write(t);
			window.state.buffer += t;
		};

		const showPS1 = () => {
			box.console.write(shell.ps1);
		};

		shell.onerror = message => {
			const color = box.console.foreground;

			box.console.foreground = "red";
			box.console.write(message);
			box.console.foreground = color;
		};

		shell.onout = message => {
			box.console.write(message);
		};

		shell.onclear = () => {
			clear();
		};

		for (let key of " qwertzuiopasdfghjklyxcvbnm,.-1234567890'/\":") {
			window.bindKey(key, () => {
				insert(key);
			});
		}

		window.bindKey("backspace", () => {
			if (window.state.buffer.length) {
				box.console.write("\b \b");
				window.state.buffer = window.state.buffer.slice(0, -1);
			}
		});

		window.bindKey("enter", async () => {
			box.console.write("\n");

			await shell.run(window.state.buffer);

			window.state.buffer = "";
			showPS1();
		});

		if (await fs.exists(window.state.path)) {
			if (await fs.isFile(window.state.path)) {
				await shell.runBatch(await fs.read(window.state.path));

				window.close();
			} else {
				clear();

				box.console.writeln(Management.os.productName + " [Version " + Management.os.version + "]\n" + Management.os.copyright.text + "\n");
				showPS1();
			}
		} else {
			const p = window.state.path;
			window.state.path = "";

			clear();
			box.console.writeln("path '" + p + "' does not exist");
		}

		window.onresize.subscribe(() => {
			box.console.resize();
		});
	});
}