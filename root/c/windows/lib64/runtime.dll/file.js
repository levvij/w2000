DLL.export("File", function File(path) {
	const public = {
		async move(end) {
			await fs.move(path, end);
			
			path = end;
		},
		async rename(end) {
			await fs.move(path, end);
			
			path = end;
		},
		get path() {
			return path;
		},
		async copy(end) {
			await fs.copy(path, end);
		},
		async read() {
			return await fs.read(path);
		},
		async readBlob() {
			return await fs.readBlob(path);
		},
		async readURI() {
			return await fs.readBlob(path);
		},
		async exists() {
			return await fs.exists(path);
		},
		async write(content) {
			if (await fs.exists(path)) {
				await fs.write(path, content);
			} else {
				await fs.create(path, content);
			}
		},
		async writeBlob(content) {
			if (await fs.exists(path)) {
				await fs.writeBlob(path, content);
			} else {
				await fs.createBlob(path, content);
			}
		}
	};
	
	return public;
});