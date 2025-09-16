/// Crypto functions
/// C 2019 levvij

function Cypp() {
	const public = {
		// get current cypp id (global id)
		get id() {
			return localStorage._cypp || (localStorage._cypp = public.createId());
		},

		// create id
		createId() {
			return Math.random().toString(16).substr(2, 4) + Math.random().toString(16).substr(2, 4) + "-" + Math.random().toString(16).substr(2, 8) + "-" + Math.random().toString(16).substr(2, 3) + Math.random().toString(16).substr(2, 4) + "-" + Math.random().toString(16).substr(2, 4)
		},

		createKey(length) {
			return public.encodeBytesToString(
				public.generateRandomBytes(length)
			);
		},

		// shorten id for readability
		shortenId(id) {
			return id.split("-")[0];
		},

		generateRandomBytes(length) {
			const array = new Uint8Array(length);
			crypto.getRandomValues(array);

			return array;
		},

		// generates a string encoded representation of bytes
		// the resulting string is URL-safe
		encodeBytesToString(bytes) {
			const chunkSize = 0x8000;

			let binary = '';

			for (let offset = 0; offset < bytes.length; offset += chunkSize) {
				binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + chunkSize));
			}

			return encodeURIComponent(btoa(binary));
		},

		// decodes a string encoded byte array
		decodeByteToString(string) {
			const binary = atob(decodeURIComponent(string));
			const length = binary.length;
			const bytes = new Uint8Array(length);

			for (let offset = 0; offset < length; offset++) {
				bytes[offset] = binary.charCodeAt(offset);
			}

			return bytes;
		},

		hash: {},
		crypt: {}
	};

	return public;
}

DLL.export("Cypp", new Cypp());
