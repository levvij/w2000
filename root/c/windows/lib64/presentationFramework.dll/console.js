UI.extend("Console", env => {
	const box = env.element("ui-console");

	box.console = new Console(box.native);

	return box;
});

UI.extend("ColorConsole", env => {
	const box = env.element("ui-console");

	box.console = new ColorConsole(box.native);

	return box;
});