UI.extend("Image", (env, path) => {
	const img = env.element("img");

	img.bind("source", () => {
		return img.native.src;
	}, async value => {
		value = await value;

		if (await fs.exists(value)) {
			fs.readURI(value).then(uri => {
				img.native.src = uri;
			});
		} else {
			img.native.src = value;
		}
	});

	path && (img.source = path);

	return img;
});