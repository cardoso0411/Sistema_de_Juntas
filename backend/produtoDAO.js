const db = require('./db');

class ProdutoDAO {

    listarTodos(callback) {
        const sql = "SELECT * FROM produtos WHERE ativo = 1 ORDER BY nome";

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error(err);
                callback(err, null);
            } else {
                callback(null, rows);
            }
        });
    }

    buscarPorTermo(termo, callback) {
        const sql = `
            SELECT * FROM produtos 
            WHERE ativo = 1
            AND (codigo LIKE ? OR nome LIKE ?)
            ORDER BY nome
        `;

        const busca = `%${termo}%`;

        db.all(sql, [busca, busca], (err, rows) => {
            if (err) {
                console.error(err);
                callback(err, null);
            } else {
                callback(null, rows);
            }
        });
    }
}

module.exports = new ProdutoDAO();