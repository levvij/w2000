UI.extend("Video", (env, video) => {
	const v = env.element("ui-video");
	v.native.appendChild(video.player);
	
	return v;
});