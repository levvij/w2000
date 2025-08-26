/// dll inspector
/// C 2019 levvij

function DLLInspect(path) {
	// search for loaded modules
	const dll = DLL.loadedModules.find(m => m.path == path);
	let len = 0;
	
	return {
		dll,
		
		// exported objects
		objects: Object.keys(dll.exports).map(name => ({
			name,
			value: dll.exports[name],
			location: [len, len += dll.exports[name].toString().length][0]
		}))
	};
}

DLL.export("DLLInspect", DLLInspect);