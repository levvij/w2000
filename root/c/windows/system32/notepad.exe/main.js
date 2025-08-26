async function main() {
	let path = process.arguments[0];
	const window = new Window((path ? await Path.getPrettyName(path) : "Untitled") + " - Notepad", 500, 700);
	window.onclose.subscribe(() => exit());

	window.render(ui => {
		const grid = ui.Grid(["100%"], [
			"auto", "*"
		]);
		ui.root.add(grid);

		const box = ui.ToolbarBox();
		grid[0][0].add(box);

		const textArea = ui.TextArea();
		textArea.font = UI.fonts.monospace;
		grid[1][0].add(textArea);

		const menu = ui.Menu([{
			text: "File",
			items: [{
					text: "New",
					key: "ctrl+n",
					click() {
						Application.load(application.path);
					}
				},
				{
					text: "Open...",
					key: "ctrl+o",
					click() {
						ui.OpenFileDialog({
							allowFile: true
						}).then(r => {
							Application.load(application.path, r);
						});
					}
				},
				{
					text: "Save",
					key: "ctrl+s",
					async click() {
						if (path) {
							fs.write(path, textArea.value);
						} else {
							ui.SaveAsDialog({
								path: config.user.documents,
								default: Path.name(await Path.nextName(config.user.documents, "New Textfile.txt"))
							}).then(p => {
								fs.create(path = p, textArea.value);
							});
						}
					}
				},
				{
					text: "Save As...",
					async click() {
						ui.SaveAsDialog({
							path: Path.parentPath(path),
							default: Path.name(await Path.nextName(path ? Path.parentPath(path) : config.user.documents, "New Textfile.txt"))
						}).then(p => {
							fs.create(path = p, textArea.value);
						});
					}
				}, {},
				{
					text: "Print...",
					click() {
						const w = open();
						w.document.body.textContent = textArea.value;
						w.print();
						w.close();
					}
				}
			]
		}]);
		box.add(menu);

		(path ? fs.read(path) : Promise.resolve("")).then(text => {
			textArea.value = text;
		});
	});
}