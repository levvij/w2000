UI.extend("FixedText", (env, text) => {
	const label = env.element("ui-pre");

	label.bind("text", () => {
		return label.native.textContent;
	}, value => {
		label.native.textContent = value;
	});

	text != undefined && (label.text = text);

	return label;
});