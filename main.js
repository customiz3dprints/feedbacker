require("dotenv").config();
const {Client, Collection, GatewayIntentBits, MessageFlags, Events, ChannelType, ThreadAutoArchiveDuration, EmbedBuilder, SlashCommandAssertions} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const token = process.env.TOKEN;
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]});
const MySQL = require("mysql");
const QuickChart = require('quickchart-js');
            var pool = MySQL.createPool({
                host: "localhost",
                port:3333,
                user: process.env.DB_UNAME,
                password: process.env.DB_PASS
            });

client.once("clientReady", (ready) =>{
    console.log(`logged in as ${ready.user.tag}`);
});
client.commands = new Collection();

const folderPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(folderPath);

for (const folder of commandFolders){
    const commandsPath = path.join(folderPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
    for (const file of commandFiles){
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command){
            client.commands.set(command.data.name, command);
        }
        else {
            console.warn(`${filePath}: doesn't have proper data or execute fields.`);
        }
    }
};

client.on(Events.InteractionCreate, async (interaction) => {
    
    if (interaction.isChatInputCommand()) {
        try {
            const command = interaction.client.commands.get(interaction.commandName);
            if(!command){
                console.error(`There was no command like ${interaction.commandName}`);
            }
            await command.execute(interaction);
        } catch(error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command!',
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    flags: MessageFlags.Ephemeral,
                });
            }
        
        }
    }
    else if(interaction.isButton()){
        function updateEmbed(optNum){
            pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                    if(selectError) throw selectError;
                    var optionLabels = [];
                    var optionData = [];
                    const choseArray = [selectResult[0].chose1, selectResult[0].chose2, selectResult[0].chose3, selectResult[0].chose4, selectResult[0].chose5];
                    const optionArray = [selectResult[0].opt1, selectResult[0].opt2, selectResult[0].opt3, selectResult[0].opt4, selectResult[0].opt5]
                    for(var i = 0; i<selectResult[0].choices;i++){
                        if (optionArray[i] == null) break;
                        optionData.push(choseArray[i]);
                        optionLabels.push(optionArray[i]);
                    };
                    const newChart = new QuickChart();
                    newChart
                        .setConfig({
                            type: 'bar',
                            data: {
                                labels: optionLabels,
                                datasets: [{
                                    label : "votes",
                                    data : optionData
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
                    console.log(optionData);
                    const pollDisplay = newChart.getUrl();
                    const embedData = interaction.message.embeds[0];
                    const newEmbed = EmbedBuilder.from(embedData).setImage(pollDisplay);
                    interaction.message.edit({embeds: [newEmbed]});
                    const replyThread = interaction.channel.threads.cache.find((cThread) => cThread.name == interaction.message.embeds[0].title);
                    replyThread.send({content: `${interaction.member.displayName} (${interaction.member.user.username}) voted on Option number ${optNum}. Current state: ${optionData}`})
                });
        }
        //Feedback handling
        try{
                    pool.query("SHOW TABLES FROM ?? LIKE ?", [interaction.guild.id, interaction.message.embeds[0].footer.text.toLowerCase()], (showError, showResult) =>{
                        console.log(showResult);
                        if (!showResult.length){
                                interaction.reply({content: "There was an error when picking an option. Please check the expiration date on the poll, it might have expired. Please contact a staff to resolve it if not.   ", flags: MessageFlags.Ephemeral});
                                return;
                            };
                    pool.query(`SELECT * FROM ??.?? WHERE voterID = "${interaction.user.id}";`,[interaction.guild.id, interaction.message.embeds[0].footer.text.toLowerCase()], (newError, result, fields) => {
                        if (newError) throw newError;
                        if (result.length == 0){
                            if (interaction.component.customId ==="opt1"){
                                interaction.reply({content: "You picked number 1", flags: MessageFlags.Ephemeral});
                                pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                                    pool.query("UPDATE ?? . ?? SET chose1 = ? WHERE id = ?", [interaction.guild.id, "polls", selectResult[0].chose1+1, interaction.message.embeds[0].footer.text.toLowerCase()], (updateError, updateResult) => {
                                        if (updateError) throw updateError;
                                        updateEmbed(1)
                                    })
                                })
                            }
                            if (interaction.component.customId ==="opt2"){
                                interaction.reply({content: "You picked number 2", flags: MessageFlags.Ephemeral});
                                pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                                    pool.query("UPDATE ?? . ?? SET chose2 = ? WHERE id = ?", [interaction.guild.id, "polls", selectResult[0].chose2+1, interaction.message.embeds[0].footer.text.toLowerCase()], (updateError, updateResult) => {
                                        if (updateError) throw updateError;
                                        updateEmbed(2);
                                    })
                                })
                            }
                            if (interaction.component.customId ==="opt3"){                
                                interaction.reply({content: "You picked number 3", flags: MessageFlags.Ephemeral});
                                pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                                    pool.query("UPDATE ?? . ?? SET chose3 = ? WHERE id = ?", [interaction.guild.id, "polls", selectResult[0].chose3+1, interaction.message.embeds[0].footer.text.toLowerCase()], (updateError, updateResult) => {
                                        if (updateError) throw updateError;
                                        updateEmbed(3);
                                    })
                                })
                            }
                            if (interaction.component.customId ==="opt4"){
                                interaction.reply({content: "You picked number 4", flags: MessageFlags.Ephemeral});
                                pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                                    pool.query("UPDATE ?? . ?? SET chose4 = ? WHERE id = ?", [interaction.guild.id, "polls", selectResult[0].chose4+1, interaction.message.embeds[0].footer.text.toLowerCase()], (updateError, updateResult) => {
                                        if (updateError) throw updateError;
                                        updateEmbed(4);
                                    })
                                })
                            }
                            if (interaction.component.customId ==="opt5"){
                                interaction.reply({content: "You picked number 5", flags: MessageFlags.Ephemeral});
                                pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                                    pool.query("UPDATE ?? . ?? SET chose5 = ? WHERE id = ?", [interaction.guild.id, "polls", selectResult[0].chose5+1, interaction.message.embeds[0].footer.text.toLowerCase()], (updateError, updateResult) => {
                                        if (updateError) throw updateError;
                                        updateEmbed(5);
                                    })
                                })
                            }
                            pool.query(`INSERT INTO ??.?? (voterID) VALUES ("${interaction.user.id}");`,[interaction.guild.id, interaction.message.embeds[0].footer.text.toLowerCase()], (insertError, InsertResult) =>{
                                if (insertError) throw insertError;
                            });
                            
                        } else{
                            interaction.reply({content: "You've already voted'", flags: MessageFlags.Ephemeral});
                            return;
                        }
                    });
                    });
                
        } catch(err){
            await interaction.reply({content: "something went wrong", components : [], flags: MessageFlags.Ephemeral});
            console.log(err);
        }
    }
});

client.login(token);

setInterval(() => {
    pool.query("SHOW DATABASES", (showError, showResult) => {
        if (showError) throw showError;
        showResult.forEach(db => {
            if (db.Database == 'information_schema' || db.Database == 'sakila' || db.Database == 'world' || db.Database == 'sys' || db.Database == 'mysql' || db.Database == 'performance_schema') return;
            pool.query("USE ??", [db.Database], (useError, useResult) =>{
                if(useError) throw useError;
                pool.query("SELECT id, expiresIn FROM ?? . ??", [db.Database, "polls"], (selectError, selectResult) => {
                    if (selectError) throw selectError;
                    selectResult.forEach(poll => {
                        if (poll.expiresIn-1 < 1){
                            pool.query("DROP TABLE ??", [poll.id]);
                            pool.query("DELETE FROM ?? . ?? WHERE id = ?", [db.Database, "polls", poll.id]);
                            
                        }
                        else{
                            pool.query("UPDATE ?? . ?? SET expiresIn = ? WHERE id = ?", [db.Database, "polls", poll.expiresIn-1, poll.id]);
                        }
                    });
                });
            });
        });
    });
}, 1040);