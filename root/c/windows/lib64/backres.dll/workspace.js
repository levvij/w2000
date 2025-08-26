workspace.contextMenu = [{
		text: "Refresh",
		click() {
			Desktop.update();
		}
	}, {},
	{
		text: "Paste",
		disabled: true
	},
	{
		text: "Import",
		click() {
			const input = document.createElement("input");
			input.type = "file";
			input.multiple = true;

			input.onchange = async () => {
				if (input.files && input.files.length) {
					Interaction.lock();

					for (let file of input.files) {
						await fs.createBlob(await Path.nextName(Path.user.desktop, Path.fixExt(file.name)), file);
					}

					input.value = "";
					Desktop.update();

					Interaction.unlock();
				}
			};

			input.click();
		}
	}, {},
	{
		text: "New",
		items: [{
				text: "Folder",
				icon: Icon.directory(16),
				async click() {
					const path = await Path.nextName(Path.user.desktop, "New Folder");

					await fs.mkdir(path);
					Desktop.rename(path);
				}
			},
			{
				text: "Shortcut",
				icon: Icon.link(16),
				disabled: true
			}, {},
			...Path.creators.map(creator => ({
				text: creator.name,
				icon: Icon.fromExt(creator.ext, 16),
				async click() {
					const path = await Path.nextName(Path.user.desktop, "New " + creator.name + "." + creator.ext);

					await fs.create(path, creator.content);
					Desktop.rename(path);
				}
			}))
		]
	}, {}, {
		text: "Properties",
		click() {
			Application.load("c/windows/system32/explorer.exe", "-p", Path.user.desktop);
		}
	}
];