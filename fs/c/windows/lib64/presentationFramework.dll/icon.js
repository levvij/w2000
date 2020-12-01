UI.extend("Icon", (env, path, size) => {
    const i = env.element("ui-icon");

    i.native.style.height = i.native.style.width = size + "px";

    const image = env.Image();

    Icon.from(path, size).then(r => {
        image.source = r;
    });

    i.add(image);

    fs.exists(path).then(exists => {
        if (exists) {
            fs.isLink(path).then(isLink => {
                if (isLink) {
                    Icon.link(size).then(icon => {
                        i.add(env.Image());
                    });
                }
            });
        }
    });

    return i;
});