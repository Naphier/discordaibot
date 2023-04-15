const fs = require('node:fs');
const path = require('node:path');
const { Collection } = require('discord.js');
const { REST, Routes } = require('discord.js');
const { DISCORD_APP_ID, GUILD_ID, DISCORD_BOT_TOKEN } = require('./config.json');


const RegisterGuildCommands = (client) => {
    client.commands = new Collection();
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);
    
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
    
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
            else {
                console.log(`[WARNING] The command at ${filePath}`
                    + ' is missing a required "data" or "execute" property.');
            }
        }   
    }
};

const DeployCommands = () => {
    const PROD = (process.env.NODE_ENV?.trim() === 'production');
    const commands = [];
    // Grab all the command files from the commands directory you created earlier
    const foldersPath = path.join(__dirname, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);

    if (!PROD) {
        console.log('Deploying development commands.');
    }
    else {
        console.log('Deploying production commands.');
    }

    // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
    for (const folder of commandFolders) {
        if (PROD && folder === 'development') {
            continue;
        }
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            commands.push(command.data.toJSON());
            const relPath = path.relative(__dirname, filePath);
            console.log(`Deploying command '${command.data.name}' from '${relPath}'.`);
        }
    }

    // Construct and prepare an instance of the REST module
    const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);

    (async () => {
        try {
            console.log(`Started refreshing ${commands.length} application (/) commands.`);

            let data;
            if (!PROD) {
                // In development, we only want to deploy to a single guild
                data = await rest.put(
                    Routes.applicationGuildCommands(DISCORD_APP_ID, GUILD_ID),
                    { body: commands },
                );
            }
            else {
                // In production, we want to deploy to globally
                data = await rest.put(
                    Routes.applicationCommands(DISCORD_APP_ID),
                    { body: commands },
                );
            }
            console.log(`Successfully reloaded ${data.length} application (/) commands.\r\n`);
        }
        catch (error) {
            console.error(error);
        }
    })();
};

module.exports = {
    RegisterGuildCommands, 
    DeployCommands,
};