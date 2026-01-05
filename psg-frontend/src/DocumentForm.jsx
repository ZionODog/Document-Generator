import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DocumentForm.css';
import Revisao from './Revisao';

const API_URL = '#####';

function DocumentForm({ folder, isEditing = false, initialData = null }) {
    const [titulo, setTitulo] = useState('');
    const [objetivo, setObjetivo] = useState('');
    const [responsabilidades, setResponsabilidades] = useState('');
    const [conceitosSiglas, setConceitosSiglas] = useState('');
    const [diretrizes, setDiretrizes] = useState('');
    const [tema, setTema] = useState('');
    const [documentosComplementares, setDocumentosComplementares] = useState('');
    const [referencias, setReferencias] = useState('');
    const [revisoes, setRevisoes] = useState([]);
    const [anexos, setAnexos] = useState([]);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (isEditing && initialData) {
            console.log("Dados recebidos para edição:", initialData);
            setTitulo(initialData.titulo || '');
            setObjetivo(initialData.objetivo || '');
            setResponsabilidades(initialData.responsaveis || '');
            setConceitosSiglas(initialData.conceitos_siglas || '');
            setDiretrizes(initialData.diretrizes || '');
            setTema(initialData.tema_sigla || '');
            setDocumentosComplementares(initialData.documentos_complementares || '');
            setReferencias(initialData.referencias || '');
            setRevisoes(initialData.revisoes || []);
            setEmail(initialData.email || '');
        }
    }, [isEditing, initialData]);

    const handleTemaChange = (e) => {
        const value = e.target.value.toUpperCase();
        if (value.length <= 3) {
            setTema(value);
        }
    };

    const handleRevisoesChange = (novasRevisoes) => {
        setRevisoes(novasRevisoes);
    };

    const handleAnexosChange = (e) => {
        const files = Array.from(e.target.files);
        setAnexos(files);
    };

    const removerAnexo = (nomeAnexo) => {
        const novosAnexos = anexos.filter(anexo => anexo.name !== nomeAnexo);
        setAnexos(novosAnexos);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setIsError(false);

        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('objetivo', objetivo);
        formData.append('responsabilidades', responsabilidades);
        formData.append('conceitosSiglas', conceitosSiglas);
        formData.append('diretrizes', diretrizes);
        formData.append('tema', tema);
        formData.append('documentosComplementares', documentosComplementares);
        formData.append('referencias', referencias);
        formData.append('revisoes', JSON.stringify(revisoes));
        formData.append('folder', JSON.stringify(folder));
        formData.append('email', email);

        anexos.forEach((anexo, index) => {
            formData.append(`anexos`, anexo);
        });

        const method = isEditing ? 'put' : 'post';
        const url = isEditing ? `${API_URL}/atualizar_documento/${initialData.id}` : `${API_URL}/gerar_documento`;

        try {
            const response = await axios({
                method: method,
                url: url,
                data: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
                responseType: 'blob'
            });

            const contentDisposition = response.headers['content-disposition'];
            let filename = 'Documento_PSG.docx';
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }
            if (filename === 'Documento_PSG.docx') {
                filename = `PSG-${folder.sigla}-${tema.toUpperCase()}.docx`;
            }

            const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = urlBlob;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setMessage(isEditing ? "Documento atualizado e download iniciado!" : "Documento gerado e download iniciado!");
            setIsError(false);

        } catch (error) {
            console.error("Erro ao processar o documento:", error);
            setMessage(isEditing ? "Ocorreu um erro ao atualizar o documento. Por favor, tente novamente." : "Ocorreu um erro ao gerar o documento. Por favor, tente novamente.");
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <h2>{isEditing ? "Editar Documento PSG" : "Preencha os dados do documento"}</h2>

                <div className="form-group">
                    <label htmlFor="email">E-mail para Notificação:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="tema">Abreviação do Tema (3 letras maiúsculas):</label>
                    <input
                        type="text"
                        id="tema"
                        value={tema}
                        onChange={handleTemaChange}
                        maxLength="3"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="titulo">Título do Documento:</label>
                    <input
                        type="text"
                        id="titulo"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="objetivo">Objetivo:</label>
                    <textarea
                        id="objetivo"
                        value={objetivo}
                        onChange={(e) => setObjetivo(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="responsabilidades">Responsabilidades:</label>
                    <textarea
                        id="responsabilidades"
                        value={responsabilidades}
                        onChange={(e) => setResponsabilidades(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="conceitosSiglas">Conceitos e Siglas:</label>
                    <textarea
                        id="conceitosSiglas"
                        value={conceitosSiglas}
                        onChange={(e) => setConceitosSiglas(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="diretrizes">Diretrizes/Procedimentos:</label>
                    <textarea
                        id="diretrizes"
                        value={diretrizes}
                        onChange={(e) => setDiretrizes(e.target.value)}
                    />
                </div>
                
                <div className="form-group">
                    <h3>5. ANEXOS</h3>
                    <p>Adicione imagens (apenas .png, .jpg e .jpeg):</p>
                    <input
                        type="file"
                        accept=".png, .jpg, .jpeg"
                        multiple
                        onChange={handleAnexosChange}
                    />
                    <div className="anexos-preview">
                        {anexos.map((anexo, index) => (
                            <div key={anexo.name} className="anexo-item">
                                <span>{anexo.name}</span>
                                <button type="button" onClick={() => removerAnexo(anexo.name)}>
                                    ❌
                                </button>
                            </div>
                        ))}
                        {anexos.length === 0 && <p className="no-anexos">Nenhum anexo adicionado.</p>}
                    </div>
                </div>

                <div className="form-group">
                    <h3>6. DOCUMENTOS COMPLEMENTARES</h3>
                    <textarea
                        id="documentosComplementares"
                        value={documentosComplementares}
                        onChange={(e) => setDocumentosComplementares(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <h3>7. REFERÊNCIAS</h3>
                    <textarea
                        id="referencias"
                        value={referencias}
                        onChange={(e) => setReferencias(e.target.value)}
                    />
                </div>

                <Revisao onRevisoesChange={handleRevisoesChange} />

                <button type="submit" className="submit-button" disabled={loading}>
                    {loading ? 'Processando...' : isEditing ? 'Salvar Edição' : 'Gerar Documento PSG'}
                </button>

                {message && (
                    <p className={`status-message ${isError ? 'error-message' : 'success-message'}`}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}

export default DocumentForm;