const { SlashCommandBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const KeyHandler = require('../../key-handler.js');

module.exports = {
    // TODO: Add options for inputting an image URL
	data: new SlashCommandBuilder()
		.setName('dall-e2')
		.setDescription('Use DALL-E 2 to make something cool!')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('Tell me what you want to see!')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('size')
                .setDescription('small=256x256 (default), medium=512x512, large=1024x1024')
                .addChoices(
                    { name : 'small', value : '256x256' },
                    { name : 'medium', value : '512x512' },
                    { name : 'large', value : '1024x1024' }))
        .addIntegerOption(option =>
            option.setName('n')
                .setDescription('Number of images to generate (default=1, max=10)')
                .setMinValue(1)
                .setMaxValue(10)),
	async execute(interaction) {
        await interaction.reply({ content: 'Sliding into your DMs!', ephemeral: true });

        const authorId = interaction.user.id;
        const dm = await interaction.user.createDM();
        await KeyHandler(dm, interaction.keyRegistry, authorId);

        try {
            let s = interaction.options.getInteger('n') > 1;
            dm.send(`Generating image${s ? 's' : ''}...`);
            const prompt = interaction.options.getString('prompt');
            const openai = new OpenAIApi(new Configuration({
                apiKey: interaction.keyRegistry.get(interaction.user.id),
            }));
            const response = await openai.createImage({
                prompt: prompt,
                n: interaction.options.getInteger('n') || 1,
                size: interaction.options.getString('size') || '256x256',
            });
            
            // TODO: Add buttons for upscaling and refining
            // response data {created, data: [{url}, {url}, ...]}
            s = response.data.data.length > 1;
            dm.send({
               content: `Here ${s ? 'are' : 'is'} your image${s ? 's' : ''} for \`${prompt}\`!`, 
               files: response.data.data.map((url, index) => {
                    return {
                        attachment: url.url,
                        name: `image${index}.png`,
                    };
                }),
            });
        }
        catch (error) {
            if (error.response && error.response.status === 401) {
                dm.send('Your OpenAI API key is invalid. Please register a new one.');
                interaction.keyRegistry.remove(interaction.user.id);
                return;
            }
            
            console.error('imagine.js', error);
            dm.send(`Something went wrong: ${error.message}`);
        }
	},
};