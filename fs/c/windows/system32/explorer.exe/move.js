const move = async (files, dest) => {
	application.log.action("move", files, dest);

	if (await fs.isLink(dest)) {
		dest = await fs.resolve(dest).path;
	}

	files = files.filter((f, i, a) => a.indexOf(f) == i);

	if (files.length) {
		const window = new Window("Moving...", 300, 130);
		window.buttonStyle = Window.ButtonStyle.close;

		await window.render(async ui => {
			const stack = ui.StackPanel();
			ui.root.add(stack);

			stack.padding = "10px";

			const image = ui.Image(application.resource("move.gif"));
			image.height = "57px";
			stack.add(image);

			const fileNameLabel = ui.Label("Preparing...");
			fileNameLabel.clipLine = true;
			stack.add(fileNameLabel);

			const fromLabel = ui.Label("From '" + await Path.getPrettyName(Path.parentPath(files[0])) + "' to '" + await Path.getPrettyName(dest) + "'");
			fromLabel.padding = "5px 0";
			stack.add(fromLabel);

			files = (await Promise.all(files.map(async f => await fs.isDirectory(f) ? [f, ...(await fs.listAll(f))] : [f]))).flat();
			let totalSize = 0;

			for (let file of files) {
				totalSize += await fs.size(file);
			}

			const fileCount = files.length;

			const progressBar = ui.ProgressBar(0, fileCount);
			stack.add(progressBar);

			const duration = ui.Label("Calculating remaining time...");
			stack.add(duration);

			let index = 0;
			let moved = 0;

			const start = +new Date();

			for (let i = 0; i < files.length; i++) {
				progressBar && (progressBar.value = i);
				fileNameLabel.text = await Path.getPrettyName(files[i]);

				await fs.move(files[i], dest, async (from, to) => {
					moved += await fs.size(from) || 1024;

					duration.text = Math.ceil((totalSize / moved * (+new Date() - start) - (+new Date() - start)) / 1000) + "s remaining";
					fileNameLabel.text = from.replace(files[i], await Path.getPrettyName(files[i]));
					progressBar && (progressBar.value = index++);
				});
			}

			progressBar.value = files.length;
		});

		window.close();
	}
}