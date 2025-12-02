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
    const time = new Date().toISOString();
    const entry = `[${time}] ${msg}`;
    console.log(entry);
    logs.push(entry);
};

// root route (html view)
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'albums.json');

    try {
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

    } catch (e) {
        log(`[SERVER] Root page error: ${e.message}`);
        res.status(500).send(`<h1>Error</h1><pre>${e.message}</pre>`);
    }
});

// /api/check — сервер жив
app.get('/api/check', (req, res) => {
    log('[SERVER] /api/check');
    res.json({ ok: true, timestamp: Date.now() });
});

// /api/logs — лог сервера
app.get('/api/logs', (req, res) => {
    log('[SERVER] /api/logs');
    res.json({ logs });
});

// /api/albums — основной API
app.get('/api/albums', (req, res) => {
    const filePath = path.join(__dirname, 'albums.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            log('[SERVER] Failed to read albums.json');
            return res.status(500).json({
                error: true,
                message: 'Cannot read albums.json'
            });
        }

        let albums;
        try {
            albums = JSON.parse(data);

            if (!Array.isArray(albums)) {
                throw new Error('albums.json must contain an array');
            }

            // validate albums
            albums = albums.map((album, index) => {
                if (typeof album !== 'object' || album == null) {
                    log(`[SERVER] corrupted album at index ${index}`);
                    return {
                        title: 'Invalid album',
                        description: 'Corrupted',
                        thumbnail: null
                    };
                }

                return {
                    title: album.title || 'Untitled',
                    description: album.description || '',
                    thumbnail: album.thumbnail || null
                };
            });

        } catch (err) {
            log(`[SERVER] JSON parse error: ${err.message}`);
            return res.status(500).json({
                error: true,
                message: 'albums.json is corrupted'
            });
        }

        log('[SERVER] /api/albums OK');

        // Важно: НОВЫЙ ФОРМАТ
        res.json({
            error: false,
            data: albums
        });
    });
});

// global error handler
app.use((err, req, res, next) => {
    log(`[SERVER ERROR] ${err.message}`);
    res.status(500).json({
        error: true,
        message: err.message
    });
});

app.listen(3000, () => log('[SERVER] running on http://localhost:3000'));
