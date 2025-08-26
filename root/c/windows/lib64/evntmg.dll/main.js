/// events
/// C 2019 levvij

function Event(name) {
	// every event is callable to trigger it, so we create a function
	const public = function (...args) {
		// log event call
		Event.calls.push({
			time: new Date(),
			event: public,
			arguments: args
		});
		
		for (let sub of public.subscribers) {
			sub(...args);
		}
	}
	
	// add properties
	public.eventName = name;
	public.subscribers = [];
	
	// subscribes function to event
	public.subscribe = fx => {
		public.subscribers.push(fx);
		
		return fx;
	};
	
	// add event to event list
	Event.all.push(public);
	
	return public;
}

// subscribe to multiple events
Event.subscribe = function (...args) {
	const f = args[args.length - 1];
	
	for (let i = 0; i < args.length - 1; i++) {
		args[i].subscribe(f);
	}
	
	return f;
}

// all event instances
Event.all = [];
Event.calls = [];

DLL.export("Event", Event);