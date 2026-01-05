import React, { useState } from 'react';
import './Revisao.css';

function Revisao({ onRevisoesChange }) {
  const [revisoes, setRevisoes] = useState([]);

  const adicionarRevisao = () => {
    const novaRevisao = {
      data: new Date().toLocaleDateString('pt-BR'),
      responsavel: '',
      alteracao: '',
    };
    const novasRevisoes = [...revisoes, novaRevisao];
    setRevisoes(novasRevisoes);
    onRevisoesChange(novasRevisoes);
  };

  const removerRevisao = (indexParaRemover) => {
    const novasRevisoes = revisoes.filter((_, index) => index !== indexParaRemover);
    setRevisoes(novasRevisoes);
    onRevisoesChange(novasRevisoes);
  };

  const handleInputChange = (e, index, campo) => {
    const novasRevisoes = [...revisoes];
    novasRevisoes[index][campo] = e.target.value;
    setRevisoes(novasRevisoes);
    onRevisoesChange(novasRevisoes);
  };

  return (
    <div className="revisao-container">
      <h3>8. CONTROLE DE REVISÃO</h3>
      <p>Preencha as revisões do documento:</p>
      
      <button type="button" onClick={adicionarRevisao} className="adicionar-revisao-button">
        ➕ Adicionar Revisão
      </button>

      {revisoes.length > 0 ? (
        <div className="revisoes-lista">
          {revisoes.map((revisao, index) => (
            <div key={index} className="revisao-item">
              <div className="revisao-item-campos">
                <div className="revisao-campo">
                  <label>Data</label>
                  <input
                    type="text"
                    value={revisao.data}
                    onChange={(e) => handleInputChange(e, index, 'data')}
                  />
                </div>
                <div className="revisao-campo">
                  <label>Responsável</label>
                  <input
                    type="text"
                    value={revisao.responsavel}
                    onChange={(e) => handleInputChange(e, index, 'responsavel')}
                  />
                </div>
                <div className="revisao-campo-alteracao">
                  <label>Alteração</label>
                  <textarea
                    value={revisao.alteracao}
                    onChange={(e) => handleInputChange(e, index, 'alteracao')}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removerRevisao(index)}
                className="remover-revisao-button"
              >
                ❌ Remover
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>Nenhuma revisão registrada.</p>
      )}
    </div>
  );
}

export default Revisao;