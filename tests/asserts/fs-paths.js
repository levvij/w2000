Assert.test("FS User Root Path", "c/users/guest/", [], () => {
    return Path.user.path;
});

Assert.test("FS User Documents Path", "c/users/guest/documents", [], () => {
    return Path.user.documents;
});

Assert.test("FS User Desktop Path", "c/users/guest/desktop", [], () => {
    return Path.user.desktop;
});