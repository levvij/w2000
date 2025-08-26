UI.extend("TextBox", (env, initial, type, placeholder) => {
	const textbox = env.element("ui-textbox");
	const input = env.element("input");

	textbox.bind("value", () => {
		return input.native.value;
	}, value => {
		input.native.value = value;
	});
	
	textbox.bind("type", () => {
		return input.native.type;
	}, value => {
		input.native.type = value;
	});
	
	textbox.bind("placeholder", () => {
		return input.native.placeholder;
	}, value => {
		input.native.placeholder = value;
	});

	initial && (textbox.value = initial);
	type && (textbox.type = type);
	placeholder && (textbox.placeholder = placeholder);
	
	textbox.onchange = new Event("Textbox value change");
	textbox.add(input);
	
	input.native.onchange = () => {
		textbox.onchange(input.value);
	};

	return textbox;
});