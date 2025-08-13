import React, { useState } from 'react';
import Layout from './components/Layout';
import PatientManager from './components/PatientManager';
import MedicineManager from './components/MedicineManager';
import PosologyManager from './components/PosologyManager';
import PrescriptionManager from './components/PrescriptionManager';
import SettingsManager from './components/SettingsManager';

function App() {
  const [currentPage, setCurrentPage] = useState('patients');

  const renderPage = () => {
    switch (currentPage) {
      case 'patients':
        return <PatientManager />;
      case 'medicines':
        return <MedicineManager />;
      case 'posologies':
        return <PosologyManager />;
      case 'prescriptions':
        return <PrescriptionManager />;
      case 'settings':
        return <SettingsManager />;
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
