const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, ThreadAutoArchiveDuration, ChannelType, ComponentType} = require("discord.js");  
const QuickChart = require('quickchart-js');
const MySQL = require("mysql");
const fs = require("node:fs");
const usedIDs = require('./ids.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName("survey")
        .setDescription("Create a survey")
        .addStringOption((option) => option.setName("title").setDescription("Title of survey").setRequired(true))
        .addStringOption((option) => option.setName("desc").setDescription("Add a description to the survey").setRequired(true))
        .addStringOption((option) => option.setName("field_1").setDescription("Name for field 1").setRequired(true))
        .addStringOption((option) => option.setName("field_2").setDescription("Name for field 2 (if set options to less then the number of this option, the command will ignore it"))
        .addStringOption((option) => option.setName("field_3").setDescription("Name for field 3 (if set options to less then the number of this option, the command will ignore it"))
        .addStringOption((option) => option.setName("field_4").setDescription("Name for field 4 (if set options to less then the number of this option, the command will ignore it"))
        .addStringOption((option) => option.setName("field_5").setDescription("Name for field 5 (if set options to less then the number of this option, the command will ignore it")),
    async execute(interaction) {
        function checkDB(){
            return new Promise((resolve, reject) => {
                var checkDBCon = MySQL.createConnection({
                    host: "localhost",
                    port:3333,
                    user: process.env.DB_UNAME,
                    password: process.env.DB_PASS,
                }); 
                checkDBCon.connect((connectError)=>{
                    checkDBCon.query("SHOW databases LIKE ?", [interaction.guild.id], async (DBError, DBResult) =>{
                        if (DBError) throw DBError;
                        resolve(DBResult.length ? true : false);
                        checkDBCon.end();
                    });
                });
            });
        }
        if(await checkDB() == false){
            await interaction.reply({
                content: "You have to register the server first.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        function checkRole(){
            return new Promise((resolve, reject) => {
                var roleCheckCon = MySQL.createConnection({
                    host: "localhost",
                    port:3333,
                    user: process.env.DB_UNAME,
                    password: process.env.DB_PASS,
                    database: String(interaction.guild.id)
                });
                var isApproved;
                roleCheckCon.connect((connectError)=>{
                    roleCheckCon.query("SELECT approved_role FROM ?? . ??", [interaction.guild.id, "guild_settings"], async (roleError, roleResult) =>{
                        if (roleError) throw roleError;
                        isApproved = interaction.member.roles.cache.has(String(roleResult[0].approved_role));
                        resolve(isApproved);
                        roleCheckCon.end();
                    });
                });
            })
            
            
        }
        if(await checkRole() == false){
            await interaction.reply({
                content: "You don't have permission to do that.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        function checkMax(){
            return new Promise((resolve, reject) => {
                var checkcon = MySQL.createConnection({
                    host: "localhost",
                    port:3333,
                    user: process.env.DB_UNAME,
                    password: process.env.DB_PASS,
                    database: String(interaction.guild.id)
                });
                checkcon.connect((checkError) =>{
                if (checkError) throw checkError;
                    checkcon.query("SELECT * FROM ?? . ??", [interaction.guild.id, "surveys"], (selectError, selectResult) => {
                        if (selectError) throw selectError;
                        if(selectResult.length > 2){
                            resolve(true);
                        }
                        else{
                            resolve(false);
                        }
                        checkcon.end();
                    });
                });
            });
            
        }
        if (await checkMax() == true){
            await interaction.reply({
                content: "You have too many surveys already.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        if(interaction.channel.threads.cache.find((cThread) => cThread.name == interaction.options.getString("title"))){
            await interaction.reply({
                content: "You've already made a survey like this",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        function idGen(){
            var result = "";
            const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
            for(let i = 0; i<6;i++){
                result += chars.charAt(Math.random() * chars.length);
            }
            result += "_s";
            return result;
        }
        const surveyID = idGen();
        var usedIDsVar = usedIDs;
        while (surveyID in usedIDs.usedIDs){
            surveyID = idGen();
        }
        usedIDsVar.usedIDs.push(surveyID);
        fs.writeFileSync('./commands/surveys/ids.json', JSON.stringify(usedIDsVar));
       const expirationDate = Math.floor(Date.now() / 1000) + (86400 * 3);
        var surveyEmbed = new EmbedBuilder()
            .setTitle(interaction.options.getString("title"))
            .setDescription(interaction.options.getString("desc") + ` \nThis survey expires <t:${expirationDate}:R>`)
            .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.avatarURL().toString()})
            .setFooter({text: surveyID})
            .setColor(0x00bbff);
        for(let i = 0; i<5; i++){
            if (interaction.options.getString(`field_${i+1}`)){
                surveyEmbed.addFields({name: `Field ${i+1}`, value: interaction.options.getString(`field_${i+1}`)});
            }
        }
        const submitButton = new ButtonBuilder().setCustomId("submit").setLabel("Submit feedback").setStyle(ButtonStyle.Primary);
        const button = new ActionRowBuilder().addComponents(submitButton)
        const surveyMessage = await interaction.reply({embeds: [surveyEmbed], components: [button], withResponse : true});
        try{await interaction.guild.members.fetch();}
        catch(err) {console.log(err);}
        const thread = await interaction.channel.threads.create({ name: interaction.options.getString("title"),
             reason: `A new survey has been created by ${interaction.user.displayName}`, 
             autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays, type: ChannelType.PrivateThread
            });
        var tableCon = MySQL.createConnection({
            host: "localhost",
            port:3333,
            user: process.env.DB_UNAME,
            password: process.env.DB_PASS,
            database: String(interaction.guild.id)
        });
        tableCon.connect((err) => {
            if(err) throw err;
            tableCon.query("CREATE TABLE ?? (backerID BIGINT)", [surveyID], (createError, createResult) =>{
                tableCon.query("INSERT INTO surveys (id ,opt1 ,opt2 ,opt3 ,opt4 ,opt5, expiresIn) VALUES ( ?, ?, ?, ?, ?, ?, 3)", [
                    surveyID,
                    interaction.options.getString(`field_${1}`),
                    interaction.options.getString(`field_${2}`),
                    interaction.options.getString(`field_${3}`),
                    interaction.options.getString(`field_${4}`),
                    interaction.options.getString(`field_${5}`),
                ]);
            });
        });
        await thread.members.add(interaction.user);
        var addCheckCon = MySQL.createConnection({
            host: "localhost",
            port:3333,
            user: process.env.DB_UNAME,
            password: process.env.DB_PASS,
            database: String(interaction.guild.id)
        });
        addCheckCon.connect((connectError)=>{
            addCheckCon .query("SELECT approved_role FROM ?? . ??", [interaction.guild.id, "guild_settings"], async (roleError, roleResult) =>{
                if (roleError) throw roleError;
                const role = interaction.guild.roles.cache.find(role => role.id == String(roleResult[0].approved_role));
                role.members.forEach(async (m) => {
                    if (m === interaction.user) return;
                    await thread.members.add(m);
                });
                addCheckCon.end();
            });
        });
        const relayEmbed = new EmbedBuilder()
            .setTitle(`${interaction.channel.lastMessage.embeds[0].title}'s feedback channel`)
            .setDescription(`Here, you'll receive information about the survey, like who voted, on what, etc. This survey was made by ${interaction.user.displayName}`);
        await thread.send({embeds: [relayEmbed]});
    }
}