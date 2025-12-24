const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const commands = [];

// Commande BAN
commands.push(
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannir un utilisateur du serveur')
    .addUserOption(option => 
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à bannir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison du ban')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .toJSON()
);

// Commande KICK
commands.push(
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulser un utilisateur du serveur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à expulser')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison du kick')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .toJSON()
);

// Commande MUTE
commands.push(
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Rendre muet un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à rendre muet')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('duree')
        .setDescription('Durée en minutes')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison du mute')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON()
);

// Commande UNMUTE
commands.push(
  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Enlever le mute d\'un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à unmute')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON()
);

// Commande WARN
commands.push(
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertir un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à avertir')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('raison')
        .setDescription('Raison de l\'avertissement')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON()
);

// Commande CLEAR
commands.push(
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprimer des messages')
    .addIntegerOption(option =>
      option.setName('nombre')
        .setDescription('Nombre de messages à supprimer')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .toJSON()
);

// Commande SLOWMODE
commands.push(
  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Définir le mode lent du canal')
    .addIntegerOption(option =>
      option.setName('secondes')
        .setDescription('Nombre de secondes (0 pour désactiver)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(21600)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .toJSON()
);

module.exports = commands;
