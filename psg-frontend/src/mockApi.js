// Este arquivo simula as chamadas de API para o backend

// Lista de pastas e siglas mockadas
const mockFolders = [
  { nome: 'DIGIBEE', sigla: 'DIG' },
  { nome: 'Python', sigla: 'PYT' },
  { nome: 'SAP', sigla: 'SAP' },
];

export const getExistingFolders = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(mockFolders);
    }, 500); // Simula um pequeno atraso de rede
  });
};

export const createNewFolder = (nome, sigla) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simula uma checagem de sigla já existente
      if (mockFolders.some(folder => folder.sigla === sigla)) {
        reject('Erro: Esta sigla já existe!');
      } else {
        const newFolder = { nome, sigla };
        mockFolders.push(newFolder); // Adiciona ao array mockado
        resolve(newFolder);
      }
    }, 500);
  });
};