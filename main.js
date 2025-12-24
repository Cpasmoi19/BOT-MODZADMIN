require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, EmbedBuilder } = require('discord.js');
const commands = require('./commands');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const warns = new Map();

// IDs de configuration
const GUILD_ID = '1342461852961083472';
const MANAGER_ROLE_ID = '1391565937227862100'; // ID du rôle Gérant staff
const COMMUNITY_MANAGER_ROLE_ID = '1415464593521774737'; // ID du rôle Community Manager

// Rôles autorisés à envoyer des liens
const ALLOWED_LINK_ROLES = [MANAGER_ROLE_ID, COMMUNITY_MANAGER_ROLE_ID];

// Configuration des rôles autorisés à envoyer des liens
const STAFF_ROLES = ['Gérant', 'Staff', 'Modérateur']; // À adapter avec vos noms de rôles

// ID du salon de logs
const LOGS_CHANNEL_ID = '1383971425509048490';

// Fonction pour vérifier si l'utilisateur est Gérant staff
function isManagerStaff(member) {
  return member.roles.cache.has(MANAGER_ROLE_ID);
}

// Fonction pour vérifier si l'utilisateur peut envoyer des liens
function canSendLinks(member) {
  return ALLOWED_LINK_ROLES.some(roleId => member.roles.cache.has(roleId));
}

// Fonction pour envoyer un log
async function sendLog(client, embed) {
  try {
    const logsChannel = await client.channels.fetch(LOGS_CHANNEL_ID);
    if (logsChannel) {
      await logsChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi du log:', error);
  }
}

client.once('ready', async () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  
  // Enregistrer les commandes slash
  try {
    await client.application.commands.set(commands);
    console.log(`✅ ${commands.length} commandes slash enregistrées`);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des commandes:', error);
  }

  // Mettre le statut du bot
  client.user.setActivity('/help', { type: 'LISTENING' });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user, member, guild, options } = interaction;

  try {
    switch (commandName) {
      case 'ban':
        await handleBan(interaction, options, member, guild);
        break;

      case 'kick':
        await handleKick(interaction, options, member, guild);
        break;

      case 'mute':
        await handleMute(interaction, options, member, guild);
        break;

      case 'unmute':
        await handleUnmute(interaction, options, member, guild);
        break;

      case 'warn':
        await handleWarn(interaction, options, member, warns);
        break;

      case 'clear':
        await handleClear(interaction, options, member);
        break;

      case 'slowmode':
        await handleSlowmode(interaction, options, member);
        break;

      default:
        await interaction.reply({ content: '❌ Commande inconnue', ephemeral: true });
    }
  } catch (error) {
    console.error(`Erreur avec la commande ${commandName}:`, error);
    await interaction.reply({ 
      content: '❌ Une erreur est survenue lors de l\'exécution de la commande', 
      ephemeral: true 
    });
  }
});

// Détection et blocage des liens
client.on('messageCreate', async (message) => {
  // Ignorer les messages du bot et les DM
  if (message.author.bot || !message.guild) return;

  // Regex pour détecter les liens (http, https, www, discord.gg, etc.)
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|discord\.gg\/[^\s]+)/gi;
  
  if (urlRegex.test(message.content)) {
    // Vérifier si l'utilisateur est autorisé à envoyer des liens
    const isAuthorized = canSendLinks(message.member);

    // Si ce n'est pas autorisé, supprimer le message
    if (!isAuthorized) {
      try {
        const user = message.author;
        const targetMember = message.member;
        
        // Supprimer le message
        await message.delete();

        // Mute l'utilisateur pendant 10 minutes
        const muteTime = 10 * 60 * 1000; // 10 minutes en millisecondes
        try {
          await targetMember.timeout(muteTime, 'Lien envoyé sans autorisation');
        } catch (muteError) {
          console.log('Impossible de mute l\'utilisateur:', muteError.message);
        }

        // Créer un embed de warning
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('⛔ Lien interdit')
          .setDescription(`${user}, les liens ne sont pas autorisés pour les membres reguliers.\n\n⏱️ Vous avez été rendu muet pour 10 minutes.`)
          .addFields(
            { name: 'Message supprimé', value: message.content.substring(0, 100) }
          )
          .setTimestamp();

        // Envoyer le warning dans le canal
        const warningMsg = await message.channel.send({ embeds: [embed] });
        
        // Supprimer le warning après 10 secondes
        setTimeout(() => warningMsg.delete().catch(() => {}), 10000);

        // Envoyer un DM à l'utilisateur
        try {
          await user.send(`Votre message contenant un lien a été supprimé dans **${message.guild.name}**. Vous avez été mute pendant 10 minutes. Les liens ne sont autorisés que pour le staff.`);
        } catch (e) {
          console.log('Impossible d\'envoyer un DM');
        }

        // Compter les infractions
        const warnsKey = `${message.guildId}-${user.id}`;
        const userWarns = (warns.get(warnsKey) || 0) + 1;
        warns.set(warnsKey, userWarns);

        // Envoyer un log
        const logEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('⛔ Lien bloqué - Utilisateur mute')
          .addFields(
            { name: 'Utilisateur', value: `${user.tag} (${user.id})` },
            { name: 'Canal', value: `#${message.channel.name}` },
            { name: 'Message', value: message.content.substring(0, 100) },
            { name: 'Action', value: 'Mute 10 minutes' },
            { name: 'Infractions', value: `${userWarns}` }
          )
          .setTimestamp();

        await sendLog(client, logEmbed);

        console.log(`⛔ Message avec lien supprimé de ${user.tag} (Avertissement: ${userWarns})`);
      } catch (error) {
        console.error('Erreur lors du traitement du message avec lien:', error);
      }
    }
  }
});


async function handleBan(interaction, options, member, guild) {
  await interaction.deferReply();

  // Vérifier les permissions
  if (!isManagerStaff(member)) {
    return interaction.editReply('❌ Seul le Gérant staff peut utiliser cette commande!');
  }

  const user = options.getUser('utilisateur');
  const reason = options.getString('raison') || 'Aucune raison donnée';

  const targetMember = await guild.members.fetch(user.id).catch(() => null);
  if (targetMember && !targetMember.bannable) {
    return interaction.editReply('❌ Je ne peux pas bannir cet utilisateur');
  }

  try {
    await guild.bans.create(user.id, { reason });
    
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('👤 Utilisateur banni')
      .addFields(
        { name: 'Utilisateur', value: `${user} (${user.id})` },
        { name: 'Modérateur', value: `${interaction.user}` },
        { name: 'Raison', value: reason }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    
    // Envoyer un DM à l'utilisateur
    try {
      await user.send(`Vous avez été banni de **${guild.name}** pour: ${reason}`);
    } catch (e) {
      console.log('Impossible d\'envoyer un DM à l\'utilisateur');
    }

    // Envoyer un log
    const logEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🚫 Utilisateur banni')
      .addFields(
        { name: 'Utilisateur', value: `${user.tag} (${user.id})` },
        { name: 'Modérateur', value: `${interaction.user.tag}` },
        { name: 'Raison', value: reason }
      )
      .setTimestamp();

    await sendLog(client, logEmbed);
  } catch (error) {
    interaction.editReply('❌ Erreur lors du ban de l\'utilisateur');
  }
}

async function handleKick(interaction, options, member, guild) {
  await interaction.deferReply();

  // Vérifier les permissions
  if (!isManagerStaff(member)) {
    return interaction.editReply('❌ Seul le Gérant staff peut utiliser cette commande!');
  }

  const user = options.getUser('utilisateur');
  const reason = options.getString('raison') || 'Aucune raison donnée';

  const targetMember = await guild.members.fetch(user.id).catch(() => null);
  if (!targetMember) {
    return interaction.editReply('❌ Utilisateur non trouvé dans le serveur');
  }

  if (!targetMember.kickable) {
    return interaction.editReply('❌ Je ne peux pas expulser cet utilisateur');
  }

  try {
    await targetMember.kick(reason);
    
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('👤 Utilisateur expulsé')
      .addFields(
        { name: 'Utilisateur', value: `${user} (${user.id})` },
        { name: 'Modérateur', value: `${interaction.user}` },
        { name: 'Raison', value: reason }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    try {
      await user.send(`Vous avez été expulsé de **${guild.name}** pour: ${reason}`);
    } catch (e) {
      console.log('Impossible d\'envoyer un DM à l\'utilisateur');
    }

    // Envoyer un log
    const logEmbed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('⚠️ Utilisateur expulsé')
      .addFields(
        { name: 'Utilisateur', value: `${user.tag} (${user.id})` },
        { name: 'Modérateur', value: `${interaction.user.tag}` },
        { name: 'Raison', value: reason }
      )
      .setTimestamp();

    await sendLog(client, logEmbed);
  } catch (error) {
    interaction.editReply('❌ Erreur lors du kick de l\'utilisateur');
  }
}

async function handleMute(interaction, options, member, guild) {
  await interaction.deferReply();

  // Vérifier les permissions
  if (!isManagerStaff(member)) {
    return interaction.editReply('❌ Seul le Gérant staff peut utiliser cette commande!');
  }

  const user = options.getUser('utilisateur');
  const duration = options.getInteger('duree');
  const reason = options.getString('raison') || 'Aucune raison donnée';

  const targetMember = await guild.members.fetch(user.id).catch(() => null);
  if (!targetMember) {
    return interaction.editReply('❌ Utilisateur non trouvé dans le serveur');
  }

  if (!targetMember.moderatable) {
    return interaction.editReply('❌ Je ne peux pas mute cet utilisateur');
  }

  try {
    const muteTime = duration * 60 * 1000; // Convertir en millisecondes
    await targetMember.timeout(muteTime, reason);
    
    const embed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle('🔇 Utilisateur mute')
      .addFields(
        { name: 'Utilisateur', value: `${user} (${user.id})` },
        { name: 'Modérateur', value: `${interaction.user}` },
        { name: 'Durée', value: `${duration} minutes` },
        { name: 'Raison', value: reason }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    try {
      await user.send(`Vous avez été mute dans **${guild.name}** pour ${duration} minutes. Raison: ${reason}`);
    } catch (e) {
      console.log('Impossible d\'envoyer un DM à l\'utilisateur');
    }

    // Envoyer un log
    const logEmbed = new EmbedBuilder()
      .setColor('#FFFF00')
      .setTitle('🔇 Utilisateur mute')
      .addFields(
        { name: 'Utilisateur', value: `${user.tag} (${user.id})` },
        { name: 'Modérateur', value: `${interaction.user.tag}` },
        { name: 'Durée', value: `${duration} minutes` },
        { name: 'Raison', value: reason }
      )
      .setTimestamp();

    await sendLog(client, logEmbed);
  } catch (error) {
    interaction.editReply('❌ Erreur lors du mute de l\'utilisateur');
  }
}

async function handleUnmute(interaction, options, member, guild) {
  await interaction.deferReply();

  // Vérifier les permissions
  if (!isManagerStaff(member)) {
    return interaction.editReply('❌ Seul le Gérant staff peut utiliser cette commande!');
  }

  const user = options.getUser('utilisateur');

  const targetMember = await guild.members.fetch(user.id).catch(() => null);
  if (!targetMember) {
    return interaction.editReply('❌ Utilisateur non trouvé dans le serveur');
  }

  try {
    await targetMember.timeout(null);
    
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🔊 Utilisateur unmute')
      .addFields(
        { name: 'Utilisateur', value: `${user} (${user.id})` },
        { name: 'Modérateur', value: `${interaction.user}` }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    try {
      await user.send(`Vous avez été unmute dans **${guild.name}**`);
    } catch (e) {
      console.log('Impossible d\'envoyer un DM à l\'utilisateur');
    }

    // Envoyer un log
    const logEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🔊 Utilisateur unmute')
      .addFields(
        { name: 'Utilisateur', value: `${user.tag} (${user.id})` },
        { name: 'Modérateur', value: `${interaction.user.tag}` }
      )
      .setTimestamp();

    await sendLog(client, logEmbed);
  } catch (error) {
    interaction.editReply('❌ Erreur lors de l\'unmute de l\'utilisateur');
  }
}

async function handleWarn(interaction, options, member, warns) {
  // Vérifier les permissions
  if (!isManagerStaff(member)) {
    return interaction.reply('❌ Seul le Gérant staff peut utiliser cette commande!', { ephemeral: true });
  }

  const user = options.getUser('utilisateur');
  const reason = options.getString('raison') || 'Aucune raison donnée';

  const warnsKey = `${interaction.guildId}-${user.id}`;
  const userWarns = (warns.get(warnsKey) || 0) + 1;
  warns.set(warnsKey, userWarns);

  const embed = new EmbedBuilder()
    .setColor('#FF6600')
    .setTitle('⚠️ Utilisateur averti')
    .addFields(
      { name: 'Utilisateur', value: `${user} (${user.id})` },
      { name: 'Modérateur', value: `${interaction.user}` },
      { name: 'Nombre d\'avertissements', value: `${userWarns}` },
      { name: 'Raison', value: reason }
    )
    .setTimestamp();

  if (userWarns >= 3) {
    embed.addFields({ name: 'Action', value: '⚠️ L\'utilisateur a atteint 3 avertissements!' });
  }

  await interaction.reply({ embeds: [embed] });

  try {
    await user.send(`Vous avez reçu un avertissement dans **${interaction.guild.name}** (${userWarns}/3). Raison: ${reason}`);
  } catch (e) {
    console.log('Impossible d\'envoyer un DM à l\'utilisateur');
  }

  // Envoyer un log
  const logEmbed = new EmbedBuilder()
    .setColor('#FF6600')
    .setTitle('⚠️ Utilisateur averti')
    .addFields(
      { name: 'Utilisateur', value: `${user.tag} (${user.id})` },
      { name: 'Modérateur', value: `${interaction.user.tag}` },
      { name: 'Nombre d\'avertissements', value: `${userWarns}/3` },
      { name: 'Raison', value: reason }
    )
    .setTimestamp();

  await sendLog(client, logEmbed);
}

async function handleClear(interaction, options, member) {
  await interaction.deferReply();

  // Vérifier les permissions
  if (!isManagerStaff(member)) {
    return interaction.editReply('❌ Seul le Gérant staff peut utiliser cette commande!');
  }

  const amount = options.getInteger('nombre');

  try {
    const deleted = await interaction.channel.bulkDelete(amount, true);
    
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🗑️ Messages supprimés')
      .addFields(
        { name: 'Nombre', value: `${deleted.size}` },
        { name: 'Modérateur', value: `${interaction.user}` }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Envoyer un log
    const logEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🗑️ Messages supprimés')
      .addFields(
        { name: 'Canal', value: `#${interaction.channel.name}` },
        { name: 'Nombre de messages', value: `${deleted.size}` },
        { name: 'Modérateur', value: `${interaction.user.tag}` }
      )
      .setTimestamp();

    await sendLog(client, logEmbed);
  } catch (error) {
    interaction.editReply('❌ Erreur lors de la suppression des messages');
  }
}

async function handleSlowmode(interaction, options, member) {
  await interaction.deferReply();

  // Vérifier les permissions
  if (!isManagerStaff(member)) {
    return interaction.editReply('❌ Seul le Gérant staff peut utiliser cette commande!');
  }

  const seconds = options.getInteger('secondes');


  try {
    await interaction.channel.setRateLimitPerUser(seconds);
    
    const status = seconds === 0 ? 'désactivé' : `défini à ${seconds}s`;
    
    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('⏱️ Mode lent')
      .addFields(
        { name: 'Statut', value: status },
        { name: 'Modérateur', value: `${interaction.user}` }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // Envoyer un log
    const logEmbed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('⏱️ Mode lent modifié')
      .addFields(
        { name: 'Canal', value: `#${interaction.channel.name}` },
        { name: 'Statut', value: status },
        { name: 'Modérateur', value: `${interaction.user.tag}` }
      )
      .setTimestamp();

    await sendLog(client, logEmbed);
  } catch (error) {
    interaction.editReply('❌ Erreur lors de la modification du mode lent');
  }
}

client.login(process.env.DISCORD_TOKEN);
