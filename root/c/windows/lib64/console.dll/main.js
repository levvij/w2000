// global error handlers
onerror = function (message, file, line, character, error) {
	console.error("FATAL ERROR", ...arguments);

	// remove error handler (so that if the error page crashes everything just stops and it looks super cool)
	onerror = () => {};

	globalConsole.unlock();
	globalConsole.errorMode();
	globalConsole.clear();

	// who actually thought these numbers are not fake?
	globalConsole.write("*** STOP: 0x" + ((line * character) || 0).toString(16).padStart(8, 0), true);
	globalConsole.write(" (0x" + (line || 0).toString(16).padStart(8, 0), true);
	globalConsole.write(",0x" + (character || 0).toString(16).padStart(8, 0), true);
	globalConsole.write(",0x" + ((error ? error.stack || error || "" : "").length || 0xffff).toString(16).padStart(8, 0) + ")\n", true);

	// print exception
	if (message || (error && !error.stack)) {
		message = message || error;

		globalConsole.writeln(message.toUpperCase(), true);
	} else {
		globalConsole.writeln("B_UNKNOWN_EXCEPTION", true);
	}

	if (error instanceof Error) {
		const stack = error.stack.trim().split('\n').slice(1);

		globalConsole.writeln('', true);

		for (let source of stack) {
			// remove 'at' (any language compatible)
			source = source.trim().split(/\s/).slice(1).join(' ');

			const line = source.match(/([0-9]+)/g).at(-2);
			const column = source.match(/([0-9]+)/g).at(-1);

			// remove source file
			source = source.replace(`blob:${location.href}`, '');
			source = source.replace(/\(?[0-9a-f\-]+\:[0-9]+\:[0-9]+\)?/, '');

			globalConsole.writeln(`${line.toString().padStart(6, '0')} ${column.toString().padStart(4, '0')}  ${source}`, true);
		}
	}

	setTimeout(() => {
		globalConsole.write("\n\n*** PRESS ENTER KEY TO REBOOT *** ", true);
		globalConsole.lock();

		// show some very unneeded mess on the screen just because we can
		onkeyup = event => {
			if (event.key == 'Enter') {
				globalConsole.clear();

				location.reload();
			}
		}
	}, 100);
};

// add handler for all promises
addEventListener("unhandledrejection", function(event) {
	console.log(event);

	onerror(event.reason.message, "[PROMISE]", 0, 0, event.reason);
});
