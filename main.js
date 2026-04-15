require("dotenv").config();
const {Client, Collection, GatewayIntentBits, MessageFlags, Events, ChannelType, ThreadAutoArchiveDuration} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");
const token = process.env.TOKEN;

const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages]});

client.once("clientReady", (ready) =>{
    console.log(`logged in as ${ready.user.tag}`);
})
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
        //Feedback handling
        try{
            const replyThread = interaction.channel.threads.cache.find((cThread) => cThread.name == interaction.message.embeds[0].title);
            if (interaction.component.customId ==="opt1"){replyThread.send({content : `${interaction.user.displayName} picked Option number 1`}); interaction.reply({content: "You picked number 1", flags: MessageFlags.Ephemeral})}
            if (interaction.component.customId ==="opt2"){replyThread.send({content : `${interaction.user.displayName} picked Option number 2`}); interaction.reply({content: "You picked number 2", flags: MessageFlags.Ephemeral})}
            if (interaction.component.customId ==="opt3"){replyThread.send({content : `${interaction.user.displayName} picked Option number 3`}); interaction.reply({content: "You picked number 3", flags: MessageFlags.Ephemeral})}
            if (interaction.component.customId ==="opt4"){replyThread.send({content : `${interaction.user.displayName} picked Option number 4`}); interaction.reply({content: "You picked number 4", flags: MessageFlags.Ephemeral})}
            if (interaction.component.customId ==="opt5"){replyThread.send({content : `${interaction.user.displayName} picked Option number 5`}); interaction.reply({content: "You picked number 5", flags: MessageFlags.Ephemeral})}
        } catch{
            await interaction.reply({content: "Confirmation not received in a minute, try again", components : [], flags: MessageFlags.Ephemeral});
        }
    }
});

client.login(token);