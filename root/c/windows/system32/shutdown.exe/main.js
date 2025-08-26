function main() {
	if (process.arguments.has("t")) {
		setTimeout(() => {
			if (process.arguments.has("r")) {
				PowerManager.restart();
			} else {
				PowerManager.shutdown();
			}
		}, 1000 * +process.arguments.get("t"));
	} else if (process.arguments.has("x")) {
		PowerManager.reset();
	} else {
		if (process.arguments.has("r")) {
			PowerManager.restart();
		} else {
			PowerManager.shutdown();
		}
	}
}