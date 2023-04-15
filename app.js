const { DISCORD_BOT_TOKEN } = require('./config.json');
const { Client, Collection, Events, GatewayIntentBits, Partials } = require('discord.js');
const { RegisterGuildCommands, DeployCommands } = require('./command-factory.js');
const KeyRegistry = require('./key-registry.js');
// const KeyHandler = require('./key-handler');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials:[
        Partials.Channel,
        Partials.GuildMember,
    ],
});

client.once(Events.ClientReady, c => {
	console.log(`Logged in as ${c.user.tag}!`);
});

DeployCommands();
RegisterGuildCommands(client);

const keyRegistry = new KeyRegistry();

client.cooldowns = new Collection();

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);

	if (!command) {
        await interaction.reply({ 
            content: `Command name: \`${interaction.commandName}\` not found.`, 
            ephemeral: true,
        });
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

    const { cooldowns } = client;
	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name);
	const defaultCooldownDuration = 3;
	const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

		if (now < expirationTime) {
			const expiredTimestamp = Math.round(expirationTime / 1000);
			return interaction.reply({ 
                content: `Please wait <t:${expiredTimestamp}:R> more ` +
                         `second(s) before reusing the \`${command.data.name}\` command.`, 
                ephemeral: true });
		}
	}

	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try {
        // Pass a reference to the key registry to the command
        interaction.keyRegistry = keyRegistry;
		await command.execute(interaction);
	}
    catch (error) {
		console.error(error);
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true });
            } 
            else {
                await interaction.reply({ 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true });
            }
        }
        catch (fatalError) {
                console.error(fatalError);
        }
	}
});

/*
client.on(Events.MessageCreate, async interaction => {
    if (interaction.author.bot) return;
    
    await KeyHandler(interaction.channel, keyRegistry, interaction.author.id);

    if (interaction.content === 'help') {
        interaction.channel.send('You can use the following commands: `help`, `start`, `stop`.');
    }
});
*/

client.login(DISCORD_BOT_TOKEN);