// global error handlers
onerror = function (m, f, l, c, e) {
	console.error("FATAL ERROR", ...arguments);
	
	// remove error handler (so that if the error page crashes everything just stops and it looks super cool)
	onerror = () => {};
	
	globalConsole.unlock();
	globalConsole.errorMode();
	globalConsole.clear();
	
	// who actually thought these numbers are not fake?
	globalConsole.write("*** STOP: 0x" + ((l * c) || 0).toString(16).padStart(8, 0));
	globalConsole.write(" (0x" + (l || 0).toString(16).padStart(8, 0));
	globalConsole.write(",0x" + (c || 0).toString(16).padStart(8, 0));
	globalConsole.write(",0x" + ((e ? e.stack || e || "" : "").length || 0xffff).toString(16).padStart(8, 0) + ")\n");
	
	// print exception
	if (m || (e && !e.stack)) {
		m = m || e;
		
		globalConsole.writeln(m.toUpperCase());
	} else {
		globalConsole.writeln("B_UNKNOWN_EXCEPTION");
	}
	
	// report error to server
	fetch(config.error, {
		method: "POST",
		body: JSON.stringify({
			message: m,
			file: f,
			line: l,
			col: c,
			stack: e ? (e.stack ? e.stack : e) : null,
			cypp: typeof Cypp == "undefined" ? "" : Cypp.id
		})
	}).then(r => r.json()).then(async id => {
		// complete bsod (aint it cool that my reporting function has a delay?!)
		globalConsole.write("\n*** REPORTED 0x" + id.toString(16).padStart(8, 0) + "\n");
		
		if (e && e.scopeHandled) {
			const scope = e.scopeHandled;
			
			const show = async () => {
				globalConsole.writeln("*** SCOPED ERROR ***\n");
				globalConsole.writeln(e.message + "\n");
				globalConsole.write("*** PRESS ANY OTHER TO REBOOT *** ");
				globalConsole.lock();

				onkeyup = async e => {
					location.reload();
				};
			};
			
			await show();
		} else {
			globalConsole.write("*** " + (f || "UNKNOWN LOCATION") + " L" + l + ":C" + c + "\n\n");
			globalConsole.write(e ? "*** " + (e.stack ? "STACK" : "MESSAGE") + "\n" + (e.stack || (e ? "\n" + e : "\n")).split("\n").slice(1).map((l, i) => l.trim().replace("at ", "")).filter(l => l).join("\n") : "UNKNOWN ERROR");
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