const SVG = "http://www.w3.org/2000/svg";

function el(name, attrs = {}, parent) {
	const node = document.createElementNS(SVG, name);
	for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
	if (parent) parent.appendChild(node);
	return node;
}

export function mountOrbit(figure) {
	const list = figure.querySelector("[data-orbit-items]");
	const caption = figure.querySelector("[data-orbit-caption]");
	const items = [...list.querySelectorAll("a[data-line]")].map((a) => ({
		title: a.dataset.title || a.textContent.trim(),
		line: a.dataset.line,
		kind: a.dataset.kind || "build",
		href: a.getAttribute("href"),
		external: a.target === "_blank",
	}));
	if (!items.length) return;

	const size = 400, c = size / 2, r = 132;
	const pad = 78;
	const svg = el("svg", { viewBox: `${-pad} 0 ${size + 2 * pad} ${size}`, class: "orbit-svg", role: "group", "aria-label": "Work arranged as spokes on a globe; choose a spoke" });
	const sphere = el("g", { class: "orbit-sphere" }, svg);
	el("circle", { cx: c, cy: c, r, class: "orbit-disk" }, sphere);
	for (const lat of [-50, -25, 0, 25, 50]) {
		const rad = (lat * Math.PI) / 180;
		el("ellipse", { cx: c, cy: c - Math.sin(rad) * r, rx: Math.cos(rad) * r, ry: Math.cos(rad) * r * 0.2, class: lat === 0 ? "orbit-equator" : "orbit-parallel" }, sphere);
	}
	const meridians = [0, 30, 60, 90, 120, 150].map(() => el("ellipse", { cx: c, cy: c, rx: r, ry: r, class: "orbit-meridian" }, sphere));
	el("circle", { cx: c, cy: c, r, class: "orbit-rim" }, sphere);

	const spokes = el("g", { class: "orbit-spokes" }, svg);
	const nodes = items.map((item, i) => {
		const a = -Math.PI / 2 + (i / items.length) * Math.PI * 2;
		const x = c + Math.cos(a) * r, y = c + Math.sin(a) * r;
		const g = el("g", { class: `orbit-node kind-${item.kind}`, tabindex: "0", role: "button", "aria-label": `${item.title}: ${item.line}` }, spokes);
		el("line", { x1: c, y1: c, x2: x, y2: y, class: "orbit-spoke" }, g);
		el("circle", { cx: x, cy: y, r: 7, class: "orbit-dot" }, g);
		el("circle", { cx: x, cy: y, r: 22, class: "orbit-hit" }, g);
		const lx = c + Math.cos(a) * (r + 30), ly = c + Math.sin(a) * (r + 30);
		const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
		const label = el("text", { x: lx, y: ly + 4, "text-anchor": anchor, class: "orbit-label" }, g);
		label.textContent = item.title;
		return g;
	});
	el("circle", { cx: c, cy: c, r: 4, class: "orbit-core" }, svg);
	list.before(svg);
	figure.classList.add("is-live");

	let current = -1;
	function select(i, focus = false) {
		current = i;
		nodes.forEach((n, j) => n.classList.toggle("is-on", j === i));
		const item = items[i];
		caption.innerHTML = "";
		const h = document.createElement("h3");
		h.textContent = item.title;
		const p = document.createElement("p");
		p.textContent = item.line;
		const link = document.createElement("a");
		link.href = item.href;
		link.textContent = item.external ? "Open site" : "Open";
		if (item.external) { link.target = "_blank"; link.rel = "noopener"; }
		caption.append(h, p, link);
		if (focus) nodes[i].focus();
	}
	nodes.forEach((n, i) => {
		n.addEventListener("click", () => select(i));
		n.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(i); }
			if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); select((i + 1) % items.length, true); }
			if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); select((i - 1 + items.length) % items.length, true); }
		});
	});
	select(0);

	let spin = 0, velocity = 0.12, dragging = false, lastX = 0;
	const still = window.matchMedia("(prefers-reduced-motion: reduce)");
	function draw() {
		meridians.forEach((m, k) => {
			const lon = ((k * 30 + spin) * Math.PI) / 180;
			m.setAttribute("rx", Math.abs(Math.sin(lon)) * r);
			m.style.opacity = 0.25 + 0.55 * Math.abs(Math.sin(lon));
		});
	}
	let running = false;
	function tick() {
		if (still.matches || document.hidden) { running = false; return; }
		if (!dragging) spin = (spin + velocity) % 360;
		draw();
		requestAnimationFrame(tick);
	}
	function start() {
		if (running || still.matches || document.hidden) return;
		running = true;
		requestAnimationFrame(tick);
	}
	still.addEventListener("change", start);
	document.addEventListener("visibilitychange", start);
	svg.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; });
	window.addEventListener("pointermove", (e) => {
		if (!dragging) return;
		spin = (spin + (e.clientX - lastX) * 0.5) % 360;
		lastX = e.clientX;
		if (!running) draw();
	});
	window.addEventListener("pointerup", () => { dragging = false; });
	draw();
	start();
	return { select, get current() { return current; } };
}

const figure = document.querySelector("[data-orbit]");
if (figure) mountOrbit(figure);
