UI.extend("Button", (env, text, click, key) => {
	const button = env.element("ui-button");

	button.bind("text", () => {
		return button.native.textContent;
	}, value => {
		button.native.textContent = value;
	});

	button.bind("click", () => {
		return button.native.onclick;
	}, value => {
		button.native.onclick = value;
	});

	// key bindings
	button.bind("key", () => {}, value => {
		window.bindKey(value, () => {
			button.click();
		});

		Tooltip.register(button, transformShortcut(value));
	});

	text != undefined && (button.text = text);
	click && (button.click = click);
	key && (button.key = key);

	button.native.tabIndex = UI.tabIndex = (UI.tabIndex || 1) + 1;

	return button;
});