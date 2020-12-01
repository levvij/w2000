UI.extend("Slider", (env, value, min, max, steps) => {
	// slider locks when its beeing moved, 
	// to prevent value changes caused by timers from making the knob move
	let locked;
	const input = env.element("input");
	input.native.type = "range";

	input.native.onmousedown = () => {
		locked = true;
	};

	input.native.onmouseup = () => {
		locked = false;
	};

	// current value
	input.bind("value", () => {
		return input.native.value;
	}, value => {
		if (!locked) {
			input.native.value = value;
		}
	});

	// min value
	input.bind("min", () => {
		return input.native.min;
	}, value => {
		input.native.min = value;
	});

	// max value
	input.bind("max", () => {
		return input.native.max;
	}, value => {
		input.native.max = value;
	});

	// steps
	input.bind("steps", () => {
		return input.native.steps;
	}, value => {
		input.native.steps = value;
	});

	// disabled
	input.bind("disabled", () => {
		return input.native.disabled;
	}, value => {
		input.native.disabled = value;
	});

	// defaults
	input.max = max || 100;
	input.min = min || 0;
	input.value = value;
	input.steps = steps || 1;

	input.onchange = new Event("Slider value change");

	let old = value;
	input.native.onchange = () => {
		input.onchange(input.native.value, old);
		old = input.native.value;
	};

	return input;
});