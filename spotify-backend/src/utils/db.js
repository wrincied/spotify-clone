import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../db');

export const generateId = () => crypto.randomBytes(8).toString('hex');

export const loadJson = (fileName) => {
    const filePath = path.join(DB_PATH, fileName);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

export const saveJson = (fileName, data) => {
    const filePath = path.join(DB_PATH, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};