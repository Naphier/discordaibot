const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dm-conversation')
		.setDescription('Starts a conversation in a DM.'),
	async execute(interaction) {
		await interaction.reply({ content: 'Sliding into your DMs!', ephemeral: true });
        const dm = await interaction.user.createDM();
        dm.send('Hello! This is a DM conversation. Type "quit" to end it.');
        const filter = m => m.author.id === interaction.user.id;
        const collector = dm.createMessageCollector({ filter, time: 60000 });
        const authorId = interaction.user.id;
        collector.on('collect', message => {
            if (message.author.id !== authorId) return;
            if (message.content === 'quit') {
                collector.stop();
                dm.send('Goodbye!');
            }
            else {
                dm.send(`You said: ${message.content}`);
            }
        });
	},
};