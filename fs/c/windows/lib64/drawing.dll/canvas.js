Graphics.Canvas = function() {
	const element = document.createElement("canvas");
	const ctx = element.getContext("2d");

	const public = {
		get width() {
			return element.width;
		},
		set width(value) {
			element.width = value;
		},
		get height() {
			return element.height;
		},
		set height(value) {
			element.height = value;
		},
		drawImage(image, ...args) {
			const n = image.getNative(DLL.private.key);

			ctx.drawImage(n, ...args);
		},
		createPath() {
			const points = [];

			const path = {
				stroke: {
					color: "black"
				},
				moveTo(x, y) {
					points.push({
						x,
						y,
						t: "m"
					});
				},
				lineTo(x, y) {
					points.push({
						x,
						y,
						t: "l"
					});
				},
				draw() {
					ctx.beginPath();

					ctx.strokeStyle = path.stroke.color;

					for (let item of points) {
						switch (item.t) {
							case "m": {
								ctx.moveTo(item.x, item.y);

								break;
							}
							case "l": {
								ctx.lineTo(item.x, item.y);

								break;
							}
						}
					}

					ctx.strokeStyle = path.stroke;
					ctx.stroke();
				}
			};

			return path;
		},
		save(path, quality = 1) {
			return new Promise(async done => {
				element.toBlob(blob => {
					fs.writeBlob(path, blob).then(() => {
						done();
					});
				}, await fs.mime(path), quality);
			});
		},
		getNative(k) {
			if (DLL.private.key == k) {
				return element;
			}
		}
	};

	return public;
};

UI.extend("Canvas", env => {
	const container = env.element("canvas-container");
	const canvas = Graphics.Canvas();

	env.bindMouseEvents(container);

	container.bind("width", () => canvas.width, value => canvas.width = value);
	container.bind("height", () => canvas.height, value => canvas.height = value);

	container.add({
		native: canvas.getNative(DLL.private.key)
	});

	container.context = canvas;

	return container;
});