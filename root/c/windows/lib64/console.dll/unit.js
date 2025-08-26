// logging unit
function Unit(con, name, level) {
	const public = {
		action(act, ...data) {
			console.log("%c[" + name + "/" + act + "]%c", config.globalConsole.action, "", ...data);
			
			con.write("[");
			con.foreground = "var(--action)";
			con.write(name + "/" + act);
			con.foreground = "";
			con.writeln("] " + data.join(" "));
			
			public.onmessage && public.onmessage("[" + name + "/" + act + "] " + data.join(" "));
		},
		mark(act, ...data) {
			console.log("%c[" + name + "/" + act + "]%c", config.globalConsole.mark, "", ...data);
			
			con.write("[");
			con.foreground = "var(--mark)";
			con.write(name + "/" + act);
			con.foreground = "";
			con.writeln("] " + data.join(" "));
			
			public.onmessage && public.onmessage("[" + name + "/" + act + "] " + data.join(" "));
		},
		warn(act, ...data) {
			console.warn("%c[" + name + "/" + act + "]%c", config.globalConsole.warn, "", ...data);
			
			con.write("[");
			con.foreground = "var(--warn)";
			con.write(name + "/" + act);
			con.foreground = "";
			con.writeln("] " + data.join(" "));
			
			public.onmessage && public.onmessage("[" + name + "/" + act + "] " + data.join(" "));
		},
		error(act, ...data) {
			console.error("%c[" + name + "/" + act + "]%c", config.globalConsole.error, "", ...data);
			
			con.write("[");
			con.foreground = "var(--error)";
			con.write(name + "/" + act);
			con.foreground = "";
			con.writeln("] " + data.join(" "));
			
			public.onmessage && public.onmessage("[" + name + "/" + act + "] " + data.join(" "));
		},
		info(act, ...data) {
			console.info("%c[" + name + "/" + act + "]%c", config.globalConsole.info, "", ...data);
		}
	}
	
	if (global.Event && global.Event.all) {
		public.onmessage = Event("Unit message");
	}
	
	return public;
}