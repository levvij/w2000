UI.extend("Title", (env, text, level) => {
	const label = env.element("ui-title");

	label.bind("text", () => {
		return label.native.textContent;
	}, value => {
		label.native.textContent = value;
	});

	label.bind("level", () => {
		return +label.native.getAttribute("level");
	}, value => {
		label.native.setAttribute("level", value);
	});

	text != undefined && (label.text = text);
	label.level = level || 0;

	return label;
});