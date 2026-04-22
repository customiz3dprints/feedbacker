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
        .setDescription("What role should be allowed to make poll/surveys?")
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("approved_channel")
        .setDescription("What channel should polls/sruvey be allowed to be posted in?",)
        .setRequired(true),
    ),
  async execute(interaction) {
    if (interaction.guild.roles.everyone === interaction.options.getRole("approved_role")){
      await interaction.reply({
                content: "Don't set everyone as approved role.",
                flags: MessageFlags.Ephemeral
            });
      return;
    }
    var con = MySQL.createConnection({
      host: "localhost",
      port: 3333,
      user: process.env.DB_UNAME,
      password: process.env.DB_PASS,
    });
    con.connect((error) => {
        if (error) throw error;
        var dbID = interaction.guild.id;
        con.query( "CREATE DATABASE IF NOT EXISTS ??", [dbID],  (dbError, dbResult) => {
            if (dbError) throw dbError;
            if (dbResult.warningStatus) {
            interaction.reply({
                content: "You've already set up this server. Contact ddani6 on Discord if it is a mistake.",
                flags: MessageFlags.Ephemeral
            });
            return;
            }
            con.query("USE ??", [dbID], (useError) => {
                if (useError) throw useError;
                con.query("CREATE TABLE IF NOT EXISTS ?? (approved_channel VARCHAR(255), approved_role VARCHAR(255))", ["guild_settings"], (tableError, tableResult) => {
                    if (tableError) throw tableError;
                    if (tableResult.warningStatus) {
                    interaction.reply({
                          content: "You've already set up this server. Contact ddani6 on Discord if it is a mistake.",
                          flags: MessageFlags.Ephemeral
                      });
                    };
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
                con.query("CREATE TABLE IF NOT EXISTS ?? (id VARCHAR(8), choices INT, opt1 VARCHAR(255), opt2 VARCHAR(255), opt3 VARCHAR(255), opt4 VARCHAR(255), opt5 VARCHAR(255), chose1 INT, chose2 INT, chose3 INT, chose4 INT, chose5 INT, expiresIn TINYINT)", ["polls"], (pollError, pollResult) =>{if (pollError) throw pollError;});
                con.query("CREATE TABLE IF NOT EXISTS ?? (id VARCHAR(8), opt1 VARCHAR(255), opt2 VARCHAR(255), opt3 VARCHAR(255), opt4 VARCHAR(255), opt5 VARCHAR(255), expiresIn TINYINT)", ["surveys"], (surveyError, surveyResult) =>{if (surveyError) throw surveyError;});
            })
        },
      );
    });
  },
};
