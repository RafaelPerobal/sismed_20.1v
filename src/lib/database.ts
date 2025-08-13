import { invoke } from '@tauri-apps/api/tauri';

export interface Patient {
  id?: number;
  nome: string;
  cpf: string;
  data_nascimento: string;
}

export interface Medicine {
  id?: number;
  nome: string;
  dosagem: string;
  apresentacao: string;
  controlado: number;
}

export interface Posology {
  id?: number;
  texto: string;
}

export interface Prescription {
  id?: number;
  patient_id: number;
  data: string;
  observacoes?: string;
}

export interface PrescriptionMedicine {
  id?: number;
  prescription_id: number;
  medicine_id: number;
  posologia: string;
}

export interface PrescriptionMedicineDetail {
  id?: number;
  prescription_id: number;
  medicine_id: number;
  posologia: string;
  nome: string;
  dosagem: string;
  apresentacao: string;
  controlado: number;
}

export interface PrescriptionWithMedicines {
  prescription: Prescription;
  medicines: PrescriptionMedicineDetail[];
}

// Funções para Pacientes
export async function getPatients(): Promise<Patient[]> {
  return await invoke('get_patients');
}

export async function createPatient(patient: Omit<Patient, 'id'>): Promise<number> {
  return await invoke('create_patient', { patient });
}

export async function updatePatient(id: number, patient: Omit<Patient, 'id'>): Promise<void> {
  return await invoke('update_patient', { id, patient });
}

export async function deletePatient(id: number): Promise<void> {
  return await invoke('delete_patient', { id });
}

// Funções para Medicamentos
export async function getMedicines(): Promise<Medicine[]> {
  return await invoke('get_medicines');
}

export async function createMedicine(medicine: Omit<Medicine, 'id'>): Promise<number> {
  return await invoke('create_medicine', { medicine });
}

export async function updateMedicine(id: number, medicine: Omit<Medicine, 'id'>): Promise<void> {
  return await invoke('update_medicine', { id, medicine });
}

export async function deleteMedicine(id: number): Promise<void> {
  return await invoke('delete_medicine', { id });
}

// Funções para Posologias
export async function getPosologies(): Promise<Posology[]> {
  return await invoke('get_posologies');
}

export async function createPosology(posology: Omit<Posology, 'id'>): Promise<number> {
  return await invoke('create_posology', { posology });
}

export async function updatePosology(id: number, posology: Omit<Posology, 'id'>): Promise<void> {
  return await invoke('update_posology', { id, posology });
}

export async function deletePosology(id: number): Promise<void> {
  return await invoke('delete_posology', { id });
}

// Funções para Prescrições
export async function getPrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
  return await invoke('get_prescriptions_by_patient', { patientId });
}

export async function createPrescription(prescription: Omit<Prescription, 'id'>): Promise<number> {
  return await invoke('create_prescription', { prescription });
}

export async function addMedicineToPrescription(prescriptionMedicine: Omit<PrescriptionMedicine, 'id'>): Promise<number> {
  return await invoke('add_medicine_to_prescription', { prescriptionMedicine });
}

export async function getPrescriptionWithMedicines(prescriptionId: number): Promise<PrescriptionWithMedicines> {
  return await invoke('get_prescription_with_medicines', { prescriptionId });
}

// Funções para Backup e Restauro
export async function backupDatabase(): Promise<string> {
  return await invoke('backup_database');
}

export async function restoreDatabase(): Promise<string> {
  return await invoke('restore_database');
}