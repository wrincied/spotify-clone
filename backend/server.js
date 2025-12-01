import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// simple log store
let logs = [];
const log = (msg) => {
    console.log(msg);
    logs.push(msg);
};

// root route
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'albums.json');
    const albums = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let html = `<h1>Backend is running</h1><h2>Albums</h2>`;

    albums.forEach(a => {
        html += `
        <div style="margin-bottom:20px;">
            <img src="${a.thumbnail}" width="120"/>
            <h3>${a.title}</h3>
            <p>${a.description}</p>
            <hr/>
        </div>`;
    });

    html += `<h2>Logs</h2><pre>${logs.join('\n')}</pre>`;

    res.send(html);
});

// albums API
app.get('/api/albums', (req, res) => {
    const filePath = path.join(__dirname, 'albums.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            log('[SERVER] Failed to load albums.json');
            return res.status(500).json({ error: 'Cannot load albums.json' });
        }

        log('[SERVER] /api/albums requested');
        res.json(JSON.parse(data));
    });
});

app.listen(3000, () => log('[SERVER] running on http://localhost:3000'));
