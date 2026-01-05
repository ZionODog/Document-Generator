import sqlite3
from datetime import datetime

# Caminho do banco de dados
db_path = 'banco.db'

def criar_banco_de_dados():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Criar a tabela 'pastas'
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pastas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            sigla TEXT NOT NULL UNIQUE
        )
    ''')
    
    # Criar a tabela 'documentos' com a nova coluna 'email'
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS documentos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pasta_id INTEGER,
            titulo TEXT,
            objetivo TEXT,
            responsaveis TEXT,
            conceitos_siglas TEXT,
            diretrizes TEXT,
            documentos_complementares TEXT,
            referencias TEXT,
            revisoes_json TEXT,
            anexos_json TEXT,
            data_criacao TEXT,
            email TEXT,
            tema_sigla TEXT,
            FOREIGN KEY(pasta_id) REFERENCES pastas(id)
        )
    ''')

    # Criar a nova tabela 'status'
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS status (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pasta_id INTEGER,
            pasta_name TEXT,
            status TEXT,
            email TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    criar_banco_de_dados()
    print("Banco de dados e tabelas 'pastas', 'documentos' e 'status' criados com sucesso!")