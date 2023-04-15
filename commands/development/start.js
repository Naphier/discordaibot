const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Starts a conversation with OpenAI-Bot.'),
    async execute(interaction) {
        await interaction.reply({ content: 'Sliding into your DMs!', ephemeral: true });
        const dm = await interaction.user.createDM();
        await dm.send('Unimplemented.');
    },
};