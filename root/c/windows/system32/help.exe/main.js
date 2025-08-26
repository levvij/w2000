async function main() {
	const file = (await fs.search(process.arguments[0] ||  application.path, Environment.path)) ||  (await fs.search(process.arguments[0] + ".exe", Environment.path));

	if (file) {
		const info = await fs.exeinfo(file);

		if (info && info.usage) {
			application.out.write(
				info.name + " (v" + info.version + ", " + info.author + ", " + Path.name(file) + ")\n  " + info.usage.description.trim() + "\n"
			);

			for (let arg of info.usage.arguments || []) {
				application.out.write((arg.pattern.length ? arg.pattern.map(pat => {
					if (typeof pat == "string") {
						return "-" + pat;
					}

					return "<" + pat.name + " : " + pat.type + ("default" in pat ? " = " + pat.default : "") + ">";
				}).join(" ") : "<no arguments>") + "\n  " + arg.action + "\n");
			}

			exit();
		} else {
			throw new Error("No usage information found for '" + file + "'");
		}
	} else {
		throw new Error("Program '" + arguments[0] + "' not found");
	}
}