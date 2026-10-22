// Installe la commande /soiree sur le serveur L'Équipage (à lancer une fois).
require("dotenv").config();
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
    process.exit(1);
  });
