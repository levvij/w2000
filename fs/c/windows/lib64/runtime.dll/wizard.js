DLL.export("Wizard", function(config) {
	const window = new Window(
		config.title, 
		configuration.wizard.window.width, 
		configuration.wizard.window.height
	);
	
	window.buttonStyle = Window.ButtonStyle.none;
	
	let currentPage = -1;
	const results = [];
	
	window.render(async ui => {
		const rootGrid = ui.Grid([
			"*"
		], [
			"*",
			"auto",
			"auto"
		]);
		
		ui.root.add(rootGrid);
		
		const buttonGrid = ui.Grid([
			"*",
			"auto",
			"9px",
			"auto",
			"9px"
		], [
			"9px",
			"auto",
			"9px"
		]);
		
		rootGrid[1][0].add(ui.Separator(0));
		rootGrid[2][0].add(buttonGrid);
		
		const backButton = ui.Button(configuration.wizard.back, () => {
			currentPage--;
			
			window.render();
		});
		
		const nextButton = ui.Button(configuration.wizard.next, () => {
			currentPage++;
			
			if (currentPage == config.steps.length) {
				config.onfinish && config.onfinish();
				
				window.close();
			} else {
				window.render();
			}
		});
		
		buttonGrid[1][1].add(backButton);
		buttonGrid[1][1].add(nextButton);
		
		buttonGrid[1][3].add(ui.Button(configuration.wizard.cancel, () => {
			window.close();
			
			config.onabort && config.onabort();
		}));
		
		if (currentPage == config.steps.length - 1) {
			nextButton.text = configuration.wizard.finish;
		}
		
		if (currentPage == -1) {
			backButton.disabled = true;
			
			const start = ui.Grid([
				"auto", 
				"*"
			], [
				"*"
			]);
			
			rootGrid[0][0].add(start);
			start.background = "white";
			
			start[0][0].add(ui.Image(config.image));
			
			const stack = ui.StackPanel();
			start[0][1].add(stack);
			
			stack.add(ui.Title(config.welcome, 1)).margin = "10px";
			stack.add(ui.Label(config.description)).margin = "10px";
			stack.add(ui.Label(configuration.wizard.welcome.continue)).margin = "10px";
		} else {
			const step = config.steps[currentPage];
			const contentGrid = ui.Grid([
				"*"
			], [
				"auto", 
				"auto",
				"*"
			]);
			
			rootGrid[0][0].add(contentGrid);
			
			const headerStack = ui.StackPanel();
			headerStack.background = "white";
			contentGrid[0][0].add(headerStack);
			
			headerStack.add(ui.Title(step.title, 7)).padding = "10px 20px 5px";
			headerStack.add(ui.Label(step.description, 7)).padding = "0px 20px 7px 40px";
			
			const contentOffsetGrid = ui.Grid([
				"40px",
				"*",
				"40px"
			], [
				"20px",
				"*",
				"20px"
			]);
			
			contentGrid[2][0].add(contentOffsetGrid);
			
			const contentStack = ui.StackPanel();
			contentOffsetGrid[1][1].add(contentStack);
			
			contentGrid[1][0].add(ui.Separator(0));
			
			if (step.render) {
				const contentHandler = step.render(ui, contentStack, () => {
					results[currentPage] = contentHandler.get();

					nextButton.disabled = !contentHandler.valid();
				});

				if (currentPage in results) {
					contentHandler.set(results[currentPage]);
				} else {
					results[currentPage] = contentHandler.get();
				}

				nextButton.disabled = !contentHandler.valid();
				backButton.disabled = "install" in (config.steps[currentPage - 1] || {});
			}
			
			if (step.install) {
				backButton.disabled = true;
				nextButton.disabled = true;
				
				const installationSteps = step.install();
				const progess = contentStack.add(ui.ProgressBar(0, installationSteps.length * 2));
				
				const text = contentStack.add(ui.Label("..."));
				text.margin = "10px 0 0 0";
				
				for (let installationStep of installationSteps) {
					text.text = installationStep.title + " (" + (installationSteps.indexOf(installationStep) + 1) + "/" + installationSteps.length + ")";
					progess.value++;
					
					await new Promise(done => {
						setTimeout(() => {
							done();
						}, configuration.wizard.install.delay);
					});
					
					try {
						await installationStep.action();
					} catch (e) {
						text.text = configuration.wizard.failed.replace("%e", e).replace("%s", installationStep.title);
						
						return;
					}
					
					progess.value++;
				}
				
				text.text = step.done || configuration.wizard.done;
				
				nextButton.disabled = false;
			}
		}
	});
	
	return {
		results
	};
});