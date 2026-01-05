# 📑 PSG Governance & Document Generator

> **Padronização, Agilidade e Governança.** Uma plataforma Full Stack para criação, validação e aprovação de documentos de processos (PSG), eliminando a burocracia do SharePoint.

![React](https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Backend-Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Teams](https://img.shields.io/badge/Integration-MS_Teams-6264A7?style=for-the-badge&logo=microsoftteams&logoColor=white)
![Power Automate](https://img.shields.io/badge/Workflow-Power_Automate-0066FF?style=for-the-badge&logo=powerautomate&logoColor=white)

---

## 🎯 O Problema

A criação de **PSGs (Procedimentos de Segurança e Gestão)** e manuais de sistemas sofria com:
1.  **Falta de Padrão:** Cada analista formatava o documento de um jeito.
2.  **Burocracia:** O processo de aprovação exigia múltiplos e-mails e logins no SharePoint.
3.  **Lentidão:** A governança demorava para validar documentos simples devido à dificuldade de acesso.

---

## 💡 A Solução

Desenvolvi uma aplicação web que atua como um "wizard" de criação. O usuário preenche os campos e o sistema gera o documento `.docx` já formatado nas normas da empresa.

O grande diferencial é a **Esteira de Aprovação Inteligente**: Assim que o documento é gerado, a governança recebe um card interativo no Teams para aprovar ou recusar na hora, sem sair do chat.

### 📸 Interface Web (React.js)
_Uma interface limpa e intuitiva para garantir que todos os dados necessários sejam preenchidos._

<div align="center">
  <img src="./assets/page.png" alt="Interface do Gerador de PSG" width="700">
</div>

### 🔔 Fluxo de Aprovação (Teams Integration)
_O "pulo do gato": O aprovador recebe o arquivo e os botões de ação diretamente no Microsoft Teams._

<div align="center">
  <img src="./assets/notificacao.png" alt="Notificação de Aprovação no Teams" width="600">
</div>

---

## 🛠️ Arquitetura da Solução

O sistema integra tecnologias modernas de desenvolvimento web com a stack corporativa da Microsoft.

```mermaid
graph TD
    User[👤 Usuário] -->|Preenche Dados| Frontend[⚛️ React.js Frontend];
    Frontend -->|JSON Payload| Backend[🐍 Python Backend API];
    Backend -- "Gera .docx (Jinja2/Python-docx)" --> Docs[📄 Arquivo PSG Padronizado];
    Backend -->|Trigger Webhook| Logic[⚡ Power Automate / Logic Apps];
    Logic -->|Adaptive Card| Teams["💬 Microsoft Teams (Governança)"];
    Teams -->|Aprovar/Recusar| SharePoint["🗄️ SharePoint (Publicação)"];
