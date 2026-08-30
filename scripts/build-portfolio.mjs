#!/usr/bin/env node
/**
 * Generates /studies, /studies/[slug], /work, /work/[slug], /writing, /about
 * from data/portfolio.json. Static output, no runtime framework, consistent
 * with this repo's existing no-build-step Vercel deployment.
 *
 * Run: node scripts/build-portfolio.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const data = JSON.parse(readFileSync(path.join(ROOT, "data/portfolio.json"), "utf8"));

const SITE = "https://www.gianyrox.com";
const NAV = (current) => `
	<nav class="site-nav" aria-label="Primary">
		<a href="/" ${current === "home" ? 'aria-current="page"' : ""}>Home</a>
		<a href="/studies/" ${current === "studies" ? 'aria-current="page"' : ""}>Research</a>
		<a href="/work/" ${current === "work" ? 'aria-current="page"' : ""}>Work</a>
		<a href="/writing/" ${current === "writing" ? 'aria-current="page"' : ""}>Writing</a>
		<a href="/about/" ${current === "about" ? 'aria-current="page"' : ""}>About</a>
	</nav>`;

const HEAD = ({ title, description, canonical, jsonLd = "" }) => `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${esc(title)}</title>
	<meta name="description" content="${esc(description)}">
	<link rel="canonical" href="${canonical}">
	<link rel="icon" type="image/x-icon" href="/public/brand/favicon.ico">
	<link rel="apple-touch-icon" sizes="180x180" href="/public/brand/apple-touch-icon.png">
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap">
	<link rel="stylesheet" href="/public/css/site.css">
	<meta name="theme-color" content="#264653">
	<meta property="og:type" content="website">
	<meta property="og:title" content="${esc(title)}">
	<meta property="og:description" content="${esc(description)}">
	<meta property="og:url" content="${canonical}">
	<meta property="og:image" content="${SITE}/public/brand/og-image.png">
	<meta name="twitter:card" content="summary_large_image">
	${jsonLd}
</head>
<body>
	<div class="container">`;

const FOOT = `
	</div>
</body>
</html>
`;

function esc(s = "") {
	return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function badge(type, ai) {
	if (ai) return "";
	return `<span class="badge">${esc(type)}</span>`;
}

function isAI(type = "") {
	return /AI-assisted/i.test(type);
}

function writeFile(relPath, content) {
	const full = path.join(ROOT, relPath);
	mkdirSync(path.dirname(full), { recursive: true });
	writeFileSync(full, content, "utf8");
	console.log("wrote", relPath);
}

function linkButtons(links = {}, accessNote) {
	const labels = { code: "Code", paper: "Paper", doi: "DOI", dataset: "Data", demo: "Demo / Site", download: "Download" };
	let out = `<div class="cs-links">`;
	for (const [k, v] of Object.entries(links)) {
		if (!v) continue;
		out += `<a class="btn" href="${v}" target="_blank" rel="noopener">${labels[k] || k}</a>`;
	}
	out += `</div>`;
	if (accessNote) out += `<p class="disclosure">${esc(accessNote)}</p>`;
	return out;
}

function researchDirections() {
	const items = data.researchInterests || [];
	if (!items.length) return "";
	let out = `<h2 class="section-header">Research Directions</h2>`;
	out += `<p class="tagline" style="margin-top:0;">${esc(data.phdStatement || "")}</p>`;
	out += `<div class="rdir-list">`;
	for (const r of items) {
		out += `<div class="rdir${r.lead ? " lead" : ""}">
			<span class="rdir-code">${esc(r.code)}</span>
			<span class="rdir-title">${esc(r.title)}</span>
			<p class="rdir-body">${esc(r.body)}</p>
		</div>`;
	}
	out += `</div>`;
	out += `<p class="disclosure">${esc(data.researchInterestsNote || "")}</p>`;
	out += `<div class="link-row"><a href="/research/">Open ML tools for labs, seven benchmarked and open-source</a><a href="/public/Master_Portfolio_2026.pdf">Master portfolio (PDF)</a></div>`;
	return out;
}

function relatedList(allItems, related = []) {
	if (!related.length) return "";
	const bySlug = Object.fromEntries(allItems.map((i) => [i.slug, i]));
	const items = related.map((s) => bySlug[s]).filter(Boolean);
	if (!items.length) return "";
	return `<div class="cs-section"><h2>Related</h2><div class="link-row">${items
		.map((i) => `<a href="/${i._section}/${i.slug}/">${esc(i.shortTitle || i.title)}</a>`)
		.join("")}</div></div>`;
}

// ---- tag section for lookups ----
const allStudies = data.studies.map((s) => ({ ...s, _section: "studies" }));
const allWork = data.work.map((s) => ({ ...s, _section: "work" }));
const allManuals = (data.manuals || []).map((s) => ({ ...s, _section: "writing" }));
const allItems = [...allStudies, ...allWork, ...allManuals];

// ============ CASE STUDY DETAIL PAGE ============
function detailPage(item, sectionSlug, navKey) {
	const title = `${item.title}, Gianangelo Dichio`;
	const description = (item.question || item.description || item.method || "").slice(0, 155);
	const canonical = `${SITE}/${sectionSlug}/${item.slug}/`;

	let jsonLd = "";
	if (item._section === "studies" && item.doi) {
		jsonLd = `<script type="application/ld+json">${JSON.stringify({
			"@context": "https://schema.org",
			"@type": "ScholarlyArticle",
			name: item.fullTitle || item.title,
			author: item.author || "Gianangelo Dichio",
			url: canonical,
		})}</script>`;
	}

	const rows = [];
	if (item.fullTitle) rows.push(`<!-- voice-ignore-line: verbatim external paper title --><p class="cs-scope"><em>${esc(item.fullTitle)}</em></p>`);
	if (item.author) rows.push(`<p class="cs-scope">${esc(item.author)}</p>`);
	if (item.scale) rows.push(`<p class="cs-scope"><strong>${esc(item.scale)}</strong></p>`);

	let body = HEAD({ title, description, canonical, jsonLd });
	body += `${NAV(navKey)}`;
	const backLabel = sectionSlug === "studies" ? "Research" : sectionSlug === "work" ? "Work" : "Writing";
	body += `<a class="cs-back" href="/${sectionSlug}/">&larr; Back to ${backLabel}</a>`;
	body += `<div class="cs-header">`;
	body += `<div>${badge(item.type, isAI(item.type))}${item.typeSecondary ? " " + badge(item.typeSecondary, false) : ""}</div>`;
	body += `<h1 class="cs-title">${esc(item.title)}</h1>`;
	body += rows.join("\n");
	body += linkButtons(item.links, item.accessNote);
	body += `</div>`;

	if (item.question) body += `<div class="cs-section"><h2>Question</h2><p>${esc(item.question)}</p></div>`;
	if (item.role) body += `<div class="cs-section"><h2>Role</h2><p>${esc(item.role)}</p></div>`;
	if (item.method) body += `<div class="cs-section"><h2>Method</h2><p>${esc(item.method)}</p></div>`;
	if (item.keyFindings) body += `<div class="cs-section"><h2>Key findings</h2><p>${esc(item.keyFindings)}</p></div>`;

	if (item.humanContribution || item.aiContribution) {
		body += `<div class="cs-section"><h2>Division of work</h2><div class="cs-grid">`;
		if (item.humanContribution) body += `<div><strong>Human</strong><p>${esc(item.humanContribution)}</p></div>`;
		if (item.aiContribution) body += `<div><strong>AI</strong><p>${esc(item.aiContribution)}</p></div>`;
		body += `</div></div>`;
	}

	if (item.verification || item.limitations) {
		body += `<div class="cs-section"><h2>Verification and limitations</h2>`;
		if (item.verification) body += `<p>${esc(item.verification)}</p>`;
		if (item.limitations) body += `<p>${esc(item.limitations)}</p>`;
		body += `</div>`;
	}
	if (item.personalNote) body += `<div class="cs-section"><h2>Why this matters to me</h2><p>${esc(item.personalNote)}</p></div>`;

	body += relatedList(allItems, item.related);
	body += FOOT;
	writeFile(`${sectionSlug}/${item.slug}/index.html`, body);
}

// ============ INDEX PAGES (Research / Work) ============
function indexPage({ sectionSlug, navKey, title, description, items, intro }) {
	const types = [...new Set(items.map((i) => i.type))];
	let body = HEAD({ title: `${title}, Gianangelo Dichio`, description, canonical: `${SITE}/${sectionSlug}/` });
	body += NAV(navKey);
	body += `<h1 class="title" style="font-size:clamp(28px,6vw,40px);">${esc(title)}</h1>`;
	body += `<p class="tagline">${esc(intro)}</p>`;
	if (sectionSlug === "studies") {
		body += researchDirections();
		body += `<h2 class="section-header">Portfolio</h2>`;
		body += `<p class="disclosure">${esc(data.aiDisclosure)}</p>`;
	}

	body += `<div class="filter-row" role="group" aria-label="Filter by type">
		<button class="filter-chip" data-filter="all" aria-pressed="true">All</button>
		${types.map((t) => `<button class="filter-chip" data-filter="${esc(t)}" aria-pressed="false">${esc(t)}</button>`).join("")}
	</div>`;

	body += `<div class="card-list" id="card-list">`;
	for (const item of items) {
		body += `<a class="pcard" href="/${sectionSlug}/${item.slug}/" data-type="${esc(item.type)}">
			<div class="pcard-top"><span class="pcard-title">${esc(item.title)}</span>${badge(item.type, isAI(item.type))}</div>
			<div class="pcard-scope">${esc(item.question || item.description || item.method || "")}</div>
			<div class="pcard-meta">${esc(item.scale || item.date || "")}</div>
		</a>`;
	}
	body += `</div>`;

	body += `<script>
	(function(){
		var chips = document.querySelectorAll('.filter-chip');
		var cards = document.querySelectorAll('#card-list .pcard');
		chips.forEach(function(chip){
			chip.addEventListener('click', function(){
				chips.forEach(function(c){ c.setAttribute('aria-pressed','false'); });
				chip.setAttribute('aria-pressed','true');
				var f = chip.getAttribute('data-filter');
				cards.forEach(function(card){
					card.style.display = (f === 'all' || card.getAttribute('data-type') === f) ? '' : 'none';
				});
			});
		});
	})();
	</script>`;
	body += FOOT;
	writeFile(`${sectionSlug}/index.html`, body);
}

// ============ WRITING PAGE ============
function writingPage() {
	let body = HEAD({
		title: "Writing, Gianangelo Dichio",
		description: "Books, essays, and science communication by Gianangelo Dichio.",
		canonical: `${SITE}/writing/`,
	});
	body += NAV("writing");
	body += `<h1 class="title" style="font-size:clamp(28px,6vw,40px);">Writing</h1>`;
	body += `<p class="tagline">Published nonfiction and essays on research, AI, and science communication.</p>`;

	for (const w of data.writing) {
		body += `<div class="book-card">
			<div class="book-body">
				<div class="book-title">${esc(w.title)} <span class="badge">${esc(w.type)}</span></div>
				<div class="book-blurb">${esc(w.description)}</div>
				<p class="disclosure">${esc(w.aiContribution)} ${esc(w.verification)}</p>
				<div class="book-actions"><a class="btn primary" href="${w.links.paper}">Read more</a></div>
			</div>
		</div>`;
	}

	body += `<h2 class="section-header">Manuals &amp; Syntheses</h2>`;
	body += `<div class="card-list">`;
	for (const m of allManuals) {
		body += `<a class="pcard" href="/writing/${m.slug}/">
			<div class="pcard-top"><span class="pcard-title">${esc(m.title)}</span>${badge(m.type, false)}</div>
			<div class="pcard-scope">${esc(m.question || "")}</div>
			<div class="pcard-meta">${esc(m.scale || "")}</div>
		</a>`;
	}
	body += `</div>`;

	body += `<h2 class="section-header">Selected Essays</h2>`;
	body += `<nav class="writing-list" aria-label="Selected essays">`;
	for (const e of data.essays) {
		body += `<a href="${e.url}" target="_blank" rel="noopener">${esc(e.title)}</a>`;
	}
	body += `</nav>`;
	body += `<p class="disclosure">${esc(data.essaysNote)}</p>`;
	body += FOOT;
	writeFile("writing/index.html", body);
}

// ============ ABOUT PAGE ============
function aboutPage() {
	let body = HEAD({
		title: "About, Gianangelo Dichio",
		description: "Gianangelo Dichio, applying to PhD programs in artificial intelligence. Education, research directions, teaching, and awards.",
		canonical: `${SITE}/about/`,
	});
	body += NAV("about");
	body += `<h1 class="title" style="font-size:clamp(28px,6vw,40px);">About</h1>`;
	body += `<p class="tagline">${esc(data.heroCopy)}</p>`;

	body += `<h2 class="section-header">Doctoral Study</h2>
	<p style="text-align:center;max-width:560px;">${esc(data.phdStatement || "")}</p>
	<div style="text-align:center;"><a class="btn" href="/studies/">See the research directions</a></div>`;

	body += `<h2 class="section-header">Education</h2>
	<p style="text-align:center;max-width:560px;">M.S. Data Science and B.S. Pure and Applied Mathematics, Stevens Institute of Technology, completed in four years. Quantum Computing, WorldStrides Summer Institute, Oriel College, University of Oxford (non-degree, Summer 2023), with Dr. Kobi Kremnitzer. Quantum Optics Lab, Professor Xiaofeng Qian's group, Stevens, approximately one academic year: mathematical work, literature and paper analysis, and analysis of experimental results and data.</p>`;

	body += `<h2 class="section-header">Academic Appointment</h2>
	<p style="text-align:center;max-width:560px;">Adjunct Professor of Mathematics, County College of Morris, appointed for Fall 2026. Scheduled to teach MAT 124 Statistics (3 credits) and MAT 130 Probability and Statistics in both 3-credit and 4-credit formats, with a coding component in the 4-credit section.</p>`;

	body += `<h2 class="section-header">Citizenship and Languages</h2>
	<p style="text-align:center;">Citizenship: Italy (EU), United States. Languages: English (native), Italian (fluent), Spanish (functional).</p>`;

	body += `<h2 class="section-header">Full Portfolio</h2>
	<p style="text-align:center;max-width:560px;">Full employment history, complete coursework, teaching record, and awards are in the downloadable master portfolio.</p>
	<div style="text-align:center;"><a class="btn primary" href="/public/Master_Portfolio_2026.pdf" target="_blank" rel="noopener">Download master portfolio (PDF)</a></div>`;

	body += FOOT;
	writeFile("about/index.html", body);
}

// ---- build ----
for (const item of allStudies) detailPage(item, "studies", "studies");
for (const item of allWork) detailPage(item, "work", "work");
for (const item of allManuals) detailPage(item, "writing", "writing");

indexPage({
	sectionSlug: "studies",
	navKey: "studies",
	title: "Research",
	description: "Research directions, infrastructure, working papers, and AI-assisted computational studies by Gianangelo Dichio, applying to PhD programs in artificial intelligence.",
	items: data.studies,
	intro: "The research case for a PhD in artificial intelligence: directions I want to work on, and the infrastructure, papers, and computational studies behind them. Each entry states its type and how AI was used.",
});

indexPage({
	sectionSlug: "work",
	navKey: "work",
	title: "Work",
	description: "Engineering, AI systems, and venture case studies by Gianangelo Dichio.",
	items: data.work,
	intro: "Engineering, AI-systems, and venture case studies.",
});

writingPage();
aboutPage();

console.log("Portfolio build complete.");
