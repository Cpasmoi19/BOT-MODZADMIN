# Bot Discord de Modération 🛡️

Un bot Discord complet avec des commandes slash de modération.

## 📋 Commandes disponibles

- `/ban` - Bannir un utilisateur
- `/kick` - Expulser un utilisateur
- `/mute` - Rendre muet un utilisateur (temporaire)
- `/unmute` - Enlever le mute d'un utilisateur
- `/warn` - Avertir un utilisateur (3 avertissements max)
- `/clear` - Supprimer des messages
- `/slowmode` - Définir le mode lent du canal

## 🚀 Installation locale

1. Cloner ou télécharger le projet
2. Installer les dépendances:
```bash
npm install
```

3. Créer un fichier `.env` et ajouter:
```
DISCORD_TOKEN=votre_token_bot
CLIENT_ID=votre_client_id
GUILD_ID=votre_guild_id (optionnel)
```

4. Lancer le bot:
```bash
npm start
```

## 🚂 Déploiement sur Railway

1. **Créer un compte** sur [railway.app](https://railway.app)

2. **Créer un nouveau projet** et connecter votre repository GitHub

3. **Ajouter les variables d'environnement** dans Railway:
   - `DISCORD_TOKEN` - Le token de votre bot Discord
   - `CLIENT_ID` - L'ID client de votre application
   - `GUILD_ID` - (Optionnel) L'ID de votre serveur

4. **Railway détectera automatiquement** le `Procfile` et lancera le bot

5. **Déployer** - Railway construira et lancera le bot automatiquement

## 🔧 Configuration du Bot Discord

1. Aller sur [Discord Developer Portal](https://discord.com/developers/applications)
2. Créer une nouvelle application
3. Dans l'onglet "Bot", créer un bot et copier le token
4. Dans OAuth2 > URL Generator, sélectionner:
   - Scopes: `bot` et `applications.commands`
   - Permissions: `Administrator` (pour plus de simplicité)
5. Utiliser l'URL générée pour inviter le bot sur votre serveur

## 📝 Permissions requises

Le bot nécessite les permissions suivantes:
- Ban Members
- Kick Members
- Moderate Members
- Manage Messages
- Manage Channels

## ⚙️ Personnalisation

Modifiez les couleurs des embeds dans `main.js` en changeant les valeurs `setColor()`.

## 📞 Support

Si vous avez des questions ou des problèmes, consultez la documentation de [Discord.js](https://discord.js.org/)
