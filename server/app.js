const port = process.env.PORT || 3000;
const pjson = require('./package.json');
const express = require("express");
const { Configuration, OpenAIApi } = require('openai')

const app = express();
app.use(express.json());

const getOpenAi = (req) => {
    if (!req.body.token)
        return null;
    
    try {
        const openai = new OpenAIApi(new Configuration({
            apiKey: req.body.token
        }));
        return openai;    
    } catch (error) {
        return error;
    }
}

app.get("/", (_, res) => {
    res.send({
        "name": pjson.name,
        "version": pjson.version,
        "date": new Date()
    })
});

app.post('/chat', async (req, res) => {
    const openai = getOpenAi(req);
    
    if (!openai || openai instanceof Error) {
        res.status(400).json({'error':'token is required: ' + openai ? openai.message : ''});
        return;
    }
    if (!req.body.prompt) {
        res.status(400).json({'error':'prompt is required'});
        return;
    }

    try {
        const seed = "smart creative weird funny charming dungeons and dragons dnd"
        let max_length = 4096 - seed.length;
        max_length = max_length - req.body.prompt.length;
        max_length = Math.min(max_length, req.body.max_length); 
        
        const response = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [
                {"role": "system", "content": seed},
                {"role": "user", "content": req.body.prompt},
            ],
            temperature: 1,
            max_tokens: max_length
        });

        if (response.data.error) {
            res.status(400).json({'error':response.data.error});
            console.log(response.data.error);
            return;
        }

        res.json({'result' : response.data.choices[0].message});
    } catch (error) {
        console.error(error);
    }
});

app.post('/image', async (req, res) => {
    const openai = getOpenAi(req);
    
    if (!openai || openai instanceof Error) {
        res.status(400).json({'error':'token is required: ' + openai ? openai.message : ''});
        return;
    }
    if (!req.body.prompt) {
        res.status(400).json({'error':'prompt is required'});
        return;
    }

    if (!req.body.size in ['256x256', '512x512', '1024x1024']) {
        res.status(400).json({'error':'size must be 256x256, 512x512, or 1024x1024'});
        return;
    }

    if (req.body.n > 10) {
        res.status(400).json({'error':'n must be less than 10'});
        return;
    }

    if (req.body.n < 1) {
        res.status(400).json({'error':'n must be greater than 0'});
        return;
    }

    try {
        const response = await openai.createImage({
            prompt: req.body.prompt,
            n: req.body.n || 1,
            size: req.body.size || '256x256',
        })

        if (response.data.error) {
            res.status(400).json({'error':response.data.error});
            console.log(response.data.error);
            return;
        }

        res.json({'result' : response.data});
    }
    catch (error) {
        console.error(error);
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});