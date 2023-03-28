const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dm-conversation')
		.setDescription('Starts a conversation in a DM.'),
	async execute(interaction) {
        console.log('apikeys', interaction.openAiApiKeys);
        /*
        Error [InteractionAlreadyReplied]: The reply to this interaction has already been sent or deferred.
    at ChatInputCommandInteraction.reply (D:\Repos\openai-bot\discordbot\node_modules\discord.js\src\structures\interfaces\InteractionResponses.js:102:46)
    at Object.execute (D:\Repos\openai-bot\discordbot\commands\development\dm-conversation.js:9:21)
    at Client.<anonymous> (D:\Repos\openai-bot\discordbot\app.js:101:17) {
  code: 'InteractionAlreadyReplied'
}
*/
		await interaction.reply({ content: 'DM incoming!', ephemeral: true });
        const dm = await interaction.user.createDM();
        dm.send('Hello! This is a DM conversation. Type "quit" to end it.');
        const filter = m => m.author.id === interaction.user.id;
        const collector = dm.createMessageCollector(filter, { time: 60000 });
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