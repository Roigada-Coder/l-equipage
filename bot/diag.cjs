// Diagnostic du fichier .env quand Discord refuse le token.
// N'affiche jamais le token : seulement sa forme et l'application à laquelle il appartient.
const fs = require("fs");
const path = require("path");

function diagnoseToken() {
  const out = [];
  const envPath = path.join(__dirname, ".env");
  const raw = fs.existsSync(envPath) ? fs.readFileSync(envPath).toString("utf8").replace(/\u0000/g, "") : "";
  const lines = raw.split(/\r?\n/).filter((l) => /^\s*(\uFEFF)?DISCORD_TOKEN\s*=/.test(l));
  if (lines.length > 1) {
    out.push(`• Il y a ${lines.length} lignes DISCORD_TOKEN dans .env : seule la première est utilisée. Garde une seule ligne, avec le nouveau token.`);
  }
  const t = process.env.DISCORD_TOKEN || "";
  const parts = t.split(".");
  let id = "";
  try { id = Buffer.from(parts[0] || "", "base64").toString("utf8"); } catch (e) {}
  if (!t) {
    out.push("• DISCORD_TOKEN est vide.");
  } else if (parts.length !== 3 || !/^\d{17,20}$/.test(id)) {
    out.push(`• La valeur de DISCORD_TOKEN (${t.length} caractères) n'a pas la forme d'un token de bot : un vrai token contient deux points et fait environ 70 caractères.`);
    out.push("  Tu as sans doute collé le Client Secret (onglet OAuth2) ou l'Application ID. Le token se trouve dans l'onglet Bot > Reset Token.");
  } else if (process.env.CLIENT_ID && id !== process.env.CLIENT_ID) {
    out.push(`• Ce token appartient à l'application ${id}, mais CLIENT_ID vaut ${process.env.CLIENT_ID}.`);
    out.push("  Le token et l'Application ID ne viennent pas de la même application dans le Developer Portal.");
  } else {
    out.push("• Le token a la bonne forme et correspond à ton application, mais Discord le refuse : il a été réinitialisé depuis.");
    out.push("  Refais Reset Token dans l'onglet Bot, colle-le dans .env, enregistre, puis relance tout de suite (sans refaire Reset Token entre-temps).");
  }
  if (process.env.CLIENT_ID && !/^\d{17,20}$/.test(process.env.CLIENT_ID)) {
    out.push("• CLIENT_ID ne ressemble pas à un Application ID (ce doit être un nombre de 17 à 20 chiffres).");
  }
  if (process.env.GUILD_ID && !/^\d{17,20}$/.test(process.env.GUILD_ID)) {
    out.push("• GUILD_ID ne ressemble pas à un identifiant de serveur (ce doit être un nombre de 17 à 20 chiffres).");
  }
  out.push(`  Fichier lu : ${envPath}`);
  return out.join("\n");
}

module.exports = { diagnoseToken };
