/// print library
/// C 2019 levvij

function PrinterDocument() {
	// there are not many other ways to print a document
	let content = "";
	let html = "";

	const public = {
		write(text) {
			content += text;
		},
		writeHTML(text) {
			html += text;
		},
		print() {
			const w = open();
			w.document.body.textContent = content;
			w.document.body.innerHTML += "<style>body{white-space:pre-wrap;font-family:monospace;}</style>" + html;
			w.print();
			w.close();
		}
	};
	
	return public;
}

DLL.export("PrinterDocument", PrinterDocument);