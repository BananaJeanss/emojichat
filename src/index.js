import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

const __dirname = new URL('.', import.meta.url).pathname;

app.use(express.static('src/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
    console.log(`emojichat server is running on http://localhost:${PORT}`);
});