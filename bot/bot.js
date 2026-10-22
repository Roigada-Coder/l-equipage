// Bot Discord de L'Équipage : /soiree film | jeux
// Chacun répond en privé, le bot croise les envies et poste le verdict.
require("dotenv").config();
const {
  Client, GatewayIntentBits, Events, MessageFlags,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, EmbedBuilder,
} = require("discord.js");
const engine = require("./engine");

const GOLD = 0xf4b63f, PLUM = 0x3a2230, RED = 0xe2574c;
const LABEL = { film: "Soirée film", game: "Soirée jeux Steam" };
const MIN_PLAYERS = 2, MAX_PLAYERS = 8, PAGE = 3;

/** Soirées en cours, en mémoire (perdues si le bot redémarre). */
const sessions = new Map();
let counter = 0;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// ——————————————————— Affichage

function lobbyEmbed(s) {
  const names = [...s.answers.values()].map((a) => a.name);
  const e = new EmbedBuilder()
    .setColor(s.closed ? PLUM : GOLD)
    .setTitle(`🏴‍☠️ ${LABEL[s.mode]} · L'Équipage`)
    .setDescription(
      s.cancelled
        ? `Soirée annulée par ${s.cancelledBy}.`
        : s.closed
          ? "Le verdict est tombé, voir ci-dessous."
          : `Lancée par **${s.host}**.\nCliquez sur **Répondre** : le questionnaire s'ouvre en privé, personne ne voit vos réponses avant le verdict.`
    )
    .addFields({
      name: `Ont répondu (${names.length})`,
      value: names.length ? names.map((n) => `✅ ${n}`).join("\n") : "Personne pour l'instant.",
    });
  if (!s.closed) e.setFooter({ text: `Quand tout le monde a répondu, cliquez sur « Voir le verdict » (${MIN_PLAYERS} personnes minimum).` });
  return e;
}

function lobbyRow(s) {
  const done = s.closed;
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`a|${s.id}`).setLabel("Répondre").setStyle(ButtonStyle.Primary).setDisabled(done),
    new ButtonBuilder().setCustomId(`v|${s.id}`).setLabel("Voir le verdict").setStyle(ButtonStyle.Success)
      .setDisabled(done || s.answers.size < MIN_PLAYERS),
    new ButtonBuilder().setCustomId(`x|${s.id}`).setLabel("Annuler").setStyle(ButtonStyle.Secondary).setDisabled(done)
  );
}

function questionView(s, k) {
  const Q = engine.questions(s.mode);
  const q = Q[k];
  const lines = q.o.map(([, t, d]) => `**${t}** · ${d}`).join("\n");
  const embed = new EmbedBuilder()
    .setColor(GOLD)
    .setAuthor({ name: `${LABEL[s.mode]} · question ${k + 1}/${Q.length}` })
    .setTitle(q.h)
    .setDescription(`${q.s ? `*${q.s}*\n\n` : ""}${lines}`);
  const rows = [];
  if (q.multi) {
    rows.push(new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`m|${s.id}|${k}`)
        .setPlaceholder(`Choisis jusqu'à ${Math.min(q.multi, q.o.length)} réponse${q.multi > 1 ? "s" : ""}`)
        .setMinValues(1)
        .setMaxValues(Math.min(q.multi, q.o.length))
        .addOptions(q.o.map(([, t, d], i) => ({ label: t, value: String(i), description: d.slice(0, 100) })))
    ));
  } else {
    for (let i = 0; i < q.o.length; i += 3) {
      rows.push(new ActionRowBuilder().addComponents(
        q.o.slice(i, i + 3).map(([, t], j) =>
          new ButtonBuilder().setCustomId(`o|${s.id}|${k}|${i + j}`).setLabel(t).setStyle(ButtonStyle.Secondary))
      ));
    }
  }
  if (k > 0) {
    rows.push(new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`b|${s.id}|${k}`).setLabel("Question précédente").setStyle(ButtonStyle.Secondary)
    ));
  }
  return { embeds: [embed], components: rows };
}

function recapText(mode, ans) {
  return engine.questions(mode)
    .map((q) => `**${q.h.replace(/ \?$|…$/, "")}** : ${engine.answerLabel(q, ans[q.k])}`)
    .join("\n");
}

const bar = (pct) => "▰".repeat(Math.round(pct / 20)) + "▱".repeat(5 - Math.round(pct / 20));
const cut = (t, n = 1024) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

function resultEmbed(item, rank) {
  const e = new EmbedBuilder()
    .setColor(rank === 1 ? GOLD : PLUM)
    .setTitle(cut(`${rank}. ${item.title} · ${item.total} %`, 256))
    .setURL(item.href)
    .setDescription(cut(`*${item.line}*\n\n${item.pitch}\n${item.meta.join(" · ")}`, 4000))
    .addFields(
      { name: "Envie de chacun", value: cut(item.scores.map((s) => `\`${bar(s.pct)}\` ${s.pct} % · ${s.name}`).join("\n")) },
      { name: "Pourquoi c'est pour vous", value: cut(item.pros.map((p) => `• ${p}`).join("\n") || "—") }
    );
  if (item.cons.length) e.addFields({ name: "À savoir", value: cut(item.cons.map((p) => `• ${p}`).join("\n")) });
  e.setFooter({ text: `${item.linkLabel} : cliquez sur le titre` });
  return e;
}

function moreRow(s) {
  const left = s.result.list.length - s.shown;
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`n|${s.id}`).setLabel(left > 0 ? `${Math.min(PAGE, left)} autres idées` : "Plus d'autres idées")
      .setStyle(ButtonStyle.Secondary).setDisabled(left <= 0),
    new ButtonBuilder().setCustomId(`r|${s.id}`).setLabel("Les réponses de chacun").setStyle(ButtonStyle.Secondary)
  );
}

// ——————————————————— Interactions

const displayName = (i) => i.member?.displayName || i.user.globalName || i.user.username;
const privately = (i, content) => i.reply({ content, flags: MessageFlags.Ephemeral });

async function refreshLobby(s) {
  try { await s.message.edit({ embeds: [lobbyEmbed(s)], components: [lobbyRow(s)] }); }
  catch (err) { console.error("Impossible de mettre à jour le message de la soirée :", err.message); }
}

async function onCommand(i) {
  const mode = i.options.getString("type");
  const id = (++counter).toString(36) + Date.now().toString(36).slice(-5);
  const s = { id, mode, host: displayName(i), answers: new Map(), drafts: new Map(), closed: false, shown: 0 };
  sessions.set(id, s);
  await i.reply({ embeds: [lobbyEmbed(s)], components: [lobbyRow(s)] });
  s.message = await i.fetchReply();
}

async function onComponent(i) {
  const [kind, id, kStr, optStr] = i.customId.split("|");
  const s = sessions.get(id);
  if (!s) return privately(i, "Cette soirée n'existe plus (le bot a peut-être redémarré). Relancez `/soiree`.");
  const uid = i.user.id;
  const Q = engine.questions(s.mode);
  const k = Number(kStr);

  if (kind === "a") {
    if (s.closed) return privately(i, "Cette soirée est terminée. Relancez `/soiree` pour en faire une nouvelle.");
    if (!s.answers.has(uid) && s.answers.size >= MAX_PLAYERS) return privately(i, `Cette soirée est complète (${MAX_PLAYERS} personnes maximum).`);
    s.drafts.set(uid, {});
    return i.reply({ ...questionView(s, 0), flags: MessageFlags.Ephemeral });
  }

  if (kind === "o" || kind === "m" || kind === "b") {
    if (s.closed) return i.update({ content: "Trop tard, le verdict est déjà tombé.", embeds: [], components: [] });
    const draft = s.drafts.get(uid);
    if (!draft) return i.update({ content: "Ton questionnaire a expiré. Clique à nouveau sur **Répondre**.", embeds: [], components: [] });
    if (kind === "b") return i.update(questionView(s, k - 1));
    const q = Q[k];
    if (kind === "o") draft[q.k] = q.o[Number(optStr)][0];
    else {
      let vals = i.values.map((v) => q.o[Number(v)][0]);
      if (q.none && vals.length > 1) vals = vals.filter((v) => v !== q.none);
      draft[q.k] = vals;
    }
    if (k + 1 < Q.length) return i.update(questionView(s, k + 1));
    // Questionnaire terminé
    s.answers.set(uid, { name: displayName(i), ans: { ...draft } });
    s.drafts.delete(uid);
    await i.update({
      embeds: [new EmbedBuilder().setColor(GOLD).setTitle("C'est noté ✅")
        .setDescription(`Tes réponses sont enregistrées. Tu peux refaire le questionnaire avec **Répondre** tant que le verdict n'est pas tombé.\n\n${recapText(s.mode, draft)}`)],
      components: [],
    });
    return refreshLobby(s);
  }

  if (kind === "v") {
    if (s.closed) return privately(i, "Le verdict est déjà tombé.");
    if (s.answers.size < MIN_PLAYERS) return privately(i, `Il faut au moins ${MIN_PLAYERS} réponses pour le verdict.`);
    s.closed = true;
    s.players = [...s.answers.values()];
    s.result = engine.verdict(s.mode, s.players);
    s.shown = Math.min(PAGE, s.result.list.length);
    await refreshLobby(s);
    const head = new EmbedBuilder().setColor(GOLD)
      .setTitle(`🏴‍☠️ Verdict · ${LABEL[s.mode]}`)
      .setDescription(s.result.list.length
        ? `${s.result.rule}\n${s.result.eligible} ${s.result.noun} retenus sur ${s.result.total}, classés selon les envies de ${s.players.map((p) => p.name).join(", ")}.`
        : "Rien ne passe tous vos filtres. Relancez `/soiree` en assouplissant la durée, le budget ou les exclusions.");
    const embeds = [head, ...s.result.list.slice(0, s.shown).map((it, n) => resultEmbed(it, n + 1))];
    return i.reply({ embeds, components: s.result.list.length ? [moreRow(s)] : [] });
  }

  if (kind === "n") {
    const from = s.shown;
    s.shown = Math.min(from + PAGE, s.result.list.length);
    if (from === s.shown) return privately(i, "Il n'y a plus d'autres idées.");
    return i.reply({ embeds: s.result.list.slice(from, s.shown).map((it, n) => resultEmbed(it, from + n + 1)), components: [moreRow(s)] });
  }

  if (kind === "r") {
    const e = new EmbedBuilder().setColor(PLUM).setTitle("Les réponses de chacun");
    s.players.slice(0, 25).forEach((p) => e.addFields({ name: p.name, value: cut(recapText(s.mode, p.ans)) }));
    return i.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
  }

  if (kind === "x") {
    if (s.closed) return privately(i, "Cette soirée est déjà terminée.");
    s.closed = true;
    s.cancelled = true;
    s.cancelledBy = displayName(i);
    await i.update({ embeds: [lobbyEmbed(s)], components: [lobbyRow(s)] });
    sessions.delete(id);
  }
}

client.on(Events.InteractionCreate, async (i) => {
  try {
    if (i.isChatInputCommand() && i.commandName === "soiree") return await onCommand(i);
    if (i.isButton() || i.isStringSelectMenu()) return await onComponent(i);
  } catch (err) {
    console.error(err);
    const msg = { content: "Oups, une erreur est survenue. Réessaie dans un instant.", flags: MessageFlags.Ephemeral };
    if (i.isRepliable()) (i.replied || i.deferred ? i.followUp(msg) : i.reply(msg)).catch(() => {});
  }
});

client.once(Events.ClientReady, (c) => {
  console.log(`🏴‍☠️ Bot connecté en tant que ${c.user.tag}. Tapez /soiree dans Discord. (Ctrl+C pour arrêter)`);
});

if (!process.env.DISCORD_TOKEN) {
  console.error("Il manque DISCORD_TOKEN dans le fichier .env (voir README).");
  process.exit(1);
}
client.login(process.env.DISCORD_TOKEN);
