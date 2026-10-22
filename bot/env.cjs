// Lit le fichier .env de façon robuste (Bloc-notes : UTF-8 avec BOM, UTF-16, espaces, guillemets).
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, ".env");
const alt = path.join(__dirname, ".env.txt");
const file = fs.existsSync(envPath) ? envPath : fs.existsSync(alt) ? alt : null;

if (file) {
  const buf = fs.readFileSync(file);
  let text;
  if (buf[0] === 0xff && buf[1] === 0xfe) text = buf.slice(2).toString("utf16le");
  else if (buf[0] === 0xfe && buf[1] === 0xff) text = buf.slice(2).swap16().toString("utf16le");
  else text = buf.toString("utf8");
  text = text.replace(/^﻿/, "").replace(/\u0000/g, "");
  const parsed = dotenv.parse(text);
  for (const [k, v] of Object.entries(parsed)) process.env[k] = v;
}

for (const k of ["DISCORD_TOKEN", "CLIENT_ID", "GUILD_ID"]) {
  if (process.env[k]) process.env[k] = process.env[k].trim().replace(/^["']|["']$/g, "").replace(/^Bot\s+/i, "").trim();
}

const missing = ["DISCORD_TOKEN", "CLIENT_ID", "GUILD_ID"].filter((k) => !process.env[k]);
module.exports = { envPath: file || envPath, missing };
