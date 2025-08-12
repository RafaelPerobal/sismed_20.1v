import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function initDatabase() {
  if (!db) {
    db = await Database.load('sqlite:sismed.db');
  }
  return db;
}

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

// Funções para Pacientes
export async function getPatients(): Promise<Patient[]> {
  const database = await initDatabase();
  return await database.select('SELECT * FROM patients ORDER BY nome');
}

export async function createPatient(patient: Omit<Patient, 'id'>): Promise<void> {
  const database = await initDatabase();
  const upperPatient = {
    ...patient,
    nome: patient.nome.toUpperCase(),
    cpf: patient.cpf.toUpperCase()
  };
  await database.execute(
    'INSERT INTO patients (nome, cpf, data_nascimento) VALUES (?, ?, ?)',
    [upperPatient.nome, upperPatient.cpf, upperPatient.data_nascimento]
  );
}

export async function updatePatient(id: number, patient: Omit<Patient, 'id'>): Promise<void> {
  const database = await initDatabase();
  const upperPatient = {
    ...patient,
    nome: patient.nome.toUpperCase(),
    cpf: patient.cpf.toUpperCase()
  };
  await database.execute(
    'UPDATE patients SET nome = ?, cpf = ?, data_nascimento = ? WHERE id = ?',
    [upperPatient.nome, upperPatient.cpf, upperPatient.data_nascimento, id]
  );
}

export async function deletePatient(id: number): Promise<void> {
  const database = await initDatabase();
  await database.execute('DELETE FROM patients WHERE id = ?', [id]);
}

// Funções para Medicamentos
export async function getMedicines(): Promise<Medicine[]> {
  const database = await initDatabase();
  return await database.select('SELECT * FROM medicines ORDER BY nome');
}

export async function createMedicine(medicine: Omit<Medicine, 'id'>): Promise<void> {
  const database = await initDatabase();
  const upperMedicine = {
    ...medicine,
    nome: medicine.nome.toUpperCase(),
    dosagem: medicine.dosagem.toUpperCase(),
    apresentacao: medicine.apresentacao.toUpperCase()
  };
  await database.execute(
    'INSERT INTO medicines (nome, dosagem, apresentacao, controlado) VALUES (?, ?, ?, ?)',
    [upperMedicine.nome, upperMedicine.dosagem, upperMedicine.apresentacao, upperMedicine.controlado]
  );
}

export async function updateMedicine(id: number, medicine: Omit<Medicine, 'id'>): Promise<void> {
  const database = await initDatabase();
  const upperMedicine = {
    ...medicine,
    nome: medicine.nome.toUpperCase(),
    dosagem: medicine.dosagem.toUpperCase(),
    apresentacao: medicine.apresentacao.toUpperCase()
  };
  await database.execute(
    'UPDATE medicines SET nome = ?, dosagem = ?, apresentacao = ?, controlado = ? WHERE id = ?',
    [upperMedicine.nome, upperMedicine.dosagem, upperMedicine.apresentacao, upperMedicine.controlado, id]
  );
}

export async function deleteMedicine(id: number): Promise<void> {
  const database = await initDatabase();
  await database.execute('DELETE FROM medicines WHERE id = ?', [id]);
}

// Funções para Posologias
export async function getPosologies(): Promise<Posology[]> {
  const database = await initDatabase();
  return await database.select('SELECT * FROM posologies ORDER BY texto');
}

export async function createPosology(posology: Omit<Posology, 'id'>): Promise<void> {
  const database = await initDatabase();
  const upperPosology = {
    ...posology,
    texto: posology.texto.toUpperCase()
  };
  await database.execute(
    'INSERT INTO posologies (texto) VALUES (?)',
    [upperPosology.texto]
  );
}

export async function updatePosology(id: number, posology: Omit<Posology, 'id'>): Promise<void> {
  const database = await initDatabase();
  const upperPosology = {
    ...posology,
    texto: posology.texto.toUpperCase()
  };
  await database.execute(
    'UPDATE posologies SET texto = ? WHERE id = ?',
    [upperPosology.texto, id]
  );
}

export async function deletePosology(id: number): Promise<void> {
  const database = await initDatabase();
  await database.execute('DELETE FROM posologies WHERE id = ?', [id]);
}

// Funções para Prescrições
export async function getPrescriptionsByPatient(patientId: number): Promise<Prescription[]> {
  const database = await initDatabase();
  return await database.select(
    'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY data DESC',
    [patientId]
  );
}

export async function createPrescription(prescription: Omit<Prescription, 'id'>): Promise<number> {
  const database = await initDatabase();
  const upperPrescription = {
    ...prescription,
    observacoes: prescription.observacoes?.toUpperCase()
  };
  const result = await database.execute(
    'INSERT INTO prescriptions (patient_id, data, observacoes) VALUES (?, ?, ?)',
    [upperPrescription.patient_id, upperPrescription.data, upperPrescription.observacoes]
  );
  return result.lastInsertId as number;
}

export async function addMedicineToPrescription(prescriptionMedicine: Omit<PrescriptionMedicine, 'id'>): Promise<void> {
  const database = await initDatabase();
  const upperPrescriptionMedicine = {
    ...prescriptionMedicine,
    posologia: prescriptionMedicine.posologia.toUpperCase()
  };
  await database.execute(
    'INSERT INTO prescription_medicines (prescription_id, medicine_id, posologia) VALUES (?, ?, ?)',
    [upperPrescriptionMedicine.prescription_id, upperPrescriptionMedicine.medicine_id, upperPrescriptionMedicine.posologia]
  );
}

export async function getPrescriptionMedicines(prescriptionId: number) {
  const database = await initDatabase();
  return await database.select(`
    SELECT pm.*, m.nome, m.dosagem, m.apresentacao, m.controlado
    FROM prescription_medicines pm
    JOIN medicines m ON pm.medicine_id = m.id
    WHERE pm.prescription_id = ?
  `, [prescriptionId]);
}