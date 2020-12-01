UI.extend("DataGrid", (env, opts, rows) => {
	let cols;
	
	if (opts instanceof Array) {
		cols = opts;
	} else {
		cols = opts.columns;
	}
	
	const container = env.element("ui-data-grid-container");

	const innerContainer = env.element("ui-data-grid-container-inner");
	container.add(innerContainer);

	const grid = env.element("ui-data-grid");
	innerContainer.add(grid);

	const header = env.element("ui-data-grid-header");
	grid.add(header);

	for (let col of cols) {
		const cell = env.element("ui-data-grid-cell");

		const innerCell = env.element("ui-data-grid-cell-inner");
		innerCell.native.textContent = col.name || col.text || col || "";
		cell.add(innerCell);

		header.add(cell);
	}

	const body = env.element("ui-data-grid-body");
	grid.add(body);

	const render = () => {
		body.clear();

		let rowIndex = 0;
		for (let row of rows) {
			const r = env.element("ui-data-grid-row");
			r.contextMenu = row.contextMenu;
			body.add(r);

			container[rowIndex] = {};

			let colIndex = 0;
			for (let col of row.columns) {
				const c = env.element("ui-data-grid-cell");
				r.add(c);

				const renderColumn = col => {
					c.native.textContent = col.text === undefined ? col : col.text;
					c.contextMenu = col.contextMenu;
					
					if (col.editable) {
						c.native.setAttribute("contenteditable", "");
						
						let oldValue = c.native.textContent;
						
						c.native.onkeyup = c.native.onkeypress = async () => {
							if (c.native.textContent != oldValue) {
								if (col.match) {
									if (!col.match.test(c.native.textContent)) {
										c.native.textContent = oldValue;
										
										return;
									}
								}
								
								oldValue = c.native.textContent;
								col.text = oldValue;
								col.set && await col.set(oldValue);
								
								c.native.textContent = oldValue;
							}
						};
					}

					col.align && (c.align = col.align);
					col.tooltip && Tooltip.register(c, col.tooltip);
				};

				Object.defineProperty(container[rowIndex], colIndex, {
					set(value) {
						renderColumn(value);
					}
				});

				renderColumn(col);

				colIndex++;
			}

			rowIndex++;
		};
		
		if (opts.onadd) {
			let colIndex = 0;
			const r = env.element("ui-data-grid-row");
			r.add(env.element("ui-data-grid-cell")).native.textContent = opts.add;
			r.native.setAttribute("ui-new-row", "");
			
			r.native.onclick = () => {
				opts.onadd();
			};
			
			body.add(r);
		}
	};

	container.bind("rows", () => rows, value => {
		rows = value;
		render();
	});

	render();

	return container;
});