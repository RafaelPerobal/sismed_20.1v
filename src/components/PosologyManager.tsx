import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react';
import { Posology, getPosologies, createPosology, updatePosology, deletePosology } from '../lib/database';

export default function PosologyManager() {
  const [posologies, setPosologies] = useState<Posology[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPosology, setEditingPosology] = useState<Posology | null>(null);
  const [formData, setFormData] = useState({
    texto: ''
  });

  useEffect(() => {
    loadPosologies();
  }, []);

  const loadPosologies = async () => {
    try {
      const data = await getPosologies();
      setPosologies(data);
    } catch (error) {
      console.error('Erro ao carregar posologias:', error);
    }
  };

  const filteredPosologies = posologies.filter(posology =>
    posology.texto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPosology) {
        await updatePosology(editingPosology.id!, formData);
      } else {
        await createPosology(formData);
      }
      setFormData({ texto: '' });
      setShowForm(false);
      setEditingPosology(null);
      loadPosologies();
    } catch (error) {
      console.error('Erro ao salvar posologia:', error);
      alert('Erro ao salvar posologia. Verifique se não há duplicação.');
    }
  };

  const handleEdit = (posology: Posology) => {
    setEditingPosology(posology);
    setFormData({
      texto: posology.texto
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta posologia?')) {
      try {
        await deletePosology(id);
        loadPosologies();
      } catch (error) {
        console.error('Erro ao excluir posologia:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ texto: '' });
    setShowForm(false);
    setEditingPosology(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">Gestão de Posologias</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nova Posologia</span>
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar posologia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">
            {editingPosology ? 'Editar Posologia' : 'Nova Posologia'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto da Posologia
              </label>
              <textarea
                required
                rows={3}
                value={formData.texto}
                onChange={(e) => setFormData({ ...formData, texto: e.target.value })}
                placeholder="Ex: 1 COMPRIMIDO DE 8 EM 8 HORAS"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingPosology ? 'Atualizar' : 'Salvar'}
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

      {/* Lista de Posologias */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Posologia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPosologies.map((posology) => (
                <tr key={posology.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {posology.texto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(posology)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(posology.id!)}
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
        {filteredPosologies.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhuma posologia encontrada
          </div>
        )}
      </div>
    </div>
  );
}