import os
import requests
import pandas as pd
from datetime import datetime
from pathlib import Path
import schedule
import time
import io
import sqlite3
import json

# --- Nomes das pastas no SharePoint ---
PASTA_PENDENTES = 'Pendentes'
PASTA_REPROVADOS = 'Reprovados'

# --- Configurações do Banco de Dados ---
DATABASE = 'banco.db'
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# --- Funções de Acesso ao SharePoint (reutilizadas e adaptadas) ---
def get_sharepoint_auth_headers():
    token_url = f'https://login.microsoftonline.com/{SHAREPOINT_TENANT_ID}/oauth2/v2.0/token'
    token_data = {
        'grant_type': 'client_credentials',
        'client_id': SHAREPOINT_CLIENT_ID,
        'client_secret': SHAREPOINT_CLIENT_SECRET,
        'scope': 'https://graph.microsoft.com/.default'
    }
    token_response = requests.post(token_url, data=token_data)
    access_token = token_response.json().get('access_token')
    return {'Authorization': f'Bearer {access_token}'}

def get_sharepoint_drive_id():
    headers = get_sharepoint_auth_headers()
    domain = SHAREPOINT_SITE_URL.split('/')[2]
    site_path = '/' + '/'.join(SHAREPOINT_SITE_URL.split('/')[3:])
    site_id_url = f'https://graph.microsoft.com/v1.0/sites/{domain}:{site_path}'
    site_id = requests.get(site_id_url, headers=headers).json().get('id')
    drive_url = f'https://graph.microsoft.com/v1.0/sites/{site_id}/drives'
    drive_response = requests.get(drive_url, headers=headers)
    drives = drive_response.json().get('value', [])
    return next((d['id'] for d in drives if d['name'] == 'Documentos'), None)

def get_sharepoint_item_id(drive_id, file_path):
    headers = get_sharepoint_auth_headers()
    item_url = f'https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path}'
    response = requests.get(item_url, headers=headers)
    return response.json().get('id', None) if response.status_code == 200 else None

def delete_sharepoint_item(drive_id, item_id):
    headers = get_sharepoint_auth_headers()
    delete_url = f'https://graph.microsoft.com/v1.0/drives/{drive_id}/items/{item_id}'
    response = requests.delete(delete_url, headers=headers)
    return response.status_code == 204

def get_sharepoint_file_content(drive_id, file_path):
    headers = get_sharepoint_auth_headers()
    download_url = f'https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{file_path}:/content'
    response = requests.get(download_url, headers=headers)
    return response.content if response.status_code == 200 else None

def upload_sharepoint_file(drive_id, file_name, file_content, destination_folder):
    headers = get_sharepoint_auth_headers()
    headers['Content-Type'] = 'application/octet-stream'
    upload_url = f'https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{SHAREPOINT_BASE_PATH}/{destination_folder}/{file_name}:/content'
    response = requests.put(upload_url, headers=headers, data=file_content)
    return response.status_code in [200, 201]

def find_latest_approved_version(drive_id, file_prefix, destination_folder):
    headers = get_sharepoint_auth_headers()
    folder_url = f'https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{SHAREPOINT_BASE_PATH}/{destination_folder}/children'
    response = requests.get(folder_url, headers=headers)
    
    if response.status_code == 200:
        files = response.json().get('value', [])
        latest_file = None
        latest_version = -1

        for file in files:
            if file['name'].startswith(file_prefix):
                try:
                    version_str = file['name'].split('-')[-1].replace('.docx', '')
                    version = int(version_str)
                    if version > latest_version:
                        latest_version = version
                        latest_file = file
                except (ValueError, IndexError):
                    continue
        return latest_file
    return None

def extract_pasta_token_from_filename(nome_documento_sem_extensao: str) -> str | None:
    """
    Espera nomes no formato: PSG-{pasta_token}-{tema_sigla}-{versao}
    Retorna o pasta_token (ex: 'PYT' ou '1') ou None se não puder extrair.
    """
    parts = nome_documento_sem_extensao.split('-')
    if len(parts) >= 2 and parts[0].upper() == 'PSG':
        return parts[1]
    return None

def get_pasta_destino_from_filename(nome_documento_sem_extensao: str) -> str | None:
    """
    Tenta resolver o nome da pasta destino consultando a tabela 'pastas'.
    Estratégia:
      1) extrai token (segundo padrão PSG-...)
      2) se token for numérico -> busca por id
      3) se token for texto -> tenta colunas comuns (sigla, codigo)
      4) fallback -> busca por nome contendo token
      5) último recurso -> antigo lookup via tabela 'documentos' (mantém compatibilidade)
    Retorna pasta.nome (string) ou None se não encontrar.
    """
    token = extract_pasta_token_from_filename(nome_documento_sem_extensao)

    conn = get_db_connection()
    try:
        # Se não conseguimos extrair token, mantemos o comportamento antigo:
        if token is None:
            row = conn.execute(
                "SELECT p.nome AS pasta_original FROM documentos d "
                "JOIN pastas p ON d.pasta_id = p.id WHERE d.titulo = ?",
                (nome_documento_sem_extensao,)
            ).fetchone()
            return row['pasta_original'] if row else None

        # 1) token numérico -> procura por id
        try:
            pid = int(token)
            row = conn.execute("SELECT nome FROM pastas WHERE id = ?", (pid,)).fetchone()
            if row:
                return row['nome']
        except ValueError:
            # token não é número -> continua
            pass

        # 2) token textual -> tenta colunas comuns (se a coluna não existir, ignora erro)
        for col in ('sigla', 'codigo', 'abreviacao', 'codigo_pasta'):
            try:
                row = conn.execute(f"SELECT nome FROM pastas WHERE {col} = ? COLLATE NOCASE", (token,)).fetchone()
                if row:
                    return row['nome']
            except sqlite3.OperationalError:
                # coluna não existe, ignora e continua
                continue

        # 3) fallback: buscar por nome que contenha o token
        row = conn.execute("SELECT nome FROM pastas WHERE nome LIKE ? COLLATE NOCASE", (f"%{token}%",)).fetchone()
        if row:
            return row['nome']

        # 4) nada encontrado
        return None
    finally:
        conn.close()


# --- Ajuste em processar_aprovacoes: substitui a busca antiga pelo novo resolvedor ---
def processar_aprovacoes():
    print(f"[{datetime.now()}] Verificando aprovações...")
    
    drive_id = get_sharepoint_drive_id()
    if not drive_id:
        print("Erro: Não foi possível obter o Drive ID.")
        return

    status_file_path = f'{SHAREPOINT_BASE_PATH}/Status_PSG.xlsx'
    file_content = get_sharepoint_file_content(drive_id, status_file_path)
    
    if not file_content:
        print("Aviso: Arquivo Status_PSG.xlsx não encontrado ou vazio.")
        return

    try:
        status_data = pd.read_excel(io.BytesIO(file_content))
    except Exception as e:
        print(f"❌ Erro ao ler o arquivo Excel: {e}")
        return

    linhas_para_remover = []  # vamos marcar os índices a remover

    for index, row in status_data.iterrows():
        nome_documento_sem_extensao = row['Nome']
        nome_documento_completo = f"{nome_documento_sem_extensao}.docx"
        status = row['Status']

        pending_file_path = f'{SHAREPOINT_BASE_PATH}/{PASTA_PENDENTES}/{nome_documento_completo}'
        file_to_upload_content = get_sharepoint_file_content(drive_id, pending_file_path)

        if not file_to_upload_content:
            print(f"Aviso: Arquivo '{nome_documento_completo}' não encontrado na pasta '{PASTA_PENDENTES}'.")
            continue

        if status == 'Aprovado':
            print(f"Documento '{nome_documento_completo}' Aprovado. Processando...")

            pasta_destino = get_pasta_destino_from_filename(nome_documento_sem_extensao)
            if not pasta_destino:
                print(f"❌ Erro: Não foi possível encontrar a pasta destino para '{nome_documento_sem_extensao}'.")
                continue

            if upload_sharepoint_file(drive_id, nome_documento_completo, file_to_upload_content, pasta_destino):
                print(f"✅ Documento '{nome_documento_completo}' movido para a pasta '{pasta_destino}'.")

                # Remover versão antiga
                prefix = '-'.join(nome_documento_completo.split('-')[:-1])
                latest_approved_file = find_latest_approved_version(drive_id, prefix, pasta_destino)
                if latest_approved_file and latest_approved_file['name'] != nome_documento_completo:
                    old_item_id = latest_approved_file['id']
                    if delete_sharepoint_item(drive_id, old_item_id):
                        print(f"✅ Versão antiga '{latest_approved_file['name']}' removida.")

                # Remover da pasta Pendente
                item_id_to_delete = get_sharepoint_item_id(drive_id, pending_file_path)
                if item_id_to_delete and delete_sharepoint_item(drive_id, item_id_to_delete):
                    print(f"✅ Documento original removido da pasta '{PASTA_PENDENTES}'.")

                # Marcar para remover do Excel
                linhas_para_remover.append(index)
            else:
                print(f"❌ Erro ao mover o documento '{nome_documento_completo}'.")

        elif status == 'Reprovado':
            print(f"Documento '{nome_documento_completo}' Reprovado. Processando...")

            if upload_sharepoint_file(drive_id, nome_documento_completo, file_to_upload_content, PASTA_REPROVADOS):
                print(f"✅ Documento '{nome_documento_completo}' movido para a pasta '{PASTA_REPROVADOS}'.")

                # Remover da pasta Pendente
                item_id_to_delete = get_sharepoint_item_id(drive_id, pending_file_path)
                if item_id_to_delete and delete_sharepoint_item(drive_id, item_id_to_delete):
                    print(f"✅ Documento original removido da pasta '{PASTA_PENDENTES}'.")

                # Marcar para remover do Excel
                linhas_para_remover.append(index)
            else:
                print(f"❌ Erro ao mover o documento '{nome_documento_completo}'.")

    # 🔄 Atualizar o Status_PSG.xlsx removendo as linhas processadas
    if linhas_para_remover:
        status_data = status_data.drop(linhas_para_remover)
        output = io.BytesIO()
        status_data.to_excel(output, index=False)
        output.seek(0)

        if upload_sharepoint_file(drive_id, "Status_PSG.xlsx", output.read(), ""):
            print(f"📄 Arquivo Status_PSG.xlsx atualizado com sucesso (linhas processadas removidas).")
        else:
            print(f"❌ Erro ao atualizar Status_PSG.xlsx no SharePoint.")
                
# Passo 3: Agendar a Execução
if __name__ == "__main__":
    if not all([SHAREPOINT_CLIENT_ID, SHAREPOINT_CLIENT_SECRET, SHAREPOINT_TENANT_ID]):
        print("❌ Por favor, preencha as credenciais do SharePoint no script.")
    else:
        schedule.every(1).minutes.do(processar_aprovacoes)
        print("🚀 Agendador iniciado. Verificando aprovações a cada 1 minuto...")

        while True:
            schedule.run_pending()
            time.sleep(1)