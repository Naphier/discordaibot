const { Configuration, OpenAIApi } = require('openai')
const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

async function main() {
    const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: 'What is the meaning of life?',
        temperature: 0.5,
        max_tokens: 10
    });
    console.log(response.data);
}

main()