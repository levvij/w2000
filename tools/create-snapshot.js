const https = require("https");

console.log("creating snapshot...");

const req = https.request({
	hostname: "dotcdn.us",
	port: 443,
	path: "/win-snapshots/create.php",
	method: "GET"
}, res => {
	res.on("data", d => {
		const data = JSON.parse(d.toString());

		console.log("created snapshot " + data.snapshot + " for version " + data.version);
		console.log("bootable at " + data.boot);
	});
});

req.on("error", (e) => {
	console.error(e);
});

req.end();
