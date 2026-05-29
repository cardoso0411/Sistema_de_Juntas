const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

function getWritableDbPath() {
    const dbDir = path.join(app.getPath('userData'), 'database');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    return path.join(dbDir, 'sistema.db');
}

const writableDbPath = getWritableDbPath();

const db = new sqlite3.Database(writableDbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco:', err.message);
    } else {
        console.log('Conectado ao SQLite com sucesso.');
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo TEXT NOT NULL UNIQUE,
            nome TEXT NOT NULL,
            medidas TEXT NOT NULL,
            imagem TEXT NOT NULL,
            ativo INTEGER DEFAULT 1,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

module.exports = db;
