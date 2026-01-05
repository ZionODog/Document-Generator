import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FolderManager.css';

// URL do seu backend Flask
const API_URL = '####';

function FolderManager({ onFolderSelected }) {
  const [option, setOption] = useState('selecionar');
  const [existingFolders, setExistingFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderAcronym, setNewFolderAcronym] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFolders = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/pastas`);
        setExistingFolders(response.data);
      } catch (error) {
        console.error("Erro ao buscar pastas:", error);
        setMessage("Erro ao carregar as pastas. Por favor, reinicie o servidor.");
        setIsError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchFolders();
  }, []);

  const handleSelectFolder = () => {
    const folder = existingFolders.find(f => f.id === parseInt(selectedFolderId));
    if (folder) {
      onFolderSelected(folder);
    } else {
      setMessage('Por favor, selecione uma pasta.');
      setIsError(true);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !newFolderAcronym.trim()) {
      setMessage('Por favor, preencha o nome e a sigla da nova pasta.');
      setIsError(true);
      return;
    }
    
    setLoading(true);
    setMessage('');
    setIsError(false);

    try {
      const response = await axios.post(`${API_URL}/criar_pasta`, {
        nome: newFolderName.trim(),
        sigla: newFolderAcronym.trim().toUpperCase()
      });
      
      const { id } = response.data; // Captura o ID retornado pela API
      
      setMessage(response.data.message);
      setIsError(false);
      
      // Cria o objeto da pasta com o ID correto
      const newFolder = { id: id, nome: newFolderName.trim(), sigla: newFolderAcronym.trim().toUpperCase() };
      
      // Atualiza a lista de pastas e seleciona a nova pasta
      setExistingFolders(prev => [...prev, newFolder]);
      onFolderSelected(newFolder);

    } catch (error) {
      console.error("Erro ao criar pasta:", error.response?.data?.error || error.message);
      setMessage(error.response?.data?.error || "Ocorreu um erro ao criar a pasta.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="folder-manager-container">
      <h3>📁 Escolha onde salvar os arquivos</h3>
      
      <div className="radio-group">
        <label>
          <input
            type="radio"
            value="selecionar"
            checked={option === 'selecionar'}
            onChange={() => setOption('selecionar')}
          />
          Selecionar pasta existente
        </label>
        <label>
          <input
            type="radio"
            value="criar"
            checked={option === 'criar'}
            onChange={() => setOption('criar')}
          />
          Criar nova pasta
        </label>
      </div>

      {option === 'selecionar' && (
        <div className="select-container">
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
          >
            <option value="">Selecione a pasta:</option>
            {existingFolders.map(folder => (
              <option key={folder.id} value={folder.id}>
                {folder.nome}
              </option>
            ))}
          </select>
          <button onClick={handleSelectFolder} disabled={loading}>
            {loading ? 'Carregando...' : 'Confirmar'}
          </button>
        </div>
      )}

      {option === 'criar' && (
        <div className="create-container">
          <input
            type="text"
            placeholder="Digite o nome da nova pasta"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Digite a sigla (3 letras)"
            value={newFolderAcronym}
            onChange={(e) => setNewFolderAcronym(e.target.value)}
            maxLength="3"
          />
          <button onClick={handleCreateFolder} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Pasta'}
          </button>
        </div>
      )}

      {message && (
        <p className={`status-message ${isError ? 'error-message' : 'success-message'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default FolderManager;