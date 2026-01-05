import React from 'react';
import './Navbar.css';

function Navbar({ activeTab, onTabChange }) {
  return (
    <nav className="navbar">
      <div className="nav-item-container">
        <button
          className={`nav-item ${activeTab === 'novo' ? 'active' : ''}`}
          onClick={() => onTabChange('novo')}
        >
          Gerar Novo PSG
        </button>
        <button
          className={`nav-item ${activeTab === 'historico' ? 'active' : ''}`}
          onClick={() => onTabChange('historico')}
        >
          Histórico
        </button>
        <button
          className={`nav-item ${activeTab === 'editar' ? 'active' : ''}`}
          onClick={() => onTabChange('editar')}
        >
          Editar Arquivo
        </button>
      </div>
    </nav>
  );
}

export default Navbar;