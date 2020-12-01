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
		
		// shorten id for readability
		shortenId(id) {
			return id.split("-")[0];
		},
		
		hash: {}
	};

	return public;
}

DLL.export("Cypp", new Cypp());