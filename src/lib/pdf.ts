import jsPDF from 'jspdf';
import { invoke } from '@tauri-apps/api/tauri';

export interface PrescriptionData {
  patient: {
    nome: string;
    cpf: string;
    data_nascimento: string;
  };
  medicines: Array<{
    nome: string;
    dosagem: string;
    apresentacao: string;
    posologia: string;
    controlado: number;
  }>;
  data: string;
  observacoes?: string;
  months?: number;
}

export async function generatePrescriptionPDF(data: PrescriptionData): Promise<void> {
  const pdf = new jsPDF();
  const pageHeight = pdf.internal.pageSize.height;
  const pageWidth = pdf.internal.pageSize.width;
  const margin = 20;
  const lineHeight = 6;
  
  // Função para adicionar cabeçalho
  const addHeader = (pageNum: number, totalPages: number) => {
    // Logo/Cabeçalho da Prefeitura
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREFEITURA MUNICIPAL DE PEROBAL', pageWidth / 2, 25, { align: 'center' });
    pdf.text('SECRETARIA MUNICIPAL DE SAÚDE', pageWidth / 2, 32, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Rua Principal, 123 - Centro - Perobal/PR', pageWidth / 2, 39, { align: 'center' });
    pdf.text('Telefone: (44) 3000-0000', pageWidth / 2, 46, { align: 'center' });
    
    // Linha separadora
    pdf.line(margin, 55, pageWidth - margin, 55);
    
    // Título da receita
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECEITA MÉDICA', pageWidth / 2, 68, { align: 'center' });
    
    if (totalPages > 1) {
      pdf.setFontSize(10);
      pdf.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, 75, { align: 'right' });
    }
  };
  
  // Função para adicionar dados do paciente
  const addPatientInfo = (yPos: number) => {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DADOS DO PACIENTE:', margin, yPos);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nome: ${data.patient.nome}`, margin, yPos + 8);
    pdf.text(`CPF/Cartão SUS: ${data.patient.cpf}`, margin, yPos + 16);
    pdf.text(`Data de Nascimento: ${new Date(data.patient.data_nascimento).toLocaleDateString('pt-BR')}`, margin, yPos + 24);
    pdf.text(`Data da Receita: ${new Date(data.data).toLocaleDateString('pt-BR')}`, margin, yPos + 32);
    
    return yPos + 45;
  };
  
  // Função para adicionar medicamentos
  const addMedicines = (medicines: typeof data.medicines, yPos: number) => {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MEDICAMENTOS PRESCRITOS:', margin, yPos);
    
    let currentY = yPos + 12;
    
    medicines.forEach((medicine, index) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${medicine.nome} ${medicine.dosagem}`, margin + 5, currentY);
      currentY += 6;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`   Apresentação: ${medicine.apresentacao}`, margin + 5, currentY);
      currentY += 6;
      
      pdf.text(`   Posologia: ${medicine.posologia}`, margin + 5, currentY);
      currentY += 6;
      
      if (medicine.controlado) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('   *** MEDICAMENTO CONTROLADO ***', margin + 5, currentY);
        pdf.setFont('helvetica', 'normal');
        currentY += 6;
      }
      
      currentY += 3; // Espaço entre medicamentos
    });
    
    return currentY;
  };
  
  // Função para adicionar observações e assinatura
  const addFooter = (yPos: number) => {
    if (data.observacoes) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OBSERVAÇÕES:', margin, yPos);
      
      pdf.setFont('helvetica', 'normal');
      const observacoes = pdf.splitTextToSize(data.observacoes, pageWidth - 2 * margin);
      pdf.text(observacoes, margin, yPos + 8);
      yPos += 8 + (observacoes.length * lineHeight) + 10;
    }
    
    // Espaço para assinatura
    yPos = Math.max(yPos, pageHeight - 60);
    pdf.line(pageWidth / 2, yPos, pageWidth - margin, yPos);
    pdf.setFontSize(10);
    pdf.text('Assinatura e Carimbo do Médico', pageWidth / 2 + 10, yPos + 8);
    
    return yPos;
  };
  
  // Gerar receitas para múltiplos meses se especificado
  const months = data.months || 1;
  const totalPages = months;
  
  for (let month = 0; month < months; month++) {
    if (month > 0) {
      pdf.addPage();
    }
    
    // Calcular data para este mês
    const currentDate = new Date(data.data);
    currentDate.setMonth(currentDate.getMonth() + month);
    const monthData = { ...data, data: currentDate.toISOString().split('T')[0] };
    
    // Adicionar cabeçalho
    addHeader(month + 1, totalPages);
    
    // Adicionar dados do paciente
    let currentY = addPatientInfo(85);
    
    // Verificar se todos os medicamentos cabem na página
    const medicinesPerPage = Math.floor((pageHeight - currentY - 80) / (4 * lineHeight + 3));
    
    if (data.medicines.length <= medicinesPerPage) {
      // Todos os medicamentos cabem em uma página
      currentY = addMedicines(data.medicines, currentY);
      addFooter(currentY + 10);
    } else {
      // Dividir medicamentos em múltiplas páginas
      let medicineIndex = 0;
      let pageNum = 1;
      
      while (medicineIndex < data.medicines.length) {
        if (pageNum > 1) {
          pdf.addPage();
          addHeader(pageNum, Math.ceil(data.medicines.length / medicinesPerPage));
          currentY = 85;
        }
        
        const medicinesForThisPage = data.medicines.slice(
          medicineIndex,
          medicineIndex + medicinesPerPage
        );
        
        currentY = addMedicines(medicinesForThisPage, currentY);
        
        if (medicineIndex + medicinesPerPage >= data.medicines.length) {
          // Última página, adicionar footer
          addFooter(currentY + 10);
        }
        
        medicineIndex += medicinesPerPage;
        pageNum++;
      }
    }
  }
  
  // Salvar PDF usando comando Tauri
  const pdfData = pdf.output('arraybuffer');
  const uint8Array = new Uint8Array(pdfData);
  
  const filename = `Receita_${data.patient.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  try {
    const savedPath = await invoke('save_pdf', {
      data: Array.from(uint8Array),
      filename: filename
    });
    console.log('PDF salvo em:', savedPath);
  } catch (error) {
    console.error('Erro ao salvar PDF:', error);
    throw error;
  }
}