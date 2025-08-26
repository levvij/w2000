UI.extend("ProgressBar", (env, value, total) => {
	const p = env.element("ui-progress");
	const bar = env.element("ui-progress-bar");
	p.add(bar);

	const render = () => {
		bar.native.style.width = "calc(" + (100 / total * value) + "% - 2px)";
	};

	p.bind("value", () => {
		return value;
	}, v => {
		value = v;

		render();
	});

	p.bind("total", () => {
		return total;
	}, v => {
		total = v;

		render();
	});

	render();

	return p;
});