async function main() {
	if (process.arguments.has("p")) {
		properties(process.arguments.get("p"));
	} else if (process.arguments.has("m")) {
		move(process.arguments.get("m"), process.arguments.get("m", 1));
	} else if (process.arguments[0] && await fs.exists(process.arguments[0]) && await fs.isLink(process.arguments[0])) {
		properties(process.arguments[0]);
	} else {
		explore(process.arguments[0] || "");
	}
}