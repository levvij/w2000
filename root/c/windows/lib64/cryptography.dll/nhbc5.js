// next-hashed block cypher
//
// this stream cypher must be re-initialized for each use
// this does not work:
// cryper = new NextHashedBlockCypher128(key, 128);
// cryper.decrypt(cryper.encode(data));
function NextHashedBlockCypher128(key, initialVectorSize) {
	let state = {
		key,
		iteration: 0
	};

	const public = {
		nextKeyBlock(initialVector) {
			const hash = Cypp.hash.md5(`${state.key}${btoa(initialVector)}${++state.iteration}`);
			state.key = hash;

			return new TextEncoder().encode(hash);
		},

		encryptString(content) {
			const encoded = new TextEncoder().encode(content);
			const encryped = public.encrypt(encoded);

			return Cypp.encodeBytesToString(encryped);
		},

		decryptString(content) {
			const encrypted = Cypp.decodeByteToString(content);
			const decryped = public.decrypt(new Uint8Array(encrypted));

			return new TextDecoder().decode(decryped);
		},

		async encryptBlob(blob) {
			return new Blob([this.encrypt(new Uint8Array(await blob.arrayBuffer()))]);
		},

		async decryptBlob(blob) {
			return new Blob([this.decrypt(new Uint8Array(await blob.arrayBuffer()))]);
		},

		encrypt(data) {
			const initialVector = Cypp.generateRandomBytes(initialVectorSize);

			const output = new Uint8Array(initialVectorSize + data.byteLength);
			output.set(initialVector, 0);

			let offset = 0;

			while (offset < data.byteLength) {
				const key = this.nextKeyBlock(initialVector);
				const block = data.slice(offset, offset + key.byteLength);

				for (let byte = 0; byte < block.byteLength; byte++) {
					block[byte] = block[byte] ^ key[byte];
				}

				output.set(block, offset + initialVectorSize);
				offset += key.byteLength;
			}

			return output;
		},

		decrypt(data) {
			const initialVector = data.slice(0, initialVectorSize);
			data = data.slice(initialVectorSize);

			let offset = 0;

			while (offset < data.byteLength) {
				const key = this.nextKeyBlock(initialVector);
				const block = data.slice(offset, offset + key.byteLength);

				for (let byte = 0; byte < block.byteLength; byte++) {
					block[byte] = block[byte] ^ key[byte];
				}

				data.set(block, offset);
				offset += key.byteLength;
			}

			return data;
		}
	}

	return public;
}

Cypp.crypt.nhbc5 = (key, initialVectorSize = 16) => new NextHashedBlockCypher128(key, initialVectorSize);
