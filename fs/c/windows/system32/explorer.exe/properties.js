const properties = async file => {
	const window = new Window((await Path.getPrettyName(file)) + " Properties", 370, 400);
	window.buttonStyle = Window.ButtonStyle.close;

	window.render(async ui => {
		const tabs = ui.Tabs([
			"General",
			"Storage"
		]);

		const extinfo = await Path.extInfo(Path.ext(file));

		const contents = [
			[{},
				...(await fs.isDirectory(file)) ? [{
					title: "Type:",
					value: await Path.getFileTypeName(file)
				}] : [{
						title: "Type of file:",
						value: await Path.getFileTypeName(file)
					},
					{
						title: "Opens with:",
						value: extinfo && await Path.exeInfo(extinfo.opener).name
					}, {}
				],
				...(file ? [{
						title: "Location:",
						value: file,
						tooltip: "Stored in " + (await fs.providerOf(file) || {
							name: "Unknown"
						}).name + " provider"
					},
					...await fs.isDirectory(file) ? [{
						title: "Contains:",
						value: (await fs.listFiles(file)).length + " Files, " + (await fs.listDirectories(file)).length + " Folders"
					}] : [{
							title: "Size:",
							value: Path.readableSize(await fs.size(file) || 0)
						},
						{
							title: "Size on disk:",
							value: Path.readableSize(await fs.sizeOnDisk(file) || 0)
						}
					], {},
					...((await fs.isDirectory(file)) ? [{
						title: "Created:",
						value: (await fs.times(file)).ctime.toLongString()
					}] : [{
							title: "Created:",
							value: (await fs.times(file)).ctime.toLongString()
						},
						{
							title: "Modified:",
							value: (await fs.times(file)).ctime.toLongString()
						}
					])
				] : [])
			],
			[{
				title: "Provider:",
				value: (await fs.providerOf(file)).name
			}]
		];

		for (let i = 0; i < contents.length; i++) {
			const stack = ui.StackPanel();
			tabs[i].add(stack);

			if (!i) {
				const headGrid = ui.InlineGrid(["80px", "*"], ["32px"]);
				stack.add(headGrid);

				headGrid[0][0].add(ui.Icon(file, 32));

				const name = ui.TextBox(Path.name(file));
				name.margin = "5px 0";
				headGrid[0][1].add(name);
			}

			for (let item of contents[i]) {
				if (item.title) {
					const g = ui.InlineGrid(["80px", "*"], ["*"]);
					g.padding = "5px 0";
					g[0][0].add(ui.Label(item.title));

					const v = ui.Label(item.value);
					v.tooltip = item.tooltip;
					v.selectable = true;

					g[0][1].add(v);
					stack.add(g);
				} else {
					stack.add(ui.Separator());
				}
			}
		}

		ui.root.add(tabs);
	});
}