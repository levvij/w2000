/// timers
/// C 2019 levvij

function Timer(fx, time) {
	// create interval
	let handle = Timer.top = setInterval(fx, time);
	
	const public = {
		id: Cypp.createId(),
		onstop: Event("Timer stop"),
		running: true,
		fire() {
			fx();
		},
		stop(dismissEvent) {
			clearInterval(handle);
			public.running = false;
			
			if (!dismissEvent) {
				public.onstop();
			}
		},
		restart(t = time) {
			if (public.running) {
				public.stop(true);
			}
			
			public.running = true;
			
			handle = setInterval(fx, t);
			time = t;
		},
		set time(value) {
			public.restart(value);
		},
		get time() {
			return time;
		}
	};
	
	return public;
}

DLL.export("Timer", Timer);