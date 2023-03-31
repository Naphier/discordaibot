// Command to get account information from OpenAI

const { SlashCommandBuilder } = require('discord.js');
const KeyHandler = require('../../key-handler.js');
const request = require('request');

// Helper function to validate a date string
// Allows adjusting the day
// Returns null if the date string is invalid
const dateHelper = (dateString, addDay = 0) => {
    try {
        const [year, month, day] = dateString.split('-');
        const jsDate = new Date(
            year, 
            Number(month) - 1, 
            Number(day) + addDay);

        return jsDate.toISOString().split('T')[0];
    }
    catch (error) {
        return null;
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('account')
        .setDescription('OpenAI account usage in $. If wanting a single day enter only end_date.')
        .addStringOption(option =>
            option.setName('end_date')
                .setDescription('End date. Format: YYYY-MM-DD.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('start_date')
                .setDescription('Start date. Format: YYYY-MM-DD')
                .setRequired(false)),
    async execute(interaction) {
        
        const end_date_in = interaction.options.getString('end_date'); 
        let end_date = dateHelper(end_date_in);
        if (!end_date) {
            await interaction.reply({ 
                content: `Invalid end date: \`${end_date_in}\`.`, 
                ephemeral: true });
            return;
        }

        const start_date_in = interaction.options.getString('start_date');
        let start_date = null;
        if (start_date_in) {
            start_date = dateHelper(start_date_in);
            if (!start_date) {
                await interaction.reply({ 
                    content: `Invalid start date: \`${start_date_in}\`.`, 
                    ephemeral: true });
                return;
            }
        }
        else {
            // User just wants stats for today. 
            start_date = dateHelper(end_date_in);
            end_date = dateHelper(end_date_in, 1);
        }

        const authorId = interaction.user.id;
        const dm = await interaction.user.createDM();
        await interaction.reply({ content: `Sliding into your DMs! <#${dm.id}>`, ephemeral: true });

        await KeyHandler(dm, interaction.keyRegistry, authorId);
        
        const endpoint = 'https://api.openai.com/dashboard/billing/usage';
        try {
            request({
                    url: `${endpoint}?start_date=${start_date}&end_date=${end_date}`,
                    headers: { 'Authorization': `Bearer ${interaction.keyRegistry.get(authorId)}` },
                }, 
                (error, _, body) => {   
                    try {
                    if (error) {
                        console.error(error);
                        dm.send(`Error: ${error.message}`);
                        return;
                    }

                    const data = JSON.parse(body);
                    if (data.error) {
                        dm.send(
                            `OpenAI API Error:\r\n \`\`\`json\r\n${data.error.message}\r\n\`\`\``);
                        return;
                    }

                    // console.log(`body:\r\n${body}`);
                    
                    if (!data || !data.daily_costs) {
                        dm.send('OpenAI API Error: No data returned. Error message:').then(() => {
                            console.log(`body:\r\n${body}`);
                            for (const chunk in body.match(/(.|[\r\n]){1,n}/g)) {
                                dm.send(`\`\`\`json\r\n${chunk}\r\n\`\`\``);
                            }
                        });    
                        return;
                    }

                    const sums = {};
                    sums['Start Date'] = start_date;
                    sums['End Date'] = end_date;
                    for (const day of data.daily_costs) {
                        for (const item of day.line_items) {
                            sums[item.name] = (sums[item.name] || 0) + item.cost / 100.0;
                        }
                    }
                    
                    sums['Total'] = data.total_usage / 100.0;

                    for (const key in sums) {
                        if (Number(sums[key]) === sums[key]) {
                            sums[key] = Number(sums[key].toFixed(2));
                        }
                    }

                    dm.send(`Your account usage (dollars):
\`\`\`json
${JSON.stringify(sums, null, 4)}
\`\`\``);
                    }
                    catch (error2) {
                        dm.send(`Error: ${error2.message}`);
                        console.error(error2);
                    }
                },
            );
            
        }
        catch (error) {
            await dm.send(`Error: ${error.message}`);
        }
    },
};
