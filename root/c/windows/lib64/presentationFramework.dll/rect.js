UI.extend("Rect", (env, width, height) => {
	const rect = env.element("ui-rect");

	rect.bind("width", () => {
		return rect.native.style.width;
	}, value => {
		rect.native.style.width = value;
	});

	rect.bind("height", () => {
		return rect.native.style.height;
	}, value => {
		rect.native.style.height = value;
	});

	width != undefined && (rect.width = width);
	height != undefined && (rect.height = height);

	return rect;
});