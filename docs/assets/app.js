/**
 * app.js - draws the newspaper in your browser.
 *
 * It reads the JSON files written each morning by scripts/fetch_news.py
 * (docs/data/latest.json and docs/data/<date>.json) and builds the page.
 * No frameworks, no build step, no trackers. Every user-visible text is
 * inserted with textContent / DOM methods (never innerHTML) so a malicious
 * headline can never run code.
 */
import { BookmarkStore } from "./bookmarks.js";

const store = new BookmarkStore();
const WPM = 230;

/* ------------------------------------------------------------------ helpers */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Tiny safe DOM builder:  h("p", {class:"x"}, "text", childElement) */
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid);
  return el;
}

let edition = null;         // the edition currently shown
const articles = new Map();   // id -> { a, sectionTitle }
let keyword = "";               // active keyword filter ("" = none)

function fmtTime(iso) {
  if (!iso) return "";
  const opts = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
  try {
    return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: edition?.edition?.timezone }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-GB", opts).format(new Date(iso));
  }
}

function download(filename, text, mime) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = h("a", { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ------------------------------------------------------- display preferences */
const UI_KEY = "morning-ledger:ui";
function loadUi() {
  try { return JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch { return {}; }
}
function saveUi(patch) {
  try { localStorage.setItem(UI_KEY, JSON.stringify({ ...loadUi(), ...patch })); } catch { /* ignore */ }
}
function applyUi() {
  const ui = loadUi();
  if (ui.theme === "night") document.documentElement.dataset.theme = "night";
  else delete document.documentElement.dataset.theme;
  document.documentElement.style.setProperty("--base", `${ui.size || 17}px`);
}
$("#btn-theme").addEventListener("click", () => {
  saveUi({ theme: loadUi().theme === "night" ? "day" : "night" });
  applyUi();
});
for (const [id, delta] of [["#btn-smaller", -1], ["#btn-larger", 1]]) {
  $(id).addEventListener("click", () => {
    saveUi({ size: Math.min(22, Math.max(14, (loadUi().size || 17) + delta)) });
    applyUi();
  });
}
applyUi();

/* ----------------------------------------------- sanitising full-text articles
   The fetcher already cleans article HTML. This is a second safety net: we
   rebuild it in the browser, keeping only a short list of harmless tags. */
const ALLOWED = new Set(["P", "H2", "H3", "H4", "UL", "OL", "LI", "BLOCKQUOTE", "EM", "STRONG", "B", "I", "A", "BR", "CODE", "PRE"]);
function rebuild(from, into) {
  for (const node of from.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      into.append(node.textContent);
    } else if (node.nodeType === Node.ELEMENT_NODE && ALLOWED.has(node.tagName)) {
      const el = document.createElement(node.tagName);
      if (node.tagName === "A") {
        const href = node.getAttribute("href") || "";
        if (/^https?:\/\//i.test(href)) {
          el.href = href;
          el.target = "_blank";
          el.rel = "noopener noreferrer nofollow";
        }
      }
      rebuild(node, el);
      into.append(el);
    }
  }
}
function safeFragment(html) {
  const body = new DOMParser().parseFromString(html || "", "text/html").body;
  const frag = document.createDocumentFragment();
  rebuild(body, frag);
  return frag;
}

/* ---------------------------------------------------------------- bookmarks UI */
function ensureProfile() {
  if (store.active) return true;
  openSaved();
  setMsg("Please enter your name below to start saving articles.");
  $("#profile-name").focus();
  return false;
}

function toggleSave(a, sectionTitle) {
  if (!ensureProfile()) return;
  if (store.has(a.id)) store.remove(a.id);
  else store.add(a, sectionTitle);
}

function syncSaveButtons() {
  for (const btn of $$(".save-btn[data-id]")) {
    const on = store.has(btn.dataset.id);
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? "★ Saved" : "☆ Save";
  }
  $("#saved-count").textContent = String(store.count());
}

function setMsg(text) { $("#profile-msg").textContent = text || ""; }

function renderSavedPanel() {
  // profile dropdown
  const sel = $("#profile-select");
  sel.replaceChildren(
    ...(store.profileNames().length
      ? store.profileNames().map((n) => h("option", { value: n, ...(n === store.active ? { selected: true } : {}) }, n))
      : [h("option", { value: "" }, "(no profile yet)")])
  );
  sel.disabled = !store.active;
  $("#profile-delete").disabled = !store.active;
  for (const id of ["#export-json", "#export-md", "#saved-search"]) $(id).disabled = !store.active;

  // list
  const list = $("#saved-list");
  const items = store.list($("#saved-search").value);
  if (!store.active) {
    list.replaceChildren(h("li", { class: "small" }, "Enter your name above to start your personal reading list."));
  } else if (!items.length) {
    list.replaceChildren(h("li", { class: "small" }, store.count() ? "No saved article matches your search." : "Nothing saved yet — tap ☆ Save on any story."));
  } else {
    list.replaceChildren(...items.map((b) =>
      h("li", {},
        h("a", { href: b.url, target: "_blank", rel: "noopener noreferrer" }, b.title),
        h("div", { class: "meta" },
          h("span", {}, b.source),
          b.section ? h("span", {}, b.section) : null,
          h("span", {}, `saved ${b.savedAt.slice(0, 10)}`),
          h("button", { type: "button", "aria-label": `Remove ${b.title}`, onclick: () => store.remove(b.id) }, "Remove"))
      )));
  }
  if (store.isMemoryOnly) setMsg("Your browser is blocking storage, so saved articles disappear when you close this tab. Use “Download” to keep a copy.");
}

function openSaved() { $("#saved-panel").hidden = false; renderSavedPanel(); }
function closeSaved() { $("#saved-panel").hidden = true; }

$("#btn-saved").addEventListener("click", () => ($("#saved-panel").hidden ? openSaved() : closeSaved()));
$("#saved-close").addEventListener("click", closeSaved);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#saved-panel").hidden) closeSaved(); });
$("#saved-search").addEventListener("input", renderSavedPanel);
$("#profile-select").addEventListener("change", (e) => store.selectProfile(e.target.value));
$("#profile-delete").addEventListener("click", () => {
  if (store.active && confirm(`Delete the profile "${store.active}" and all its saved articles? This cannot be undone.`)) store.deleteProfile(store.active);
});
$("#profile-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const res = store.createProfile($("#profile-name").value);
  setMsg(res.ok ? (res.switched ? "Welcome back! Switched to your profile." : "Profile created. Happy reading!") : res.error);
  if (res.ok) $("#profile-name").value = "";
});
const stamp = () => `${(store.active || "reader").replace(/[^\w-]+/g, "_")}-${new Date().toISOString().slice(0, 10)}`;
$("#export-json").addEventListener("click", () => download(`saved-${stamp()}.json`, store.exportJSON(), "application/json"));
$("#export-md").addEventListener("click", () => download(`saved-${stamp()}.md`, store.exportMarkdown(), "text/markdown"));
$("#import-file").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const res = store.importJSON(await file.text());
  setMsg(res.ok ? `Imported ${res.added} article(s) into "${res.profile}".` : res.error);
  e.target.value = "";
});
store.addEventListener("change", () => { syncSaveButtons(); if (!$("#saved-panel").hidden) renderSavedPanel(); });

/* ------------------------------------------------------------- reader dialog */
function openReader(a, sectionTitle) {
  $("#reader-kicker").textContent = `${a.source} · ${sectionTitle}`;
  $("#reader-title").textContent = a.title;
  $("#reader-byline").textContent = [a.author && `By ${a.author}`, fmtTime(a.published)].filter(Boolean).join(" · ");
  $("#reader-text").replaceChildren(safeFragment(a.full_html));

  const lic = a.license_url
    ? h("a", { href: a.license_url, target: "_blank", rel: "noopener noreferrer" }, a.license)
    : a.license || "see original";
  $("#reader-footer").replaceChildren(
    `Source: ${a.source}. Licence: `, lic, ". ",
    "Images, ads and scripts removed for easier reading; text otherwise unaltered. ",
    h("a", { href: a.url, target: "_blank", rel: "noopener noreferrer" }, "Read the original ↗")
  );
  const save = $("#reader-save");
  save.dataset.id = a.id;
  save.onclick = () => toggleSave(a, sectionTitle);
  syncSaveButtons();
  $("#reader").showModal();
  $("#reader .reader-body").scrollTop = 0;
}

/* ------------------------------------------------------------- article card */
function articleCard(a, sectionTitle, { compact = false, lead = false } = {}) {
  const readable = Boolean(a.full_html);
  const link = readable
    ? h("a", { href: a.url, onclick: (e) => { e.preventDefault(); openReader(a, sectionTitle); } }, a.title)
    : h("a", { href: a.url, target: "_blank", rel: "noopener noreferrer" }, a.title);
  const heading = h(lead ? "h2" : "h3", {}, link);

  return h("article", { class: `card${lead ? " lead" : ""}`, "data-text": `${a.title} ${a.summary}`.toLowerCase() },
    h("p", { class: "kicker" }, a.source),
    heading,
    !compact && a.summary ? h("p", { class: "summary" }, a.summary) : null,
    h("div", { class: "meta" },
      a.author ? h("span", {}, a.author) : null,
      a.published ? h("time", { datetime: a.published }, fmtTime(a.published)) : null,
      readable ? h("span", {}, `${Math.max(1, Math.round(a.words / WPM))} min read`) : null,
      a.license ? h("span", { class: "lic", title: "Content licence" }, a.license) : null,
      h("span", { class: "card-actions" },
        h("button", { type: "button", class: "save-btn", "data-id": a.id, "aria-pressed": "false", onclick: () => toggleSave(a, sectionTitle) }, "☆ Save"),
        h("a", { href: a.url, target: "_blank", rel: "noopener noreferrer" }, readable ? "Original ↗" : "Read at source ↗"))
    ));
}

/* ----------------------------------------------------------------- page parts */
function renderMasthead(e) {
  document.title = `${e.edition.name} — ${e.edition.date_long}`;
  $("#mh-title").textContent = e.edition.name;
  $("#mh-date").textContent = e.edition.date_long;
  $("#mh-tagline").textContent = e.edition.tagline;
  $("#mh-updated").textContent = `Compiled ${fmtTime(e.edition.generated_at)}`;
}

function renderNav(e) {
  $("#section-nav").replaceChildren(
    h("li", {}, h("a", { href: "#glance" }, "At a glance")),
    ...e.sections.map((s) => h("li", {}, h("a", { href: `#sec-${s.id}` }, s.title)))
  );
}

function renderDashboard(e) {
  const d = e.dashboard;
  const stat = (num, lbl) => h("div", { class: "stat" }, h("div", { class: "num" }, String(num)), h("div", { class: "lbl" }, lbl));

  const chips = d.keywords.length
    ? d.keywords.map((k) =>
        h("button", { type: "button", class: "chip", "aria-pressed": String(keyword === k.term), onclick: () => setKeyword(keyword === k.term ? "" : k.term) },
          k.term, h("small", {}, `×${k.count}`)))
    : [h("span", { class: "empty" }, "Not enough stories to find trends yet.")];

  const markets = d.markets.length
    ? d.markets.map((m) => {
        const up = m.change_pct > 0, down = m.change_pct < 0;
        const chg = m.change_pct == null ? "" : `${up ? "▲ +" : down ? "▼ " : ""}${m.change_pct.toFixed(2)}%`;
        return h("li", { title: `Source: ${m.source}` },
          h("span", {}, m.label),
          h("span", {}, h("span", { class: "val" }, m.display), " ", h("span", { class: `chg ${up ? "up" : down ? "down" : ""}` }, chg)));
      })
    : [h("li", { class: "empty" }, "Market data unavailable right now.")];

  return h("section", { class: "glance", id: "glance", "aria-labelledby": "glance-h" },
    h("h2", { id: "glance-h" }, "Today at a glance"),
    h("div", { class: "stats" },
      stat(d.total_articles, "Articles curated"),
      stat(`~${d.reading_minutes} min`, "Reading time"),
      stat(d.source_count, "Sources"),
      stat(d.full_text_count, "Full-text pieces")),
    h("div", { class: "glance-row" },
      h("div", {}, h("h3", {}, "Trending keywords (tap to filter)"), h("div", { class: "chips" }, chips)),
      h("div", {}, h("h3", {}, "Markets"), h("ul", { class: "markets" }, markets),
        h("p", { class: "fine" }, "Indices: Stooq (change since open). Currencies: ECB reference rates via Frankfurter. Crypto: CoinGecko. Informational only — not investment advice."))));
}

function wordBox(e) {
  const w = e.word_of_the_day, dw = e.dictionary_word;
  if (!w) return null;
  return h("aside", { class: "wotd", "aria-label": "Business word of the day" },
    h("p", { class: "label" }, "Business Word of the Day"),
    h("div", { class: "term" }, w.term),
    h("span", { class: "pos" }, [w.pos, w.domain].filter(Boolean).join(" · ")),
    h("p", {}, w.definition),
    w.example ? h("p", { class: "example" }, `“${w.example}”`) : null,
    dw ? h("div", { class: "alt" }, h("strong", {}, "From the dictionary: "),
      h("a", { href: dw.url, target: "_blank", rel: "noopener noreferrer" }, dw.word),
      ` — ${dw.definition} `, h("small", {}, `(${dw.source}, `, h("a", { href: dw.license_url, target: "_blank", rel: "noopener noreferrer" }, dw.license), ")")) : null);
}

function renderFrontPage(sec) {
  const [lead, ...rest] = sec.articles;
  if (!lead) return null;
  const alsoList = rest.slice(0, 4);
  return h("section", { class: "frontpage", id: `sec-${sec.id}`, "aria-label": sec.title },
    articleCard(lead, sec.title, { lead: true }),
    h("div", { class: "also" }, h("h3", {}, "Also in the news"),
      alsoList.map((a) => articleCard(a, sec.title, { compact: true }))));
}

function renderSection(sec, list, isMore = false) {
  const body = [];
  if (sec.id === "business-trends") body.push(wordBox(edition));
  body.push(...list.map((a) => articleCard(a, sec.title)));
  return h("section", { class: "section", id: isMore ? `sec-${sec.id}-more` : `sec-${sec.id}` },
    h("div", { class: "section-head" },
      h("h2", {}, isMore ? `${sec.title} — more` : sec.title),
      h("span", { class: "kicker" }, sec.kicker)),
    list.length || sec.id === "business-trends"
      ? h("div", { class: "columns" }, body)
      : h("p", { class: "empty" }, "No stories were available from this section’s feeds today."));
}

function renderColophon(e) {
  const sources = e.sources.map((s) =>
    h("li", {},
      s.site ? h("a", { href: s.site, target: "_blank", rel: "noopener noreferrer" }, s.name) : s.name,
      s.license ? [" — ", s.license_url ? h("a", { href: s.license_url, target: "_blank", rel: "noopener noreferrer" }, s.license) : s.license] : null,
      s.full_text ? " (full text shown)" : " (headline & excerpt only)"));
  return [
    h("h2", {}, "Sources & attribution"),
    h("p", {}, "Every story is read from its publisher’s public RSS/Atom feed. Headlines and short excerpts belong to their publishers and link back to the original. Full text appears only where the licence permits it. This page has no ads, trackers or accounts; saved articles stay in your browser."),
    h("ul", {}, sources),
    e.errors?.length
      ? h("details", {}, h("summary", {}, `${e.errors.length} feed warning(s) during compilation`), h("ul", {}, e.errors.map((x) => h("li", {}, x))))
      : null,
  ];
}

/* ----------------------------------------------------------------- filtering */
function setKeyword(term) {
  keyword = term;
  for (const chip of $$(".chip")) chip.setAttribute("aria-pressed", String(chip.firstChild.textContent === term));
  for (const card of $$(".card")) card.hidden = Boolean(term) && !card.dataset.text.includes(term);
  for (const box of $$(".section, .frontpage")) box.hidden = Boolean(term) && !$(".card:not([hidden])", box);
  const notice = $("#notice");
  notice.hidden = !term && !edition.edition.is_sample;
  if (term) {
    notice.replaceChildren(`Showing stories that mention “${term}”. `, h("button", { type: "button", onclick: () => setKeyword("") }, "Clear filter"));
  } else if (edition.edition.is_sample) {
    showSampleNotice();
  }
}
function showSampleNotice() {
  $("#notice").hidden = false;
  $("#notice").textContent = "This is a SAMPLE edition with placeholder text. Run the “Daily Morning Edition” workflow on GitHub to fetch real news.";
}

/* ---------------------------------------------------------------- main render */
function render(e) {
  edition = e;
  keyword = "";
  articles.clear();
  for (const s of e.sections) for (const a of s.articles) articles.set(a.id, { a, sectionTitle: s.title });

  renderMasthead(e);
  renderNav(e);
  const main = $("#edition");
  const national = e.sections[0];
  const parts = [renderDashboard(e)];

  // The first section's top stories form the "front page"; the remainder follow below it.
  let nationalRest = [];
  if (national) {
    const front = renderFrontPage(national);
    if (front) parts.push(front);
    nationalRest = national.articles.slice(front ? 5 : 0);
    if (nationalRest.length) parts.push(renderSection(national, nationalRest, true));
  }
  for (const s of e.sections.slice(1)) parts.push(renderSection(s, s.articles));

  main.replaceChildren(...parts);
  $("#colophon").replaceChildren(...renderColophon(e).filter(Boolean));
  $("#notice").hidden = !e.edition.is_sample;
  if (e.edition.is_sample) showSampleNotice();
  syncSaveButtons();
}

async function getJson(path) {
  const base = location.pathname.includes('/Morning-Edition') ? '/Morning-Edition/' : './';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(cleanPath, location.origin + base).href;

  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

async function loadEdition(date) {
  try {
    render(await getJson(date ? `data/${date}.json` : "data/latest.json"));
  } catch (err) {
    $("#edition").replaceChildren(h("p", { class: "notice" },
      "Could not load the edition. If you opened this file directly from your computer, start a local server instead (see README). Details: " + err.message));
  }
}

async function init() {
  let dates = [];
  try { dates = (await getJson("data/index.json")).dates; } catch { /* older deployments: fine */ }
  const picker = $("#date-picker");
  picker.replaceChildren(...dates.map((d, i) => h("option", { value: d }, i === 0 ? `${d} (latest)` : d)));
  picker.hidden = dates.length < 2;
  picker.addEventListener("change", () => loadEdition(picker.value));
  await loadEdition(new URLSearchParams(location.search).get("date") || "");
  renderSavedPanel();
}

init();
