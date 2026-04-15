const {SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, ThreadAutoArchiveDuration, ChannelType, ComponentType} = require("discord.js");  
const QuickChart = require('quickchart-js');
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
        if(interaction.options.getNumber("options") > 5 || interaction.options.getNumber("options") < 1){
            await interaction.reply({
                content: "You've set an invalid number of options",
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
            OptionBars.push({label : `Option ${i+1}`, data : [0]});
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
                datasets: OptionBars,
                },
            })
            .setWidth(800)
            .setHeight(400)
            .setBackgroundColor('transparent');
        const pollImage = String(myChart.getUrl());
        //Embed
        const pollEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(interaction.options.getString("title"))
            .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.avatarURL().toString()})
            .setImage(pollImage);

        for (let i = 0; i<interaction.options.getNumber("options"); i++ ){
            pollEmbed.addFields({name: `Option ${i+1}`, value: interaction.options.getString(`option_${i+1}`)}) ;
        }

        const pollMessage = await interaction.reply({embeds: [pollEmbed], components: [buttons], withResponse : true});
        
        

        //Thread creation
        await interaction.guild.members.fetch();
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