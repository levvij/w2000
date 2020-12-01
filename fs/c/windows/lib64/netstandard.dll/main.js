/// networking
/// C 2019 levvij

// main networking object containing a list of all nodes
function Networking() {
	const public = {
		nodes: []
	};
	
	return public;
}

DLL.export("Networking", new Networking());