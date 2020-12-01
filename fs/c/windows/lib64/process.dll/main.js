/// process management
/// C 2019 levvij

// log unit
const unit = globalConsole.createUnit("process");

let topProcessId = 1;

function Process(path, arguments) {
	const name = Path.name(path);

	const checkExit = () => {
		if (public.exited) {
			throw new Error("Process " + name + " already exited with code: " + public.exitCode);
		}
	};

	const info = {};

	const public = {
		name,
		path,
		arguments,
		pid: topProcessId++,
		log: globalConsole.createUnit(name),
		onexit: Event("Process exit"),
		onnewwindow: Event("Process new window"),
		onnewtimer: Event("Process new timer"),
		ontimerstop: Event("Process timer stop"),
		onnewtray: Event("Process new tray"),
		ontrayremove: Event("Process tray remove"),
		onnewthread: Event("Process new thread"),
		onthreaddone: Event("Process thread done"),
		windows: [],
		timers: [],
		trays: [],
		threads: [],

		get memoryUsage() {
			return env.measure() + public.graphicsMemoryUsage;
		},
		get graphicsMemoryUsage() {
			let total = 0;

			for (let w of public.windows) {
				total += w.memoryUsage;
			}

			return total;
		},
		addWindow(w) {
			checkExit();

			w.process = public;

			w.onchildcreate.subscribe(child => {
				public.addWindow(child);
			});

			w.onclose.subscribe(() => {
				public.windows.splice(public.windows.indexOf(w), 1);
			});

			w.onerror.subscribe(e => {
				public.exit(e);
			});

			public.windows.push(w);

			public.onnewwindow(w);
			Process.onnewwindow(public, w);
		},
		addTimer(t) {
			checkExit();

			t.onstop.subscribe(() => {
				public.ontimerstop(t);
				Process.ontimerstop(public, t);
			});

			public.timers.push(t);

			public.onnewtimer(t);
			Process.onnewtimer(public, t);
		},
		addThread(t) {
			checkExit();

			t.ondone.subscribe(() => {
				public.onthreaddone(t);
				Process.onthreaddone(public, t);
			});

			public.threads.push(t);

			public.onnewthread(t);
			Process.onnewthread(public, t);
		},
		exit(error) {
			if (error) {
				public.log.warn("exit", error);
			} else {
				public.log.mark("exit");
			}

			if (Process.active.includes(public)) {
				Process.active.splice(Process.active.indexOf(public), 1);
			}

			public.exited = true;
			public.error = error;

			public.onexit(error);
			Process.onexit(public, error);

			for (let t of public.timers) {
				t.stop();
			}

			for (let p of public.windows) {
				p.close();
			}

			for (let p of public.trays) {
				p.remove();
			}
			
			if (public.vm) {
				public.vm.terminate();
			}
		},
		kill() {
			public.exit(Process.ExitCode.externallyExited);
		},
		createTray() {
			const t = new Tray(public);

			public.trays.push(t);

			public.onnewtray(t);
			Process.onnewtray(public, t);

			return t;
		},
		sleep(ms) {
			return new Promise(done => {
				setTimeout(() => done(), ms);
			});
		},
		out: {
			onmessage: Event("Process new output message")
		}
	};

	Process.active.push(public);
	Process.onstart(public);

	return public;
}

Process.onstart = Event("Process start");
Process.onexit = Event("Process exit");
Process.onnewwindow = Event("Process new window");
Process.onnewtimer = Event("Process new timer");
Process.ontimerstop = Event("Process timer stop");
Process.onnewtray = Event("Process new tray");
Process.ontrayremove = Event("Process remove tray");
Process.onnewthread = Event("Process new thread");
Process.onthreaddone = Event("Process thread done");

Process.active = [];

DLL.export("Process", Process);