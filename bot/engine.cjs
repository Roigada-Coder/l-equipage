// Moteur partagé avec le site : on charge le script de index.html tel quel,
// pour que le bot utilise exactement les mêmes films, jeux, questions et calculs.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function load() {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const js = html.split("<script>")[1].split("</script>")[0];
  const dummy = { set innerHTML(v) {}, textContent: "", onclick: null, oninput: null };
  const el = { ...dummy, querySelector: () => ({ ...dummy }), querySelectorAll: () => [] };
  const ctx = {
    document: { getElementById: () => el, createRange: () => ({ selectNodeContents() {} }) },
    window: { scrollTo() {} },
    navigator: {},
    getSelection: () => ({ removeAllRanges() {}, addRange() {} }),
    btoa: (s) => Buffer.from(s, "binary").toString("base64"),
    atob: (s) => Buffer.from(s, "base64").toString("binary"),
    escape, unescape,
  };
  vm.createContext(ctx);
  vm.runInContext(js + "\n;globalThis.__eng={S,MODES,ranked,eligible,explain,verdictLine};", ctx);
  return ctx.__eng;
}

const E = load();

/** Les questions d'une rubrique ("film" ou "game"). */
function questions(mode) {
  return E.MODES[mode].Q;
}

/** Libellé lisible d'une réponse. */
function answerLabel(q, value) {
  const t = (v) => (q.o.find((o) => o[0] === v) || [, "?"])[1];
  return q.multi ? (value || []).map(t).join(", ") : t(value);
}

/**
 * Calcule le verdict pour un groupe.
 * players : [{ name, ans }] ; retourne la liste complète classée avec explications.
 */
function verdict(mode, players) {
  const S = E.S;
  S.mode = mode;
  S.play = "local";
  S.n = players.length;
  S.names = players.map((p) => p.name);
  S.ans = players.map((p) => p.ans);
  S.removed = new Set();
  const md = E.MODES[mode];
  const list = E.ranked().map((r, i) => {
    const x = E.explain(r.f);
    const [href, linkLabel] = md.link(r.f);
    return {
      title: r.f.t,
      pitch: r.f.p,
      meta: md.meta(r.f),
      href,
      linkLabel,
      total: r.tot,
      scores: r.s.map((s, k) => ({ name: S.names[k], pct: s.pct })),
      line: E.verdictLine(r, i),
      pros: x.pros,
      cons: x.cons,
    };
  });
  return { rule: md.rule(S.ans), eligible: E.eligible().length, total: md.items.length, noun: md.noun, list };
}

module.exports = { questions, answerLabel, verdict };
