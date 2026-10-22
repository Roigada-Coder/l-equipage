# Bot Discord de L'Équipage

Tapez `/soiree` dans `#soirée-film` ou `#soirée-jeux` : chacun répond au questionnaire en privé, le bot affiche qui a répondu, puis poste le verdict avec le top 3 et le « pourquoi c'est pour vous ».

Le bot utilise exactement le même moteur que le site (`../index.html`) : mêmes films, mêmes jeux, mêmes calculs. Modifier le site met donc aussi le bot à jour.

Il tourne sur ton PC : il n'est disponible que lorsque le programme est lancé.

---

## Installation (une seule fois, environ 15 minutes)

### 1. Installer Node.js
Télécharge la version **LTS** sur https://nodejs.org et installe-la en laissant les options par défaut.

### 2. Récupérer le dossier du bot
Sur la page GitHub du dépôt `l-equipage`, clique sur **Code** puis **Download ZIP**, et décompresse-le où tu veux (par exemple dans `Documents`). Le bot se trouve dans le dossier `bot`.

### 3. Créer le bot sur Discord
1. Va sur https://discord.com/developers/applications et clique sur **New Application**. Nomme-la `L'Équipage` (ou ce que tu veux) et accepte les conditions.
2. Dans **General Information**, copie l'**Application ID** : c'est ton `CLIENT_ID`.
3. Dans l'onglet **Bot** :
   - mets-lui une photo de profil si tu veux (le drapeau pirate, par exemple) ;
   - clique sur **Reset Token**, puis copie le token : c'est ton `DISCORD_TOKEN`. **Ne le partage avec personne**, pas même avec Claude : c'est le mot de passe du bot.
   - Aucune option « Privileged Gateway Intents » n'est nécessaire, laisse-les toutes désactivées.

### 4. Inviter le bot sur L'Équipage
Ouvre ce lien dans ton navigateur, après avoir remplacé `TON_CLIENT_ID` par ton Application ID :

```
https://discord.com/oauth2/authorize?client_id=TON_CLIENT_ID&scope=bot+applications.commands&permissions=84992
```

Choisis le serveur **L'Équipage** puis valide. Les permissions demandées sont le strict minimum : voir les salons, envoyer des messages, intégrer des liens et lire l'historique.

### 5. Récupérer l'identifiant du serveur
Dans Discord, va dans **Paramètres utilisateur**, puis **Avancés**, et active le **Mode développeur**. Fais ensuite un clic droit sur l'icône du serveur L'Équipage et choisis **Copier l'identifiant du serveur** : c'est ton `GUILD_ID`.

### 6. Remplir le fichier `.env`
Dans le dossier `bot`, copie `.env.example` et renomme la copie en `.env`. Ouvre-la avec le Bloc-notes et colle tes trois valeurs :

```
DISCORD_TOKEN=le_token_du_bot
CLIENT_ID=123456789012345678
GUILD_ID=987654321098765432
```

> Windows masque parfois les extensions : vérifie que le fichier s'appelle bien `.env` et pas `.env.txt`.

---

## Lancer le bot

**Sur Windows :** double-clique sur `lancer-bot.bat`. La première fois, il installe tout et ajoute la commande `/soiree` au serveur. Quand tu vois `Bot connecté`, c'est prêt. Laisse la fenêtre ouverte pendant la soirée, et ferme-la pour arrêter le bot.

**Sur Mac ou Linux :** ouvre un terminal dans le dossier `bot`, puis lance :

```
npm install
node deploy-commands.cjs
node bot.cjs
```

Les deux premières commandes ne servent que la première fois.

> Sur Windows, n'ouvre jamais les fichiers `.cjs` par double-clic : seul `lancer-bot.bat` sert à démarrer le bot.

---

## Utilisation

1. Dans `#soirée-film`, tape `/soiree` et choisis **Film**. Dans `#soirée-jeux`, choisis **Jeux Steam**.
2. Chacun clique sur **Répondre** : le questionnaire s'ouvre en privé (message visible par toi seul).
3. Le message de la soirée affiche qui a répondu.
4. Quand tout le monde a fini, quelqu'un clique sur **Voir le verdict**. Le top 3 s'affiche, avec un bouton pour d'autres idées et un pour voir les réponses de chacun.

De 1 à 8 personnes par soirée (seul, le verdict marche aussi : pratique pour tester). Si le bot redémarre, les soirées en cours sont perdues : relancez simplement `/soiree`.

## En cas de problème

- **`/soiree` n'apparaît pas** : supprime le fichier `.commande-installee` dans le dossier `bot` puis relance `lancer-bot.bat`, et vérifie `CLIENT_ID` et `GUILD_ID`.
- **« Il manque DISCORD_TOKEN »** : le fichier `.env` est absent, mal nommé ou vide.
- **`An invalid token was provided`** : régénère le token dans le Developer Portal (Reset Token) et remplace-le dans `.env`.
- **Le bot ne répond pas dans un salon** : vérifie qu'il a le droit de voir et d'écrire dans ce salon (permissions de la catégorie Skret).
