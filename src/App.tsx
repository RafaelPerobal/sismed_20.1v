import React, { useState } from 'react';
import Layout from './components/Layout';
import PatientManager from './components/PatientManager';

function App() {
  const [currentPage, setCurrentPage] = useState('patients');

  const renderPage = () => {
    switch (currentPage) {
      case 'patients':
        return <PatientManager />;
      case 'medicines':
        return <div>Gestão de Medicamentos (Em desenvolvimento)</div>;
      case 'posologies':
        return <div>Gestão de Posologias (Em desenvolvimento)</div>;
      case 'prescriptions':
        return <div>Sistema de Prescrições (Em desenvolvimento)</div>;
      case 'settings':
        return <div>Configurações (Em desenvolvimento)</div>;
      default:
        return <PatientManager />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
