UI.extend("Label", (env, text) => {
	const label = env.element("ui-label");

	label.bind("text", () => {
		return label.native.textContent;
	}, value => {
		label.native.textContent = value;
	});

	label.bind("clipLine", () => {
		return label.native.hasAttribute("ui-clip-line");
	}, v => {
		if (v) {
			label.native.setAttribute("ui-clip-line", "");
		} else {
			label.native.removeAttribute("ui-clip-line");
		}
	});

	text != undefined && (label.text = text);

	return label;
});