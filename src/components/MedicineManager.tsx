import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Pill, AlertTriangle } from 'lucide-react';
import { Medicine, getMedicines, createMedicine, updateMedicine, deleteMedicine } from '../lib/database';

export default function MedicineManager() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    dosagem: '',
    apresentacao: '',
    controlado: 0
  });

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const data = await getMedicines();
      setMedicines(data);
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
    }
  };

  const filteredMedicines = medicines.filter(medicine =>
    medicine.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.dosagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.apresentacao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMedicine) {
        await updateMedicine(editingMedicine.id!, formData);
      } else {
        await createMedicine(formData);
      }
      setFormData({ nome: '', dosagem: '', apresentacao: '', controlado: 0 });
      setShowForm(false);
      setEditingMedicine(null);
      loadMedicines();
    } catch (error) {
      console.error('Erro ao salvar medicamento:', error);
      alert('Erro ao salvar medicamento. Verifique se não há duplicação.');
    }
  };

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      nome: medicine.nome,
      dosagem: medicine.dosagem,
      apresentacao: medicine.apresentacao,
      controlado: medicine.controlado
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este medicamento?')) {
      try {
        await deleteMedicine(id);
        loadMedicines();
      } catch (error) {
        console.error('Erro ao excluir medicamento:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', dosagem: '', apresentacao: '', controlado: 0 });
    setShowForm(false);
    setEditingMedicine(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Pill className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Medicamentos</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Medicamento</span>
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nome, dosagem ou apresentação..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">
            {editingMedicine ? 'Editar Medicamento' : 'Novo Medicamento'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Medicamento
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosagem
                </label>
                <input
                  type="text"
                  required
                  value={formData.dosagem}
                  onChange={(e) => setFormData({ ...formData, dosagem: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apresentação
                </label>
                <input
                  type="text"
                  required
                  value={formData.apresentacao}
                  onChange={(e) => setFormData({ ...formData, apresentacao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medicamento Controlado
                </label>
                <select
                  value={formData.controlado}
                  onChange={(e) => setFormData({ ...formData, controlado: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={0}>Não</option>
                  <option value={1}>Sim</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingMedicine ? 'Atualizar' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Medicamentos */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dosagem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apresentação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Controlado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMedicines.map((medicine) => (
                <tr key={medicine.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {medicine.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medicine.dosagem}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medicine.apresentacao}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {medicine.controlado ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Sim
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Não
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(medicine)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(medicine.id!)}
                      className="text-red-600 hover:text-red-900 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredMedicines.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum medicamento encontrado
          </div>
        )}
      </div>
    </div>
  );
}