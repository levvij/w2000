UI.extend("Grid", (env, cols, rows) => {
	const grid = env.element("ui-grid");

	let i = 0;
	for (let row of rows) {
		const r = env.element("ui-grid-row");
		grid[i] = [];

		if (row == "*") {
			r.native.style.flexGrow = 1;
		} else {
			r.native.style.height = row;
			r.native.style.flexShrink = 0;
		}

		for (let colr of cols) {
			const c = env.element("ui-grid-cell");

			if (colr == "*") {
				c.native.style.flexGrow = 1;
				c.native.style.width = 1;
			} else {
				c.native.style.width = colr;
				c.native.style.flexShrink = 0;
			}

			grid[i].push(c);

			r.add(c);
		}

		grid.add(r);

		i++;
	}

	return grid;
});