import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditorSelector.css';

const API_URL = '######';

function EditorSelector({ onDocumentoSelecionado }) {
    const [pastas, setPastas] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPastas = async () => {
            try {
                const response = await axios.get(`${API_URL}/pastas`);
                setPastas(response.data);
            } catch (err) {
                setError('Erro ao carregar as pastas.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPastas();
    }, []);

    const fetchDocumentos = async (pastaId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/documentos_por_pasta/${pastaId}`);
            setDocumentos(response.data);
        } catch (err) {
            setError('Erro ao carregar documentos para esta pasta.');
            console.error(err);
            setDocumentos([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderSelect = (pasta) => {
        setSelectedFolder(pasta);
        fetchDocumentos(pasta.id);
    };

    const handleDocumentoSelect = (doc) => {
        onDocumentoSelecionado(doc);
    };

    if (loading) {
        return <div className="editor-container">Carregando...</div>;
    }

    if (error) {
        return <div className="editor-container error-message">{error}</div>;
    }

    return (
        <div className="editor-container">
            <h2>✏️ Editar Arquivo PSG</h2>
            
            {!selectedFolder ? (
                <div className="pastas-selecao">
                    <p>Selecione uma pasta para ver os arquivos:</p>
                    <div className="pastas-lista">
                        {pastas.length === 0 ? (
                            <p>Nenhuma pasta encontrada.</p>
                        ) : (
                            pastas.map((pasta, index) => (
                                <button 
                                    key={index} 
                                    className="pasta-item"
                                    onClick={() => handleFolderSelect(pasta)}
                                >
                                    {pasta.nome} ({pasta.sigla})
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="documentos-selecao">
                    <h3>Documentos em: {selectedFolder.nome}</h3>
                    <button onClick={() => setSelectedFolder(null)}>Voltar para Pastas</button>
                    {documentos.length === 0 ? (
                        <p>Nenhum documento encontrado nesta pasta.</p>
                    ) : (
                        <div className="documentos-lista">
                            {documentos.map((doc) => (
                                <div key={doc.id} className="documento-item">
                                    <p><strong>Nome do Documento:</strong> {doc.full_filename}</p>
                                    <p><strong>Criado em:</strong> {doc.data_criacao}</p>
                                    <button onClick={() => handleDocumentoSelect(doc)}>
                                        Editar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default EditorSelector;