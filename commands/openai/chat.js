const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const KeyHandler = require('../../key-handler.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chat')
        .setDescription('Chat with OpenAI.'),
    async execute(interaction) {
        const dm = await interaction.user.createDM();
        await interaction.reply({ content: `Sliding into your DMs! <#${dm.id}>`, ephemeral: true });
        const authorId = interaction.user.id;
        await KeyHandler(dm, interaction.keyRegistry, authorId);

        try {
            const openai = new OpenAIApi(new Configuration({
                apiKey: interaction.keyRegistry.get(interaction.user.id),
            }));

            await dm.send('Hello! This is a DM conversation. Type `/quit` to end it.');
            
            const filter = m => m.author.id === interaction.user.id;
            const collector = dm.createMessageCollector({ filter, idle: 60000 });
            let bot_role = null;
            await dm.send('What is my purpose?');

            collector.on('end', async () => { 
                try {
                    await dm.send('Goodbye!'); 
                }
                catch (error) {
                    console.log(error);
                }
            });

            // TODO: Do I want to just have this ALL happen in the collector?
            collector.on('collect', async message => {
                if (message.author.id !== authorId) return;
                if (message.content === '/quit') {
                    collector.stop();
                    await dm.send('Thanks for the chat!');
                    return;
                }

                if (message.content === '/role') {
                    await dm.send('What is my purpose?');
                    bot_role = null;
                    return;
                }
                
                if (!bot_role) {
                    bot_role = message.content;
                    await dm.send(`My purpose is: \`${bot_role}\`.`);
                    await dm.send('Type `/role` to change my role.');
                    await dm.send('What can I do for you?');
                    return;
                }

                const completion = await openai.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: bot_role },
                        { role: 'user', content: message.content },
                    ],
                  });
                if (completion.data.choices && completion.data.choices[0].message.content) {
                    await dm.send(completion.data.choices[0].message.content);
                }
                else {
                    await dm.send('There was an error with your request.');
                    console.error(completion);
                }
            });
        } 
        catch (error) {
            console.log(error);
            await dm.send('There was an error with your request.');
        }
    },
};
