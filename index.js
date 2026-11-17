const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect('/index.html');
});

app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body.messages;
        
        if (!message || !Array.isArray(messages)) {
            return res.status(400).json({ 
                error: "Messages harus berupa array" 
            });
        }

        const response = await fetch(
        "https://openrouter.ai/v1/chat/completions", 
        {
            method: "POST",

            headers:{
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
            },
            body: JSON.stringify({
                model: "inclusional/ling-3.2-flash:free",
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000,
                stream : true
            })
        }
         
    );

    if (!response.ok) {
        const errorData = await response.text();
       console.error("Open Router Error:", errorData);
       return res.status(response.status).json({error: errorData});
    }

    // Header untuk streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, {
            stream: true
        });
        const lines = buffer.split('\n');
        buffer = lines.pop(); 

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) {
                continue;
            }
            if (trimmedLine.startsWith("data:")) {
                continue;
            }
            try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                    res.write(`data: ${JSON.stringify(content)}\n\n`);
                }
            } catch (error) {
                console.error("Gagal parsing straming data:", error);
            }
        }
    }
    res.write("data: [DONE]\n\n");
    res.end();

    } catch (error) {
        console.error("Server Error:", error);
        if (!res.headersSent) {
            res.status(500).json({error: "Terjadi kesalahan pada server"});
        } else {
            res.write(`data: ${JSON.stringify("Terjadi kesalahan pada server")}\n\n`);
            res.end();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

