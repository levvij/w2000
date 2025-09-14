// main config
const config = {
	copyright: {
		text: "Copyright © 2019 Levi Hechenberger. All rights reserved.",
		notice: "This software is licensed under Creative Commons BY NC. You are free to copy, redistribute, remix, transform, and build upon the material. https://creativecommons.org/licenses/by-nc/4.0/. Design Copyright © 1981-1999 Microsoft Corp."
	},
	dll: {
		paths: [
			"c/windows",
			"c/windows/lib64/",
			"c/windows/system32/"
		]
	},
	path: [
		"c/windows/system32",
		"c/windows/lib64"
	],
	console: {
		lineHeight: 1
	},
	fs: {
		paths: {
			user: {
				path: "c/users/guest/",
				desktop: "c/users/guest/desktop",
				documents: "c/users/guest/documents",
				music: "c/users/guest/music",
				start: "c/windows/ime/start.ime"
			}
		},
		providers: [
			{
				type: "rrsp",
				order: 1,
				name: "Remote",
				root: "fs/"
			},
			{
				type: 'ebfs',
				order: 2,
				name: 'Encryped Personal Bucket',
				local: {
					key: 'ebfs-base',
					encrypt: 'ebfs-encrypt'
				},
				maxSize: 1024 ** 4,
				root: 'bucket',
				mounts: [
					'c/programData',
					'c/programFiles',
					'c/users/guest'
				]
			}
		],
		root: "root/blob/",
		ray: "root/index",
		prefix: "wray_fsx_",
		disk: "c/",
		icons: {

			base: "c/windows/system32/icons/",
			directory: "shell32/0x0004",
			directoryOpen: "shell32/0x0005",
			default: "shell32/0x0001",
			disk: "shell32/0x0009",
			computer: "explorer/0x0064",
			lnk: "floimg/0x0000",

			bat: "c/windows/system32/imageres/bat.png",
			js: "shell32/0x0003",
			exe: "shell32/0x0003",
			dll: "shell32/0x009A",

			gif: "mspaint/0x0002",
			jpg: "mspaint/0x0002",
			jpeg: "mspaint/0x0002",
			png: "mspaint/0x0002",

			ttf: "fontext/0x0002",

			mov: "quartz/0x0064",
			mp4: "quartz/0x0065",
			mpeg: "quartz/0x0066",

			mp3: "quartz/0x00C8",
			mid: "quartz/0x012C",

			pdf: "c/windows/system32/imageres/pdf.png",
			rtf: "c/windows/system32/imageres/rtf.png",
			txt: "shell32/0x0098",
			zip: "c/windows/system32/imageres/zip.png",

			html: "mshtml/0x0A65",
			web: "mshtml/0x0A65",
			url: "mshtml/0x0A65",
		},
		description: {
			"": "Displays the files and folders on your computer",
		},
		icon: {
			"": "shell32/0x0010",
			"c/users/guest/desktop/computer.lnk": "explorer/0x0064",
			"c/windows/fonts": "shell32/0x0027"
		},
		typeName: {
			default: "% File",
			directory: "File Folder",
			bat: "Windows Batch File",
			exe: "Application",
			gif: "Animated Image",
			jpg: "Image",
			jpeg: "Image",
			mid: "MIDI File",
			mov: "Video",
			mp3: "MP3 Audio",
			mp4: "Video",
			mpeg: "Video",
			mega: "Agy",
			png: "Image",
			pdf: "PDF-Document",
			rtf: "Rich Text Document",
			txt: "Text Document",
			url: "Weblink",
			zip: "Compressed Folder",
			lnk: "Shortcut",
			html: "Web Document",
			dll: "Application Extension"
		}
	},
	taskBar: {
		start: "Start"
	},
	globalConsole: {
		action: "font-weight: bold",
		mark: "font-weight: bold; color: #396DA5",
		warn: "font-weight: bold; background: #FFFF00; color: #000000",
		error: "font-weight: bold; background: #FF0000; color: #FFFFFF",
		info: "color: #666666"
	},
	error: "https://dotcdn.us/win-api/reporting/new.php"
};
