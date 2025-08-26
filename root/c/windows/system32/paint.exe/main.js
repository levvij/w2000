async function main() {
	const path = process.arguments[0];
	let image = null;

	const window = new Window((path ? await Path.getPrettyName(path) : "Untitled") + " - Paint", configuration.windowSize.width, configuration.windowSize.height);
	window.onclose.subscribe(() => exit());

	window.render(async ui => {
		console.log(ui)
		
		const grid = ui.Grid([
			"100%"
		], [
			"auto", 
			"*"
		]);
		ui.root.add(grid);
		
		let color = configuration.defaultColor;
		
		const contentGrid = ui.Grid([
			"62px",
			"*"
		], [
			"100%"
		]);
		grid[1][0].add(contentGrid);
		
		const colorButtonContainer = ui.StackPanel();
		contentGrid[0][0].add(colorButtonContainer);
		
		for (let i = 0; i < configuration.colors.length; i++) {
			const c = configuration.colors[i];
			
			const button = ui.Button("", () => {
				color = c;
			});
			button.background = c;
			
			colorButtonContainer.add(button);
		}
		
		const scroll = ui.Scroll();
		contentGrid[0][1].add(scroll);
		
		const canvas = ui.Canvas();
		scroll.add(canvas);

		grid[0][0].add(ui.Menu([
			{
				text: "File",
				items: [
					{
						text: "Save",
						click() {
							canvas.context.save(path);
						}
					}
				]
			}
		]));

		if (path && !image) {
			image = await Graphics.Image(path);
			canvas.width = image.width || configuration.defaultSize.width;
			canvas.height = image.height || configuration.defaultSize.height;
			canvas.context.drawImage(image, 0, 0);
		}

		let pos = null;

		canvas.onmousedown.subscribe(e => {
			pos = e.relative;
		});

		canvas.onmouseup.subscribe(e => {
			pos = null;
		});
		
		canvas.onmouseleave.subscribe(e => {
			pos = null;
		});

		canvas.onmousemove.subscribe(e => {
			if (pos) {
				const p = canvas.context.createPath();
				p.stroke.color = color;
				p.moveTo(pos.x, pos.y);
				p.lineTo(e.relative.x, e.relative.y);
				p.draw();
				
				pos = e.relative;
			}
		});
	});
}