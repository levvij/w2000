const properties = {
    async root(url) {
        return "url('" + await fs.readURI(url) + "')";
    },
    async cursor(name) {
        return "--cursor: url('" + await Cursor.load(name) + "'); cursor: none";
    },
    async resource(dll, file) {
        const module = DLL.modules.find(d => d.name == dll);

        if (module) {
            return "url('" + module.path + "/resources/" + file + "')";
        } else {
            throw new Error("No DLL-module named '" + dll + "' found");
        }
    }
};

const log = globalConsole.createUnit("csc");

// generate fonts
for (let family of configuration.fontgen.families) {
    const fname = "f_" + Math.random().toString(36).substr(2);

    for (let s of configuration.fontgen.sizes) {
        let fsname = fname + "_" + s;

        for (let weight of configuration.fontgen.weights) {
            const path = family.file.replace("%s", s).replace("%w", weight);

            if (await fs.exists(path)) {
                const file = "url('" + (await fs.readURI(path)) + "')";

                log.action("font-load", family.name + "@" + s + "px/" + weight);

                const face = new FontFace(fsname, file, {
                    style: "normal",
                    weight
                });

                if (s == configuration.fontgen.forcedSize && family.forced) {
                    await face.load();
                }

                if (!config.beta) {
                    face.load();
                }

                document.fonts.add(face);

                properties["font" + (family.varName ? "-" + family.varName : "") + s + (weight == "normal" ? "" : weight)] = "font-size:" + s + "px;font-family:" + fsname + ";font-weight:" + weight;
            } else {
                log.action("font-load-omit", family.name + "@" + s + "px/" + weight);
            }
        }
    }
}

const render = async content => {
    for (let prop in properties) {
        const search = new RegExp("\\@" + prop + "\\((.*?)\\)", "g");
        let match;

        while (match = search.exec(content)) {
            const next = match[0];

            if (typeof properties[prop] == "function") {
                const pars = [];
                let i = 2 + prop.length;

                while (next[i] && next[i] != ")") {
                    const c = next[i];

                    switch (c) {
                        case "'":
                        case '"':
                            {
                                let s = "";

                                i++;

                                while (next[i] && next[i] != c) {
                                    if (next[i] == "\\") {
                                        s += next[i] + next[++i];
                                    } else {
                                        s += next[i];
                                    }

                                    i++;
                                }

                                pars.push(s);

                                break;
                            }
                        default:
                            {
                                const v = next.substr(i).split(",")[0].split(")")[0];

                                pars.push(v.trim());

                                i += v.length;
                            }
                    }

                    i++;
                }

                content = content.slice(0, match.index) + await properties[prop](...pars) + content.slice(match.index + next.length);
            } else {
                content = content.slice(0, match.index) + properties[prop] + content.slice(match.index + next.length);
            }
        }
    }

    return content;
}

// add and render s.css
for (let path of config.dll.paths) {
	for (let file of await fs.list(path)) {
		if (await fs.isExecuteable(file)) {
			if (await fs.exists(file + "/styles")) {
				const style = document.createElement("style");
				style.textContent += "/* " + file + " */\n\n" + await render(await fs.read(file + "/styles/main.css"));
				
				for (let r of await fs.list(file + "/styles")) {
					if (Path.name(r) != "main.css") {
						style.textContent += "/* " + file + " */\n\n" + await render(await fs.read(r));
					}
				}
				
				document.head.appendChild(style);
			}
		}
	}
}