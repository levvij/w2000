const unit = globalConsole.createUnit("pmde");

const PMDE = {
	routes: {
		".connect": () => {
			unit.mark("connected");
			
			return {
				version: "0.0.0"
			}
		},
		".exists": req => {
			return req in PMDE.routes;
		}
	}
};

DLL.export("PMDE", PMDE);

addEventListener("message", async event => {
	const data = JSON.parse(event.data);
	
	if (data[0] == configuration.key) {
		const id = data[1];
		
		if (PMDE.routes[data[2]]) {
			data[2][0] != "." && unit.action("signal", data[2], data[3]);
			
			const res = await PMDE.routes[data[2]](data[3]);
			
			parent.postMessage(JSON.stringify([
				configuration.key,
				id,
				res
			]));
		} else {
			unit.warn("signal", "Unknown pmde route '" + data[2] + "'. Known routes: " + Object.keys(PMDE.routes).join(", "));
		}
	}
});