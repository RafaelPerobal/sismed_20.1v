import React, { useState } from 'react';
import { Settings, Database, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { backupDatabase, restoreDatabase } from '../lib/database';

export default function SettingsManager() {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    setMessage(null);
    
    try {
      const result = await backupDatabase();
      setMessage({ type: 'success', text: `Backup criado com sucesso em: ${result}` });
    } catch (error) {
      console.error('Erro ao fazer backup:', error);
      setMessage({ type: 'error', text: 'Erro ao criar backup. Tente novamente.' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('ATENÇÃO: Esta operação irá substituir todos os dados atuais pelos dados do backup selecionado. Deseja continuar?')) {
      return;
    }

    setIsRestoring(true);
    setMessage(null);
    
    try {
      const result = await restoreDatabase();
      setMessage({ type: 'success', text: result });
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      setMessage({ type: 'error', text: 'Erro ao restaurar backup. Verifique se o arquivo é válido.' });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800">Configurações do Sistema</h1>
      </div>

      {/* Mensagem de Status */}
      {message && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Seção de Backup e Restauro */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-800">Backup e Restauro de Dados</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backup */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Fazer Backup</h3>
            <p className="text-gray-600 text-sm mb-4">
              Crie uma cópia de segurança de todos os dados do sistema (pacientes, medicamentos, posologias e receitas).
            </p>
            <button
              onClick={handleBackup}
              disabled={isBackingUp}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>{isBackingUp ? 'Criando Backup...' : 'Criar Backup'}</span>
            </button>
          </div>

          {/* Restauro */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Restaurar Backup</h3>
            <p className="text-gray-600 text-sm mb-4">
              Restaure os dados a partir de um arquivo de backup. <strong>ATENÇÃO:</strong> Esta operação substituirá todos os dados atuais.
            </p>
            <button
              onClick={handleRestore}
              disabled={isRestoring}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Upload className="w-5 h-5" />
              <span>{isRestoring ? 'Restaurando...' : 'Restaurar Backup'}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Recomendações Importantes</h4>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Faça backups regulares dos seus dados</li>
                <li>• Guarde os arquivos de backup em local seguro</li>
                <li>• Teste periodicamente a restauração dos backups</li>
                <li>• Após restaurar um backup, reinicie a aplicação</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Sistema */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações do Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Versão:</span>
            <span className="ml-2 text-gray-600">SISMED v20.1</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tipo:</span>
            <span className="ml-2 text-gray-600">Aplicação Desktop Offline</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Base de Dados:</span>
            <span className="ml-2 text-gray-600">SQLite Local</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Desenvolvido para:</span>
            <span className="ml-2 text-gray-600">Prefeitura Municipal de Perobal</span>
          </div>
        </div>
      </div>
    </div>
  );
}