const SVG = "http://www.w3.org/2000/svg";
const COLORS = ["#8A641A", "#0B6E6E", "#9A3B22", "#3F5E8C", "#5E7A2E", "#7A4E7E", "#4A4336", "#B8861E"];

function el(name, attrs = {}, parent) {
	const node = document.createElementNS(SVG, name);
	for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
	if (parent) parent.appendChild(node);
	return node;
}

export function geometry(data, width, height, turns = 1.25) {
	const n = data.months.length;
	const k = data.primes.length;
	const start = { x: width * 0.13, y: height * 0.36 };
	const end = { x: width * 0.8, y: height * 0.6 };
	const R = height * 0.27;
	const tilt = 0.42;
	const centers = data.months.map((_, t) => {
		const f = n === 1 ? 0 : t / (n - 1);
		return { x: start.x + (end.x - start.x) * f, y: start.y + (end.y - start.y) * f };
	});
	const angle = (t, j) => -Math.PI / 2 + (j / k) * Math.PI * 2 + (n === 1 ? 0 : (t / (n - 1)) * turns * Math.PI * 2);
	const point = (t, j) => {
		const r = R * (0.25 + 0.75 * data.radius[t][j]);
		const a = angle(t, j);
		return { x: centers[t].x + Math.cos(a) * r * tilt, y: centers[t].y + Math.sin(a) * r };
	};
	return { n, k, R, tilt, centers, point, start, end };
}

export function mountHelix(figure, data) {
	const caption = figure.querySelector("[data-helix-caption]");
	const narrow = figure.clientWidth < 560;
	const W = narrow ? 520 : 900;
	const H = narrow ? 470 : 520;
	const g = geometry(data, W, H);
	const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, class: "helix-svg", role: "group", "aria-label": `Work helix: ${data.primes.length} work primes across ${data.months.length} months` });
	const rings = el("g", { class: "helix-rings" }, svg);
	const fill = el("polygon", { class: "helix-fill" }, svg);
	const coils = el("g", { class: "helix-coils" }, svg);
	const arrow = el("g", { class: "helix-arrow" }, svg);
	const ax = { x: g.end.x + W * 0.07, y: g.end.y + (g.end.y - g.start.y) * 0.09 };
	el("line", { x1: g.start.x - W * 0.03, y1: g.start.y - (g.end.y - g.start.y) * 0.04, x2: ax.x, y2: ax.y }, arrow);
	const ang = Math.atan2(ax.y - g.start.y, ax.x - g.start.x);
	const head = (s) => `${ax.x - 18 * Math.cos(ang + s)},${ax.y - 18 * Math.sin(ang + s)}`;
	el("polyline", { points: `${head(0.45)} ${ax.x},${ax.y} ${head(-0.45)}` }, arrow);
	el("text", { x: ax.x + 8, y: ax.y + 5, class: "helix-time", "text-anchor": "start" }, arrow).textContent = "time";

	const ringNodes = g.centers.map((c, t) => {
		const ring = el("ellipse", { cx: c.x, cy: c.y, rx: g.R * g.tilt, ry: g.R, class: "helix-ring" }, rings);
		const label = el("text", { x: c.x, y: c.y + g.R + 16, class: "helix-month", "text-anchor": "middle" }, rings);
		const every = narrow ? Math.ceil(g.n / 4) : 1;
		label.textContent = t % every === 0 || t === g.n - 1 ? data.months[t] : "";
		return [ring, label];
	});

	const names = data.labels ?? data.primes;
	const coilNodes = names.map((name, j) => {
		const group = el("g", { class: "helix-coil", tabindex: "0", role: "button", "aria-label": `Prime ${j + 1}: ${name}` }, coils);
		const hit = el("path", { class: "helix-hit" }, group);
		const line = el("path", { class: "helix-line", stroke: COLORS[j % COLORS.length] }, group);
		const dot = el("circle", { r: 4, fill: COLORS[j % COLORS.length], class: "helix-dot" }, group);
		return { group, hit, line, dot };
	});

	const STEPS = 10;
	function pointAt(j, u) {
		const t0 = Math.min(Math.floor(u), g.n - 1);
		const t1 = Math.min(t0 + 1, g.n - 1);
		const f = u - t0;
		const r0 = data.radius[t0][j];
		const r1 = data.radius[t1][j];
		const r = g.R * (0.25 + 0.75 * (r0 + (r1 - r0) * (0.5 - 0.5 * Math.cos(Math.PI * f))));
		const a = -Math.PI / 2 + (j / g.k) * Math.PI * 2 + (g.n === 1 ? 0 : (u / (g.n - 1)) * 1.25 * Math.PI * 2);
		const c0 = g.centers[t0];
		const c1 = g.centers[t1];
		const cx = c0.x + (c1.x - c0.x) * f;
		const cy = c0.y + (c1.y - c0.y) * f;
		return { x: cx + Math.cos(a) * r * g.tilt, y: cy + Math.sin(a) * r };
	}
	function pathFor(j, upto) {
		const pts = [];
		const last = Math.min(upto, g.n - 1);
		for (let s = 0; s <= last * STEPS; s++) pts.push(pointAt(j, s / STEPS));
		if (pts.length === 0 || (last * STEPS) % 1 !== 0) pts.push(pointAt(j, last));
		if (pts.length === 1) return { d: `M${pts[0].x},${pts[0].y}`, last: pts[0] };
		const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
		return { d, last: pts[pts.length - 1] };
	}

	function draw(upto) {
		ringNodes.forEach(([ring, label], t) => {
			const on = t <= upto;
			ring.style.opacity = on ? "1" : "0";
			label.style.opacity = on ? "1" : "0";
		});
		coilNodes.forEach((c, j) => {
			const { d, last } = pathFor(j, upto);
			c.line.setAttribute("d", d);
			c.hit.setAttribute("d", d);
			c.dot.setAttribute("cx", last.x);
			c.dot.setAttribute("cy", last.y);
		});
		const t = Math.min(Math.round(upto), g.n - 1);
		fill.setAttribute("points", data.primes.map((_, j) => { const p = g.point(t, j); return `${p.x},${p.y}`; }).join(" "));
	}

	let current = -1;
	function select(j) {
		current = j;
		coilNodes.forEach((c, i) => c.group.classList.toggle("is-on", i === j));
		svg.classList.toggle("has-selection", j >= 0);
		if (!caption) return;
		if (j < 0) {
			caption.textContent = `${names.length} orthogonal work primes from ${Object.values(data.counts).reduce((a, b) => a + b, 0).toLocaleString("en-US")} commits, beads, pull requests and notes. Choose a coil.`;
			return;
		}
		const share = (data.variance[j] * 100).toFixed(1);
		const peak = data.radius.reduce((best, row, t) => (row[j] > data.radius[best][j] ? t : best), 0);
		caption.textContent = `Prime ${j + 1}, ${names[j]}: ${share}% of the variance, strongest in ${data.months[peak]}.`;
	}
	coilNodes.forEach((c, j) => {
		c.group.addEventListener("click", () => select(current === j ? -1 : j));
		c.group.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(current === j ? -1 : j); }
			if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); const n = (j + 1) % coilNodes.length; coilNodes[n].group.focus(); select(n); }
			if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); const n = (j - 1 + coilNodes.length) % coilNodes.length; coilNodes[n].group.focus(); select(n); }
		});
	});

	figure.querySelector("[data-helix-fallback]")?.remove();
	figure.prepend(svg);
	figure.classList.add("is-live");
	select(-1);

	const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (still) {
		draw(g.n - 1);
		return;
	}
	const duration = 2600;
	let t0 = null;
	function frame(ts) {
		if (t0 === null) t0 = ts;
		const f = Math.min(1, (ts - t0) / duration);
		const eased = 1 - Math.pow(1 - f, 3);
		draw(eased * (g.n - 1));
		if (f < 1) requestAnimationFrame(frame);
	}
	draw(0);
	requestAnimationFrame(frame);
}

const figure = document.querySelector("[data-helix]");
if (figure) {
	fetch(figure.dataset.helix)
		.then((r) => (r.ok ? r.json() : Promise.reject(new Error(`helix data ${r.status}`))))
		.then((data) => mountHelix(figure, data))
		.catch(() => figure.classList.add("is-failed"));
}
