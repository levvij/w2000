UI.extend("TextArea", (env, initial) => {
	const input = env.element("textarea");

	input.bind("value", () => {
		return input.native.value;
	}, value => {
		input.native.value = value;
	});

	initial && (input.value = initial);
	input.event("onchange", "Textarea value change", e => e.target.value);

	return input;
});