import React, { useState, useEffect } from 'react';
import { Search, Plus, FileText, User, Calendar, Eye, Trash2 } from 'lucide-react';
import { 
  Patient, 
  Medicine, 
  Posology, 
  Prescription,
  PrescriptionMedicine,
  PrescriptionWithMedicines,
  getPatients, 
  getMedicines, 
  getPosologies,
  getPrescriptionsByPatient,
  createPrescription,
  addMedicineToPrescription,
  getPrescriptionWithMedicines
} from '../lib/database';
import { generatePrescriptionPDF, PrescriptionData } from '../lib/pdf';

interface SelectedMedicine {
  medicine: Medicine;
  posologia: string;
}

export default function PrescriptionManager() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [posologies, setPosologies] = useState<Posology[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchPatient, setSearchPatient] = useState('');
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [showMedicineSelector, setShowMedicineSelector] = useState(false);
  const [showPrescriptionDetail, setShowPrescriptionDetail] = useState(false);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<number | null>(null);
  
  const [selectedMedicines, setSelectedMedicines] = useState<SelectedMedicine[]>([]);
  const [searchMedicine, setSearchMedicine] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [months, setMonths] = useState(1);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientPrescriptions();
    }
  }, [selectedPatient]);

  const loadInitialData = async () => {
    try {
      const [patientsData, medicinesData, posologiesData] = await Promise.all([
        getPatients(),
        getMedicines(),
        getPosologies()
      ]);
      setPatients(patientsData);
      setMedicines(medicinesData);
      setPosologies(posologiesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadPatientPrescriptions = async () => {
    if (!selectedPatient?.id) return;
    try {
      const data = await getPrescriptionsByPatient(selectedPatient.id);
      setPrescriptions(data);
    } catch (error) {
      console.error('Erro ao carregar prescrições:', error);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.nome.toLowerCase().includes(searchPatient.toLowerCase()) ||
    patient.cpf.includes(searchPatient)
  );

  const filteredMedicines = medicines.filter(medicine =>
    medicine.nome.toLowerCase().includes(searchMedicine.toLowerCase()) ||
    medicine.dosagem.toLowerCase().includes(searchMedicine.toLowerCase())
  );

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchPatient('');
  };

  const handleAddMedicine = (medicine: Medicine) => {
    const exists = selectedMedicines.find(sm => sm.medicine.id === medicine.id);
    if (!exists) {
      setSelectedMedicines([...selectedMedicines, { medicine, posologia: '' }]);
    }
  };

  const handleRemoveMedicine = (medicineId: number) => {
    setSelectedMedicines(selectedMedicines.filter(sm => sm.medicine.id !== medicineId));
  };

  const handleUpdatePosologia = (medicineId: number, posologia: string) => {
    setSelectedMedicines(selectedMedicines.map(sm => 
      sm.medicine.id === medicineId ? { ...sm, posologia } : sm
    ));
  };

  const handleCreatePrescription = async () => {
    if (!selectedPatient?.id || selectedMedicines.length === 0) {
      alert('Selecione um paciente e pelo menos um medicamento');
      return;
    }

    // Verificar se todas as posologias foram preenchidas
    const incompleteMedicines = selectedMedicines.filter(sm => !sm.posologia.trim());
    if (incompleteMedicines.length > 0) {
      alert('Preencha a posologia para todos os medicamentos');
      return;
    }

    try {
      // Criar prescrição
      const prescriptionId = await createPrescription({
        patient_id: selectedPatient.id,
        data: prescriptionDate,
        observacoes: observacoes.trim() || undefined
      });

      // Adicionar medicamentos à prescrição
      for (const sm of selectedMedicines) {
        await addMedicineToPrescription({
          prescription_id: prescriptionId,
          medicine_id: sm.medicine.id!,
          posologia: sm.posologia
        });
      }

      // Gerar PDF
      const pdfData: PrescriptionData = {
        patient: {
          nome: selectedPatient.nome,
          cpf: selectedPatient.cpf,
          data_nascimento: selectedPatient.data_nascimento
        },
        medicines: selectedMedicines.map(sm => ({
          nome: sm.medicine.nome,
          dosagem: sm.medicine.dosagem,
          apresentacao: sm.medicine.apresentacao,
          posologia: sm.posologia,
          controlado: sm.medicine.controlado
        })),
        data: prescriptionDate,
        observacoes: observacoes.trim() || undefined,
        months
      };

      await generatePrescriptionPDF(pdfData);

      // Resetar formulário
      setSelectedMedicines([]);
      setObservacoes('');
      setPrescriptionDate(new Date().toISOString().split('T')[0]);
      setMonths(1);
      setShowNewPrescription(false);
      
      // Recarregar prescrições
      loadPatientPrescriptions();
      
      alert('Receita criada e salva com sucesso!');
    } catch (error) {
      console.error('Erro ao criar prescrição:', error);
      alert('Erro ao criar prescrição');
    }
  };

  const handleViewPrescription = async (prescriptionId: number) => {
    setSelectedPrescriptionId(prescriptionId);
    setShowPrescriptionDetail(true);
  };

  const resetNewPrescription = () => {
    setSelectedMedicines([]);
    setObservacoes('');
    setPrescriptionDate(new Date().toISOString().split('T')[0]);
    setMonths(1);
    setShowNewPrescription(false);
    setShowMedicineSelector(false);
  };

  if (!selectedPatient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Sistema de Prescrições</h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Selecionar Paciente</h2>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar paciente por nome ou CPF..."
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className="p-4 border border-gray-200 rounded-lg mb-2 hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <h3 className="font-medium text-gray-900">{patient.nome}</h3>
                    <p className="text-sm text-gray-500">CPF: {patient.cpf}</p>
                    <p className="text-sm text-gray-500">
                      Nascimento: {new Date(patient.data_nascimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPatients.length === 0 && searchPatient && (
            <div className="text-center py-8 text-gray-500">
              Nenhum paciente encontrado
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Prescrições</h1>
            <p className="text-gray-600">Paciente: {selectedPatient.nome}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowNewPrescription(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Receita</span>
          </button>
          <button
            onClick={() => setSelectedPatient(null)}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Trocar Paciente
          </button>
        </div>
      </div>

      {/* Lista de Prescrições */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Histórico de Receitas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observações
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prescriptions.map((prescription) => (
                <tr key={prescription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(prescription.data).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {prescription.observacoes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewPrescription(prescription.id!)}
                      className="text-blue-600 hover:text-blue-900 p-1 mr-2"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {prescriptions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma receita encontrada para este paciente
          </div>
        )}
      </div>

      {/* Modal Nova Prescrição */}
      {showNewPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Nova Receita</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data da Receita
                </label>
                <input
                  type="date"
                  value={prescriptionDate}
                  onChange={(e) => setPrescriptionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receitas para quantos meses?
                </label>
                <select
                  value={months}
                  onChange={(e) => setMonths(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1 mês</option>
                  <option value={2}>2 meses</option>
                  <option value={3}>3 meses</option>
                  <option value={6}>6 meses</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Medicamentos Selecionados
                </label>
                <button
                  onClick={() => setShowMedicineSelector(true)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Adicionar Medicamento
                </button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedMedicines.map((sm) => (
                  <div key={sm.medicine.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{sm.medicine.nome} {sm.medicine.dosagem}</h4>
                        <p className="text-sm text-gray-500">{sm.medicine.apresentacao}</p>
                        {sm.medicine.controlado === 1 && (
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mt-1">
                            Controlado
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveMedicine(sm.medicine.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Posologia
                      </label>
                      <input
                        type="text"
                        value={sm.posologia}
                        onChange={(e) => handleUpdatePosologia(sm.medicine.id!, e.target.value)}
                        placeholder="Ex: 1 COMPRIMIDO DE 8 EM 8 HORAS"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedMedicines.length === 0 && (
                <div className="text-center py-4 text-gray-500 border border-gray-200 rounded-lg">
                  Nenhum medicamento selecionado
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações (opcional)
              </label>
              <textarea
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCreatePrescription}
                disabled={selectedMedicines.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Gerar Receita
              </button>
              <button
                onClick={resetNewPrescription}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Seletor de Medicamentos */}
      {showMedicineSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Selecionar Medicamentos</h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar medicamento..."
                value={searchMedicine}
                onChange={(e) => setSearchMedicine(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredMedicines.map((medicine) => {
                const isSelected = selectedMedicines.find(sm => sm.medicine.id === medicine.id);
                return (
                  <div
                    key={medicine.id}
                    onClick={() => !isSelected && handleAddMedicine(medicine)}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
                        : 'border-gray-200 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{medicine.nome} {medicine.dosagem}</h4>
                        <p className="text-sm text-gray-500">{medicine.apresentacao}</p>
                        {medicine.controlado === 1 && (
                          <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mt-1">
                            Controlado
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <span className="text-green-600 text-sm font-medium">Selecionado</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowMedicineSelector(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalhes da Prescrição */}
      {showPrescriptionDetail && selectedPrescriptionId && (
        <PrescriptionDetailModal
          prescriptionId={selectedPrescriptionId}
          onClose={() => {
            setShowPrescriptionDetail(false);
            setSelectedPrescriptionId(null);
          }}
        />
      )}
    </div>
  );
}

// Componente para mostrar detalhes da prescrição
function PrescriptionDetailModal({ prescriptionId, onClose }: { prescriptionId: number; onClose: () => void }) {
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionWithMedicines | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptionData();
  }, [prescriptionId]);

  const loadPrescriptionData = async () => {
    try {
      const data = await getPrescriptionWithMedicines(prescriptionId);
      setPrescriptionData(data);
    } catch (error) {
      console.error('Erro ao carregar prescrição:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!prescriptionData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Erro ao carregar prescrição</p>
          <button onClick={onClose} className="mt-4 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg">
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Detalhes da Receita</h3>
        
        <div className="mb-4">
          <p><strong>Data:</strong> {new Date(prescriptionData.prescription.data).toLocaleDateString('pt-BR')}</p>
          {prescriptionData.prescription.observacoes && (
            <p><strong>Observações:</strong> {prescriptionData.prescription.observacoes}</p>
          )}
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">Medicamentos:</h4>
          <div className="space-y-2">
            {prescriptionData.medicines.map((medicine) => (
              <div key={medicine.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{medicine.nome} {medicine.dosagem}</h5>
                    <p className="text-sm text-gray-500">{medicine.apresentacao}</p>
                    <p className="text-sm text-gray-700 mt-1"><strong>Posologia:</strong> {medicine.posologia}</p>
                    {medicine.controlado === 1 && (
                      <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mt-1">
                        Controlado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}