// Installe la commande /soiree sur le serveur L'Équipage (à lancer une fois).
require("dotenv").config();
// Nettoie les valeurs du .env (espaces, guillemets, préfixe "Bot " collés par erreur).
for (const k of ["DISCORD_TOKEN", "CLIENT_ID", "GUILD_ID"]) {
  if (process.env[k]) process.env[k] = process.env[k].trim().replace(/^["']|["']$/g, "").replace(/^Bot\s+/i, "").trim();
}
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("Il manque DISCORD_TOKEN, CLIENT_ID ou GUILD_ID dans le fichier .env (voir README).");
  process.exit(1);
}

const soiree = new SlashCommandBuilder()
  .setName("soiree")
  .setDescription("Lancer le questionnaire de L'Équipage pour choisir un film ou un jeu")
  .addStringOption((o) =>
    o.setName("type").setDescription("Film ou jeux ?").setRequired(true)
      .addChoices({ name: "Film", value: "film" }, { name: "Jeux Steam", value: "game" })
  );

new REST()
  .setToken(DISCORD_TOKEN)
  .put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: [soiree.toJSON()] })
  .then(() => console.log("✅ Commande /soiree installée sur le serveur."))
  .catch((err) => {
    console.error("❌ Échec de l'installation de la commande :", err.message);
    if (String(err.status) === "401" || /401/.test(err.message))
      console.error("\nDiagnostic :\n" + require("./diag.cjs").diagnoseToken());
    process.exit(1);
  });
