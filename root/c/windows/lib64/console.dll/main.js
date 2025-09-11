// global error handlers
onerror = function (message, file, line, character, error) {
	console.error("FATAL ERROR", ...arguments);

	// remove error handler (so that if the error page crashes everything just stops and it looks super cool)
	onerror = () => {};

	globalConsole.unlock();
	globalConsole.errorMode();
	globalConsole.clear();

	// who actually thought these numbers are not fake?
	globalConsole.write("*** STOP: 0x" + ((line * character) || 0).toString(16).padStart(8, 0));
	globalConsole.write(" (0x" + (line || 0).toString(16).padStart(8, 0));
	globalConsole.write(",0x" + (character || 0).toString(16).padStart(8, 0));
	globalConsole.write(",0x" + ((error ? error.stack || error || "" : "").length || 0xffff).toString(16).padStart(8, 0) + ")\n");

	// print exception
	if (message || (error && !error.stack)) {
		message = message || error;

		globalConsole.writeln(message.toUpperCase());
	} else {
		globalConsole.writeln("B_UNKNOWN_EXCEPTION");
	}

	if (error instanceof Error) {
		const stack = error.stack.trim().split('\n').slice(1);

		globalConsole.writeln('');

		for (let source of stack) {
			// remove 'at' (any language compatible)
			source = source.trim().split(/\s/).slice(1).join(' ');

			const line = source.match(/([0-9]+)/g).at(-2);
			const column = source.match(/([0-9]+)/g).at(-1);

			// remove source file
			source = source.replace(`blob:${location.href}`, '');
			source = source.replace(/\(?[0-9a-f\-]+\:[0-9]+\:[0-9]+\)?/, '');

			globalConsole.writeln(`${line.toString().padStart(6, '.')} ${column.toString().padStart(4, '.')}  ${source}`);
		}
	}

	// report error to server
	fetch(config.error, {
		method: "POST",
		body: JSON.stringify({
			message: message,
			file: file,
			line: line,
			col: character,
			stack: error ? (error.stack ? error.stack : error) : null,
			cypp: typeof Cypp == "undefined" ? "" : Cypp.id
		})
	}).then(r => r.json()).then(async id => {
		// complete bsod (aint it cool that my reporting function has a delay?!)
		globalConsole.write("\n*** REPORTED 0x" + id.toString(16).padStart(8, 0) + "\n");

		if (error && error.scopeHandled) {
			const scope = error.scopeHandled;

			const show = async () => {
				globalConsole.writeln("*** SCOPED ERROR ***\n");
				globalConsole.writeln(error.message + "\n");
				globalConsole.write("*** PRESS ANY OTHER TO REBOOT *** ");
				globalConsole.lock();

				onkeyup = async e => {
					location.reload();
				};
			};

			await show();
		} else {
			globalConsole.write("*** " + (file || "UNKNOWN LOCATION") + " L" + line + ":C" + character + "\n\n");
			globalConsole.write(error ? "*** " + (error.stack ? "STACK" : "MESSAGE") + "\n" + (error.stack || (error ? "\n" + error : "\n")).split("\n").slice(1).map((l, i) => l.trim().replace("at ", "")).filter(l => l).join("\n") : "UNKNOWN ERROR");
			globalConsole.write("\n\n");

			// try to show more stack info
			globalConsole.write("*** EXTENDED STACK\n");
			globalConsole.write((new Error()).stack.split("\n").slice(1).map(l => l.trim().replace("at ", "")).filter(l => l).join("\n"));

			// show reboot message
			setTimeout(() => {
				globalConsole.write("\n\n*** PRESS ANY KEY TO REBOOT *** ");
				globalConsole.lock();

				// show some very unneeded mess on the screen just because we can
				onkeyup = () => {
					globalConsole.clear();

					location.reload();
				}
			}, 100);
		}
	});
};

// add handler for all promises
addEventListener("unhandledrejection", function(event) {
	console.log(event);

	onerror(event.reason.message, "[PROMISE]", 0, 0, event.reason);
});
