const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, ThreadAutoArchiveDuration, ChannelType, ComponentType} = require("discord.js");  
const QuickChart = require('quickchart-js');
const MySQL = require("mysql");
const fs = require("node:fs");
const usedIDs = require('./ids.json');
module.exports = {
    data: new SlashCommandBuilder()
        .setName("poll")
        .setDescription("Create a poll")
        .addStringOption((option) => option.setName("title").setDescription("Title of poll").setRequired(true))
        .addNumberOption((option) => option.setName("options").setDescription("Number of options for the poll (1 min. - 5 max.)").setRequired(true))
        .addStringOption((option) => option.setName("option_1").setDescription("Name for option 1").setRequired(true))
        .addStringOption((option) => option.setName("option_2").setDescription("Name for option 2 (if set options to less then the number of this option, the command will ignore it"))
        .addStringOption((option) => option.setName("option_3").setDescription("Name for option 3 (if set options to less then the number of this option, the command will ignore it"))
        .addStringOption((option) => option.setName("option_4").setDescription("Name for option 4 (if set options to less then the number of this option, the command will ignore it"))
        .addStringOption((option) => option.setName("option_5").setDescription("Name for option 5 (if set options to less then the number of this option, the command will ignore it")),
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
                        console.log(DBResult.length ? true : false)
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
                    checkcon.query("SELECT * FROM ?? . ??", [interaction.guild.id, "polls"], (selectError, selectResult) => {
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
                content: "You have too many polls already.",
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
            result += "_p";
            return result;
        }
        var con = MySQL.createConnection({
            host: "localhost",
            port:3333,
            user: process.env.DB_UNAME,
            password: process.env.DB_PASS,
            database: String(interaction.guild.id)
        });
        if(interaction.options.getNumber("options") > 5 || interaction.options.getNumber("options") < 1){
            await interaction.reply({
                content: "You've set an invalid number of options",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        if(interaction.channel.threads.cache.find((cThread) => cThread.name == interaction.options.getString("title"))){
            await interaction.reply({
                content: "You've already made a poll like this",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        //Buttons
        const optionNumber = interaction.options.getNumber("options");
        const optionOne = new ButtonBuilder().setCustomId("opt1").setLabel("Option 1").setStyle(ButtonStyle.Primary);
        const optionTwo = new ButtonBuilder().setCustomId("opt2").setLabel("Option 2").setStyle(ButtonStyle.Primary);
        const optionThree = new ButtonBuilder().setCustomId("opt3").setLabel("Option 3").setStyle(ButtonStyle.Primary);
        const optionFour = new ButtonBuilder().setCustomId("opt4").setLabel("Option 4").setStyle(ButtonStyle.Primary);
        const optionFive = new ButtonBuilder().setCustomId("opt5").setLabel("Option 5").setStyle(ButtonStyle.Primary);
        const buttonArray = [optionTwo, optionThree, optionFour, optionFive];
        const buttons = new ActionRowBuilder().addComponents(optionOne);
        for (let i = 1; i<optionNumber;i++){
            buttons.addComponents(buttonArray[i-1]);
        }
        //Chart
        const OptionBars = [];
        const barLabels = [];
        for (let i = 0; i<optionNumber;i++){
            OptionBars.push(0);
            barLabels.push(interaction.options.getString(`option_${i+1}`));
            if (interaction.options.getString(`option_${i+1}`) == null){
                await interaction.reply({
                    content: "Set values for each option you have",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }
        const myChart = new QuickChart();
        myChart
            .setConfig({
                type: 'bar',
                data: {
                labels: barLabels,
                datasets: [{
                    label: "votes",
                    data: OptionBars
                }]
                },
                options:{
                    scales:{
                        x:{
                            grid:{
                                display: true
                            }
                        }
                    }
                }
            })
            .setWidth(800)
            .setHeight(400)
            .setBackgroundColor('transparent');
        const pollImage = String(myChart.getUrl());
        //Embed
        const expirationDate = Math.floor(Date.now() / 1000) + (86400 * 3);
        const pollEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(interaction.options.getString("title"))
            .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.avatarURL().toString()})
            .setDescription(`This poll expires <t:${expirationDate}:R>`)
            .setImage(pollImage);

        for (let i = 0; i<interaction.options.getNumber("options"); i++ ){
            pollEmbed.addFields({name: `Option ${i+1}`, value: interaction.options.getString(`option_${i+1}`)}) ;
        }
        var pollID = idGen();
        var usedIDsVar = usedIDs;
        while (pollID in usedIDs.usedIDs){
            pollID = idGen();
        }
        usedIDsVar.usedIDs.push(pollID);
        console.log(JSON.stringify(usedIDsVar));
        fs.writeFileSync('./commands/polls/ids.json', JSON.stringify(usedIDsVar));
        con.connect((error) =>{
            if (error) throw error;
            con.query(`CREATE TABLE ${pollID} (voterID BIGINT)`, (errors, response) =>{
                if(errors) throw errors;
                con.query("INSERT INTO polls (id, choices ,opt1 ,opt2 ,opt3 ,opt4 ,opt5 ,chose1 ,chose2 ,chose3 ,chose4 ,chose5, expiresIn ) VALUES (? ,? ,? ,? ,? , ?, ?, 0, 0, 0, 0, 0, 3)", [
                    pollID,
                    optionNumber,
                    interaction.options.getString("option_1"),
                    interaction.options.getString("option_2"),
                    interaction.options.getString("option_3"),
                    interaction.options.getString("option_4"),
                    interaction.options.getString("option_5"),
                ], (insertError, insertResult) => {
                    if (insertError) throw insertError;
                    con.end();
                });
            });
        });


        pollEmbed.setFooter({text : pollID});

        const pollMessage = await interaction.reply({embeds: [pollEmbed], components: [buttons], withResponse : true});
        

        //Thread creation
        try{await interaction.guild.members.fetch();}
        catch(err) {console.log(err);}
        const thread = await interaction.channel.threads.create({ name: interaction.options.getString("title"),
             reason: `A new poll has been created by ${interaction.user.displayName}`, 
             autoArchiveDuration: ThreadAutoArchiveDuration.ThreeDays, type: ChannelType.PrivateThread
            }); 
        await thread.members.add(interaction.user);
        const role = interaction.guild.roles.cache.find(role => role.name == "teszt");
        role.members.forEach(async (m) => {
            if (m === interaction.user) return;
            await thread.members.add(m);
        });
        const relayEmbed = new EmbedBuilder()
            .setTitle(`${interaction.channel.lastMessage.embeds[0].title}'s feedback channel`)
            .setDescription(`Here, you'll receive information about the poll, like who voted, on what, etc. This poll was made by ${interaction.user.displayName}`);
        await thread.send({embeds: [relayEmbed]});

        
    }
}