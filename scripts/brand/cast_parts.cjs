/*
 * Export the Saral illustration cast as plain SVG figures, one file per (person, pose, face).
 *
 * The art is Open Peeps by Pablo Stanley (CC0 1.0, https://www.openpeeps.com/). The parts (hair,
 * face, accessory, body/pose) come from the `react-peeps` package (MIT code, CC0 art, by CeamKrier,
 * https://github.com/CeamKrier/react-peeps), which ships every Open Peeps part as separate paths so a
 * figure can be put together from fixed parts. Every appearance of a cast member uses the same
 * hair, face and accessory; only the body pose changes with the scene.
 *
 *   npm i --no-save --prefix /tmp/castdeps react@18.3.1 react-dom@18.3.1 react-peeps@0.1.10
 *   NODE_PATH=/tmp/castdeps/node_modules node scripts/brand/cast_parts.cjs <cache-dir>
 *   python scripts/brand/peeps.py <cache-dir> <out-dir>
 *
 * Writes <cache-dir>/cast-<person>-<pose>[-<face>].svg with a tight viewBox (top of the head at 0,
 * feet or bust edge at the bottom), so the composer can place every figure at one scale.
 */
const fs = require("fs");
const path = require("path");
const React = require("react");
const Server = require("react-dom/server");
const Peep = require("react-peeps").default;

/** The cast. Parts are fixed per person; see docs/ASSETS.md. */
const CAST = {
	// The borrower: long dark hair, open friendly face, white top and dark trousers.
	borrower: { hair: "Long", face: "Smile" },
	// The advisor / reviewer: short dark hair, round glasses, white blazer.
	advisor: { hair: "Short", face: "Smile", accessory: "GlassRound" },
};

/** Bounding boxes of each body pose with the head on (react-peeps units), measured in Chromium. */
const POSES = {
	// standing (white top, dark trousers family)
	ShirtPantsWB: [44, 894, 2965],
	PointingFingerWB: [-16, 1300, 2637],
	RestingWB: [7, 1274, 2910],
	WalkingWB: [-83, 1035, 2878],
	CrossedArmsWB: [-199, 1071, 2901],
	BlazerPantsWB: [-75, 1046, 2858],
	// sitting on the floor
	HandsBackWB: [-88, 1258, 1837],
	// busts, always shown behind a desk edge
	Geek: [19, 1002, 1137],
	Device: [48, 747, 1133],
	Coffee: [24, 784, 1128],
	Shirt: [19, 783, 1134],
	BlazerBlackTee: [38, 792, 1141],
};

/** Figures the scenes use: [person, pose, face override or null]. */
const FIGURES = [
	["borrower", "Geek", null],
	["borrower", "Device", null],
	["borrower", "Coffee", null],
	["borrower", "Shirt", "Calm"],
	["borrower", "PointingFingerWB", null],
	["borrower", "RestingWB", null],
	["borrower", "WalkingWB", null],
	["borrower", "CrossedArmsWB", null],
	["borrower", "CrossedArmsWB", "Serious"],
	["borrower", "ShirtPantsWB", null],
	["borrower", "HandsBackWB", null],
	["advisor", "BlazerPantsWB", null],
	["advisor", "BlazerBlackTee", null],
];

/*
 * The `Device` bust is drawn with a speckled shirt. The speckles are small closed sub-paths inside the
 * body's one stroke path; dropping sub-paths whose bounding box is under SPECKLE units on both axes
 * (the phone, hands and seams are all larger) leaves a plain shirt.
 */
const SPECKLE = 75;
function despeckle(d) {
	const parts = d.split(/(?=M)/);
	return parts
		.filter((sub) => {
			const nums = (sub.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
			if (nums.length < 4) return true;
			const xs = nums.filter((_, i) => i % 2 === 0);
			const ys = nums.filter((_, i) => i % 2 === 1);
			const w = Math.max(...xs) - Math.min(...xs);
			const h = Math.max(...ys) - Math.min(...ys);
			return !(w < SPECKLE && h < SPECKLE);
		})
		.join("");
}

function render(person, pose, face) {
	const parts = { ...CAST[person] };
	if (face) parts.face = face;
	const [x, w, h] = POSES[pose];
	const top = person === "borrower" ? 32 : 65; // top of the hair differs by hair part
	const pad = 12;
	const vb = { x: x - pad, y: top - pad, width: w + pad * 2, height: h + pad * 2 };
	let svg = Server.renderToStaticMarkup(
		React.createElement(Peep, {
			body: pose,
			hair: parts.hair,
			face: parts.face,
			accessory: parts.accessory,
			strokeColor: "#000000",
			backgroundColor: "#FFFFFF",
			viewBox: vb,
		}),
	);
	if (pose === "Device") {
		// only the body: the head group (hair, face, glasses) starts at translate(225 0)
		const at = svg.indexOf('transform="translate(225 0)"');
		svg = svg.slice(0, at).replace(/d="([^"]+)"/g, (m, d) => `d="${despeckle(d)}"`) + svg.slice(at);
	}
	svg = svg.replace(/^<svg[^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.width} ${vb.height}">`);
	return svg;
}

const out = process.argv[2];
if (!out) throw new Error("usage: cast_parts.cjs <cache-dir>");
fs.mkdirSync(out, { recursive: true });
for (const [person, pose, face] of FIGURES) {
	const file = path.join(out, `cast-${person}-${pose}${face ? "-" + face : ""}.svg`);
	fs.writeFileSync(file, render(person, pose, face) + "\n");
	console.log(file);
}
