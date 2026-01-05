import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'C:\\PYTHON\\PSG_new\\psg-frontend\\src\\Historico.css';

const API_URL = '#####';

function Historico() {
    const [pastas, setPastas] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [arquivos, setArquivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchPastas = async () => {
            try {
                const response = await axios.get(`${API_URL}/pastas`);
                setPastas(response.data);
            } catch (err) {
                setError('Erro ao carregar as pastas. Por favor, verifique a conexão com o servidor.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPastas();
    }, []);

    const fetchArquivos = async (pastaNome) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/listar_arquivos/${pastaNome}`);
            setArquivos(response.data.arquivos);
        } catch (err) {
            setError(`Erro ao carregar arquivos da pasta ${pastaNome}.`);
            console.error(err);
            setArquivos([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFolderSelect = (pasta) => {
        setSelectedFolder(pasta);
        fetchArquivos(pasta.nome);
    };

    const handleDownload = async (pastaNome, filename) => {
        try {
            const response = await axios.get(`${API_URL}/download/${pastaNome}/${filename}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Erro ao baixar o arquivo:", err);
            alert("Erro ao baixar o arquivo. Verifique se o arquivo existe no servidor.");
        }
    };

    if (loading) {
        return <div className="historico-container">Carregando...</div>;
    }

    if (error) {
        return <div className="historico-container error-message">{error}</div>;
    }

    return (
        <div className="historico-container">
            <h2>📂 Histórico de Documentos</h2>
            
            {!selectedFolder ? (
                <div>
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
                <div className="arquivos-view">
                    <h3>Arquivos em: {selectedFolder.nome}</h3>
                    <button onClick={() => setSelectedFolder(null)}>Voltar para Pastas</button>
                    {arquivos.length === 0 ? (
                        <p>Nenhum arquivo encontrado nesta pasta.</p>
                    ) : (
                        <div className="arquivos-lista">
                            {arquivos.map((filename, index) => (
                                <div key={index} className="arquivo-item">
                                    <span className='arquivo-filename'>{filename}</span>
                                    <button onClick={() => handleDownload(selectedFolder.nome, filename)}>
                                        Baixar
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

export default Historico;