require("dotenv").config();
const {Client, Collection, GatewayIntentBits, MessageFlags, Events, ChannelType, ThreadAutoArchiveDuration, EmbedBuilder} = require("discord.js");
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
        function updateEmbed(){
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
                });
        }
        //Feedback handling
        try{
                    pool.query("SHOW TABLES FROM ?? LIKE ?", [interaction.guild.id, interaction.message.embeds[0].footer.text.toLowerCase()], (showError, showResult) =>{
                        console.log(showError);
                        if (!showResult.length){
                                interaction.reply({content: "There was an error when picking an option. Please contact a staff to resolve it.   ", flags: MessageFlags.Ephemeral});
                                return;
                            };
                    pool.query(`SELECT * FROM ??.?? WHERE voterID = "${interaction.user.id}";`,[interaction.guild.id, interaction.message.embeds[0].footer.text.toLowerCase()], (newError, result, fields) => {
                        if (newError) throw newError;
                        if (result.length == 0){
                            const replyThread = interaction.channel.threads.cache.find((cThread) => cThread.name == interaction.message.embeds[0].title);
                            if (interaction.component.customId ==="opt1"){
                                replyThread.send({content : `${interaction.user.displayName} picked Option number 1`});
                                interaction.reply({content: "You picked number 1", flags: MessageFlags.Ephemeral});
                                pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                                    pool.query("UPDATE ?? . ?? SET chose1 = ? WHERE id = ?", [interaction.guild.id, "polls", selectResult[0].chose1+1, interaction.message.embeds[0].footer.text.toLowerCase()], (updateError, updateResult) => {
                                        if (updateError) throw updateError;
                                        updateEmbe
                                    })
                                })
                            }
                            if (interaction.component.customId ==="opt2"){
                                replyThread.send({content : `${interaction.user.displayName} picked Option number 2`});
                                interaction.reply({content: "You picked number 2", flags: MessageFlags.Ephemeral});
                                pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                                    pool.query("UPDATE ?? . ?? SET chose2 = ? WHERE id = ?", [interaction.guild.id, "polls", selectResult[0].chose2+1, interaction.message.embeds[0].footer.text.toLowerCase()], (updateError, updateResult) => {
                                        if (updateError) throw updateError;
                                        updateEmbed();
                                    })
                                })
                            }
                            if (interaction.component.customId ==="opt3"){
                                replyThread.send({content : `${interaction.user.displayName} picked Option number 3`});                
                                interaction.reply({content: "You picked number 3", flags: MessageFlags.Ephemeral});
                                pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                                    pool.query("UPDATE ?? . ?? SET chose3 = ? WHERE id = ?", [interaction.guild.id, "polls", selectResult[0].chose3+1, interaction.message.embeds[0].footer.text.toLowerCase()], (updateError, updateResult) => {
                                        if (updateError) throw updateError;
                                        updateEmbed();
                                    })
                                })
                            }
                            if (interaction.component.customId ==="opt4"){
                                replyThread.send({content : `${interaction.user.displayName} picked Option number 4`});
                                interaction.reply({content: "You picked number 4", flags: MessageFlags.Ephemeral});
                                pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                                    pool.query("UPDATE ?? . ?? SET chose4 = ? WHERE id = ?", [interaction.guild.id, "polls", selectResult[0].chose4+1, interaction.message.embeds[0].footer.text.toLowerCase()], (updateError, updateResult) => {
                                        if (updateError) throw updateError;
                                        updateEmbed();
                                    })
                                })
                            }
                            if (interaction.component.customId ==="opt5"){
                                replyThread.send({content : `${interaction.user.displayName} picked Option number 5`});
                                interaction.reply({content: "You picked number 5", flags: MessageFlags.Ephemeral});
                                pool.query("SELECT * FROM ?? . ?? WHERE id = ?", [interaction.guild.id, "polls", interaction.message.embeds[0].footer.text.toLowerCase()], (selectError, selectResult) =>{
                                    pool.query("UPDATE ?? . ?? SET chose5 = ? WHERE id = ?", [interaction.guild.id, "polls", selectResult[0].chose5+1, interaction.message.embeds[0].footer.text.toLowerCase()], (updateError, updateResult) => {
                                        if (updateError) throw updateError;
                                        updateEmbed();
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