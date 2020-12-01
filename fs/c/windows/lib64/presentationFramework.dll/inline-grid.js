UI.extend("InlineGrid", (env, cols, rows) => {
	const grid = env.Grid(cols, rows);
	grid.native.setAttribute("inline", "");
	return grid;
});