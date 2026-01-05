import { useState } from 'react';
import Navbar from './Navbar';
import FolderManager from './FolderManager';
import DocumentForm from './DocumentForm';
import Historico from './Historico';
import EditorSelector from './EditorSelector'; // Importe o novo componente
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('novo');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [documentoParaEditar, setDocumentoParaEditar] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedFolder(null);
    setDocumentoParaEditar(null);
  };
  
  const handleSelectDocumentoParaEditar = (doc) => {
    setDocumentoParaEditar(doc);
    setActiveTab('editar');
  };

  return (
    <div className="app">
      <img src="/wick.png" className="logo" alt="Wickbold Logo" />
      <h1 className="title">📝 Gerador de Documentos PSG</h1>
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === 'novo' && (
        <div className="content">
          {selectedFolder ? (
            <DocumentForm folder={selectedFolder} />
          ) : (
            <FolderManager onFolderSelected={setSelectedFolder} />
          )}
        </div>
      )}
      
      {activeTab === 'historico' && <Historico />}
      
      {activeTab === 'editar' && (
        <div className="content">
          {documentoParaEditar ? (
            <DocumentForm isEditing={true} initialData={documentoParaEditar} folder={documentoParaEditar.folder} />
          ) : (
            <EditorSelector onDocumentoSelecionado={handleSelectDocumentoParaEditar} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;