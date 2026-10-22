// Installe la commande /soiree sur le serveur L'Équipage (à lancer une fois).
const ENV = require("./env.cjs");
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (ENV.missing.length) {
  console.error(`❌ Valeur vide dans .env : ${ENV.missing.join(", ")}.\n   Fichier lu : ${ENV.envPath}`);
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
