function main() {
	if (!arguments[0]) {
		Application.run(fs.extinfo("$").opener);
	} else if (process.arguments[0].includes("://")) {
		Application.load(fs.extinfo(process.arguments[0].split("://")[0] + "://").opener, process.arguments[0]);
	} else {
		Application.run(process.arguments[0]);
	}
	
	exit();
}