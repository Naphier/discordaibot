const { my_openai_api_key } = require('./config.json');
const PROD = (process.env.NODE_ENV?.trim() === 'production');

module.exports = async (dm, keyRegistry, userId) => {
    if (!keyRegistry.get(userId)) {
        if (!PROD && my_openai_api_key) {
            keyRegistry.add(userId, my_openai_api_key);
            dm.send('Dev key in use');
            return true;
        }

        dm.send('Please enter your OpenAI API key or type \'quit\'.');
        dm.send('Your key is not stored in a database and is only used for this session.');

        const filter = m => m.author.id === userId;    
        const collector = dm.createMessageCollector(filter, { time: 60000 });
        collector.on('collect', message => {
            if (message.author.id !== userId) return;
            if (message.content === 'quit') {
                dm.send('Goodbye!');
                collector.stop();
                return;
            }
            else {
                keyRegistry.add(userId, message.content);
                dm.send('Your OpenAI API key has been registered.');
                collector.stop();
            }
        });

        let timeCount = 0;
        while (collector.ended === false) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            timeCount += 1;
            if (timeCount > 60) {
                dm.send('You did not respond in time. Goodbye!');
                collector.stop();
                return;
            }
        }

        if (!keyRegistry.get(userId)) {
            dm.send('You did not register an OpenAI API key. Goodbye!');
            collector.stop();
            return;
        }
    }

    return true;
};
