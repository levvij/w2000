Graphics.Image = function(path) {
	return new Promise(done => {
		const img = new Image();

		img.onload = () => {
			done({
				width: img.width,
				height: img.height,
				getNative(k) {
					if (k == DLL.private.key) {
						return img;
					}
				},
				save(path, quality = 1) {
					return new Promise(async done => {
						const canvas = document.createElement("canvas");
						const ctx = canvas.getContext("2d");

						canvas.width = img.width;
						canvas.height = img.height;

						ctx.drawImage(img, 0, 0);

						canvas.toBlob(blob => {
							fs.writeBlob(path, blob).then(() => {
								done();
							});
						}, await fs.mime(path), quality)
					});
				}
			});
		}

		fs.readURI(path).then(uri => {
			img.src = uri;
		});
	});
};
