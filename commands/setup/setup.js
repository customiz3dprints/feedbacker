const {
  EmbedBuilder,
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");
const MySQL = require("mysql");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the bot")
    .addRoleOption((option) =>
      option
        .setName("approved_role")
        .setDescription("What role should be allowed to make poll/surveys?"),
    )
    .addChannelOption((option) =>
      option
        .setName("approved_channel")
        .setDescription(
          "What channel should polls/sruvey be allowed to be posted in?",
        ),
    ),
  async execute(interaction) {
    var con = MySQL.createConnection({
      host: "localhost",
      port: 3333,
      user: process.env.DB_UNAME,
      password: process.env.DB_PASS,
    });
    con.connect((error) => {
        if (error) throw error;
        var dbID = interaction.guild.id;
        con.query( "CREATE DATABASE IF NOT EXISTS ??", [dbID], async (dbError, dbResult) => {
            if (dbError) throw dbError;
            if (dbResult.warningCount) {
                await interaction.reply({
                content: "You've already set up this server. Contact ddani6 on Discord if it is a mistake.",
                flags: MessageFlags.Ephemeral
            });
            return;
            }
            con.query("USE ??", [dbID], (useError) => {
                if (useError) throw useError;
                con.query("CREATE TABLE ?? (approved_channel VARCHAR(255), approved_role VARCHAR(255))", ["guild_settings"], (tableError, tableResult) => {
                    if (tableError) throw tableError;
                    con.query("INSERT INTO ?? (approved_channel, approved_role) VALUES (?, ?)", 
                                ['guild_settings', interaction.options.getChannel("approved_channel").id, interaction.options.getRole("approved_role").id], async (insertError, insetResult) =>{
                                    await interaction.reply({
                                        content: "You've set up this server for polls/surveys",
                                        flags: MessageFlags.Ephemeral
                                    });
                                    con.end();
                                })
                    
                    },
                );
            })
        },
      );
    });
  },
};
