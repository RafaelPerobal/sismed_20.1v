use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::api::path;

#[derive(Debug, Serialize, Deserialize)]
pub struct Patient {
    pub id: Option<i64>,
    pub nome: String,
    pub cpf: String,
    pub data_nascimento: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Medicine {
    pub id: Option<i64>,
    pub nome: String,
    pub dosagem: String,
    pub apresentacao: String,
    pub controlado: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Posology {
    pub id: Option<i64>,
    pub texto: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Prescription {
    pub id: Option<i64>,
    pub patient_id: i64,
    pub data: String,
    pub observacoes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrescriptionMedicine {
    pub id: Option<i64>,
    pub prescription_id: i64,
    pub medicine_id: i64,
    pub posologia: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrescriptionWithMedicines {
    pub prescription: Prescription,
    pub medicines: Vec<PrescriptionMedicineDetail>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrescriptionMedicineDetail {
    pub id: Option<i64>,
    pub prescription_id: i64,
    pub medicine_id: i64,
    pub posologia: String,
    pub nome: String,
    pub dosagem: String,
    pub apresentacao: String,
    pub controlado: i32,
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        let app_data_dir = path::app_data_dir(&tauri::Config::default())
            .ok_or_else(|| rusqlite::Error::InvalidPath("Could not get app data dir".into()))?;
        
        std::fs::create_dir_all(&app_data_dir)
            .map_err(|e| rusqlite::Error::InvalidPath(format!("Could not create app data dir: {}", e).into()))?;
        
        let db_path = app_data_dir.join("sismed.db");
        let conn = Connection::open(db_path)?;
        
        let db = Database { conn };
        db.initialize_tables()?;
        db.insert_initial_data()?;
        
        Ok(db)
    }

    fn initialize_tables(&self) -> Result<()> {
        // Criar tabelas
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                cpf TEXT UNIQUE NOT NULL,
                data_nascimento TEXT NOT NULL
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS medicines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                dosagem TEXT,
                apresentacao TEXT,
                controlado INTEGER NOT NULL DEFAULT 0,
                UNIQUE(nome, dosagem, apresentacao)
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS posologies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                texto TEXT NOT NULL UNIQUE
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS prescriptions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                data TEXT NOT NULL,
                observacoes TEXT,
                FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
            )",
            [],
        )?;

        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS prescription_medicines (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prescription_id INTEGER NOT NULL,
                medicine_id INTEGER NOT NULL,
                posologia TEXT,
                FOREIGN KEY (prescription_id) REFERENCES prescriptions (id) ON DELETE CASCADE,
                FOREIGN KEY (medicine_id) REFERENCES medicines (id)
            )",
            [],
        )?;

        Ok(())
    }

    fn insert_initial_data(&self) -> Result<()> {
        // Verificar se já existem dados
        let count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM medicines",
            [],
            |row| row.get(0)
        )?;

        if count > 0 {
            return Ok(()); // Dados já inseridos
        }

        // Inserir medicamentos iniciais
        let medicines = vec![
            ("AMITRIPTILINA", "25MG", "COMPRIMIDO", 0),
            ("ÁCIDO VALPROICO", "250MG", "COMPRIMIDO", 0),
            ("ÁCIDO VALPROICO", "500MG", "COMPRIMIDO", 0),
            ("ÁCIDO VALPROICO", "50MG/ML", "SUSPENSÃO ORAL", 0),
            ("BIPERIDENO CLORIDRATO", "2MG", "COMPRIMIDO", 1),
            ("CARBAMAZEPINA", "200MG", "COMPRIMIDO", 0),
            ("CARBAMAZEPINA", "20MG/ML", "SUSPENSÃO", 0),
            ("CARBONATO DE LÍTIO", "300MG", "COMPRIMIDO", 1),
            ("CLOMIPRAMINA CLORIDRATO", "25MG", "COMPRIMIDO", 0),
            ("CLONAZEPAM", "2MG", "COMPRIMIDO", 1),
            ("CLONAZEPAM", "2.5MG/ML", "SOLUÇÃO ORAL", 1),
            ("CLORPROMAZINA CLORIDRATO", "25MG", "COMPRIMIDO", 1),
            ("CLORPROMAZINA CLORIDRATO", "100MG", "COMPRIMIDO", 1),
            ("DESVENLAFAXINA SUCCINATO", "50MG", "COMPRIMIDO", 0),
            ("DIAZEPAM", "5MG", "COMPRIMIDO", 1),
            ("DIAZEPAM", "10MG", "COMPRIMIDO", 1),
            ("ESCITALOPRAM", "10MG", "COMPRIMIDO", 0),
            ("FENITOÍNA SÓDICA", "100MG", "COMPRIMIDO", 1),
            ("FENOBARBITAL", "100MG", "COMPRIMIDO", 1),
            ("FENOBARBITAL", "40MG/ML", "SOLUÇÃO ORAL", 1),
            ("FLUOXETINA", "20MG", "CÁPSULA/COMPRIMIDO", 0),
            ("HALOPERIDOL", "1MG", "COMPRIMIDO", 1),
            ("HALOPERIDOL", "5MG", "COMPRIMIDO", 1),
            ("HALOPERIDOL", "2MG/ML", "SOLUÇÃO ORAL", 1),
            ("HALOPERIDOL DECANOATO", "50MG/ML", "SOLUÇÃO INJETÁVEL", 1),
            ("IMIPRAMINA CLORIDRATO", "25MG", "COMPRIMIDO", 0),
            ("LEVOMEPROMAZINA", "25MG", "COMPRIMIDO", 1),
            ("LEVOMEPROMAZINA", "100MG", "COMPRIMIDO", 1),
            ("MIRTAZAPINA", "30MG", "COMPRIMIDO", 0),
            ("NORTRIPTILINA CLORIDRATO", "25MG", "COMPRIMIDO", 0),
            ("OXCARBAZEPINA", "600MG", "COMPRIMIDO", 0),
            ("OXCARBAZEPINA", "60MG/ML", "SOLUÇÃO ORAL", 0),
            ("PAROXETINA CLORIDRATO", "20MG", "COMPRIMIDO", 0),
            ("PREGABALINA", "75MG", "COMPRIMIDO", 1),
            ("SERTRALINA CLORIDRATO", "50MG", "COMPRIMIDO", 0),
            ("VENLAFAXINA CLORIDRATO", "75MG", "COMPRIMIDO", 0),
        ];

        for (nome, dosagem, apresentacao, controlado) in medicines {
            self.conn.execute(
                "INSERT OR IGNORE INTO medicines (nome, dosagem, apresentacao, controlado) VALUES (?1, ?2, ?3, ?4)",
                params![nome, dosagem, apresentacao, controlado],
            )?;
        }

        // Inserir posologias padrão
        let posologies = vec![
            "1 COMPRIMIDO DE 8 EM 8 HORAS",
            "1 COMPRIMIDO DE 12 EM 12 HORAS",
            "1 COMPRIMIDO PELA MANHÃ",
            "1 COMPRIMIDO À NOITE",
            "1 COMPRIMIDO 3 VEZES AO DIA",
            "1 COMPRIMIDO EM JEJUM",
            "1 COMPRIMIDO APÓS AS REFEIÇÕES",
            "CONFORME ORIENTAÇÃO MÉDICA",
            "APLICAR 1 AMPOLA INTRAMUSCULAR",
            "APLICAR CONFORME NECESSÁRIO",
        ];

        for posology in posologies {
            self.conn.execute(
                "INSERT OR IGNORE INTO posologies (texto) VALUES (?1)",
                params![posology],
            )?;
        }

        Ok(())
    }

    // Métodos para Pacientes
    pub fn get_patients(&self) -> Result<Vec<Patient>> {
        let mut stmt = self.conn.prepare("SELECT id, nome, cpf, data_nascimento FROM patients ORDER BY nome")?;
        let patient_iter = stmt.query_map([], |row| {
            Ok(Patient {
                id: Some(row.get(0)?),
                nome: row.get(1)?,
                cpf: row.get(2)?,
                data_nascimento: row.get(3)?,
            })
        })?;

        let mut patients = Vec::new();
        for patient in patient_iter {
            patients.push(patient?);
        }
        Ok(patients)
    }

    pub fn create_patient(&self, patient: &Patient) -> Result<i64> {
        let nome_upper = patient.nome.to_uppercase();
        let cpf_upper = patient.cpf.to_uppercase();
        
        self.conn.execute(
            "INSERT INTO patients (nome, cpf, data_nascimento) VALUES (?1, ?2, ?3)",
            params![nome_upper, cpf_upper, patient.data_nascimento],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn update_patient(&self, id: i64, patient: &Patient) -> Result<()> {
        let nome_upper = patient.nome.to_uppercase();
        let cpf_upper = patient.cpf.to_uppercase();
        
        self.conn.execute(
            "UPDATE patients SET nome = ?1, cpf = ?2, data_nascimento = ?3 WHERE id = ?4",
            params![nome_upper, cpf_upper, patient.data_nascimento, id],
        )?;
        Ok(())
    }

    pub fn delete_patient(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM patients WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Métodos para Medicamentos
    pub fn get_medicines(&self) -> Result<Vec<Medicine>> {
        let mut stmt = self.conn.prepare("SELECT id, nome, dosagem, apresentacao, controlado FROM medicines ORDER BY nome")?;
        let medicine_iter = stmt.query_map([], |row| {
            Ok(Medicine {
                id: Some(row.get(0)?),
                nome: row.get(1)?,
                dosagem: row.get(2)?,
                apresentacao: row.get(3)?,
                controlado: row.get(4)?,
            })
        })?;

        let mut medicines = Vec::new();
        for medicine in medicine_iter {
            medicines.push(medicine?);
        }
        Ok(medicines)
    }

    pub fn create_medicine(&self, medicine: &Medicine) -> Result<i64> {
        let nome_upper = medicine.nome.to_uppercase();
        let dosagem_upper = medicine.dosagem.to_uppercase();
        let apresentacao_upper = medicine.apresentacao.to_uppercase();
        
        self.conn.execute(
            "INSERT INTO medicines (nome, dosagem, apresentacao, controlado) VALUES (?1, ?2, ?3, ?4)",
            params![nome_upper, dosagem_upper, apresentacao_upper, medicine.controlado],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn update_medicine(&self, id: i64, medicine: &Medicine) -> Result<()> {
        let nome_upper = medicine.nome.to_uppercase();
        let dosagem_upper = medicine.dosagem.to_uppercase();
        let apresentacao_upper = medicine.apresentacao.to_uppercase();
        
        self.conn.execute(
            "UPDATE medicines SET nome = ?1, dosagem = ?2, apresentacao = ?3, controlado = ?4 WHERE id = ?5",
            params![nome_upper, dosagem_upper, apresentacao_upper, medicine.controlado, id],
        )?;
        Ok(())
    }

    pub fn delete_medicine(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM medicines WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Métodos para Posologias
    pub fn get_posologies(&self) -> Result<Vec<Posology>> {
        let mut stmt = self.conn.prepare("SELECT id, texto FROM posologies ORDER BY texto")?;
        let posology_iter = stmt.query_map([], |row| {
            Ok(Posology {
                id: Some(row.get(0)?),
                texto: row.get(1)?,
            })
        })?;

        let mut posologies = Vec::new();
        for posology in posology_iter {
            posologies.push(posology?);
        }
        Ok(posologies)
    }

    pub fn create_posology(&self, posology: &Posology) -> Result<i64> {
        let texto_upper = posology.texto.to_uppercase();
        
        self.conn.execute(
            "INSERT INTO posologies (texto) VALUES (?1)",
            params![texto_upper],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn update_posology(&self, id: i64, posology: &Posology) -> Result<()> {
        let texto_upper = posology.texto.to_uppercase();
        
        self.conn.execute(
            "UPDATE posologies SET texto = ?1 WHERE id = ?2",
            params![texto_upper, id],
        )?;
        Ok(())
    }

    pub fn delete_posology(&self, id: i64) -> Result<()> {
        self.conn.execute("DELETE FROM posologies WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Métodos para Prescrições
    pub fn get_prescriptions_by_patient(&self, patient_id: i64) -> Result<Vec<Prescription>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, patient_id, data, observacoes FROM prescriptions WHERE patient_id = ?1 ORDER BY data DESC"
        )?;
        let prescription_iter = stmt.query_map(params![patient_id], |row| {
            Ok(Prescription {
                id: Some(row.get(0)?),
                patient_id: row.get(1)?,
                data: row.get(2)?,
                observacoes: row.get(3)?,
            })
        })?;

        let mut prescriptions = Vec::new();
        for prescription in prescription_iter {
            prescriptions.push(prescription?);
        }
        Ok(prescriptions)
    }

    pub fn create_prescription(&self, prescription: &Prescription) -> Result<i64> {
        let observacoes_upper = prescription.observacoes.as_ref().map(|s| s.to_uppercase());
        
        self.conn.execute(
            "INSERT INTO prescriptions (patient_id, data, observacoes) VALUES (?1, ?2, ?3)",
            params![prescription.patient_id, prescription.data, observacoes_upper],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn add_medicine_to_prescription(&self, prescription_medicine: &PrescriptionMedicine) -> Result<i64> {
        let posologia_upper = prescription_medicine.posologia.to_uppercase();
        
        self.conn.execute(
            "INSERT INTO prescription_medicines (prescription_id, medicine_id, posologia) VALUES (?1, ?2, ?3)",
            params![prescription_medicine.prescription_id, prescription_medicine.medicine_id, posologia_upper],
        )?;
        Ok(self.conn.last_insert_rowid())
    }

    pub fn get_prescription_medicines(&self, prescription_id: i64) -> Result<Vec<PrescriptionMedicineDetail>> {
        let mut stmt = self.conn.prepare(
            "SELECT pm.id, pm.prescription_id, pm.medicine_id, pm.posologia, 
                    m.nome, m.dosagem, m.apresentacao, m.controlado
             FROM prescription_medicines pm
             JOIN medicines m ON pm.medicine_id = m.id
             WHERE pm.prescription_id = ?1"
        )?;
        
        let medicine_iter = stmt.query_map(params![prescription_id], |row| {
            Ok(PrescriptionMedicineDetail {
                id: Some(row.get(0)?),
                prescription_id: row.get(1)?,
                medicine_id: row.get(2)?,
                posologia: row.get(3)?,
                nome: row.get(4)?,
                dosagem: row.get(5)?,
                apresentacao: row.get(6)?,
                controlado: row.get(7)?,
            })
        })?;

        let mut medicines = Vec::new();
        for medicine in medicine_iter {
            medicines.push(medicine?);
        }
        Ok(medicines)
    }

    pub fn get_prescription_with_medicines(&self, prescription_id: i64) -> Result<PrescriptionWithMedicines> {
        // Buscar prescrição
        let prescription: Prescription = self.conn.query_row(
            "SELECT id, patient_id, data, observacoes FROM prescriptions WHERE id = ?1",
            params![prescription_id],
            |row| {
                Ok(Prescription {
                    id: Some(row.get(0)?),
                    patient_id: row.get(1)?,
                    data: row.get(2)?,
                    observacoes: row.get(3)?,
                })
            }
        )?;

        // Buscar medicamentos da prescrição
        let medicines = self.get_prescription_medicines(prescription_id)?;

        Ok(PrescriptionWithMedicines {
            prescription,
            medicines,
        })
    }

    pub fn get_database_path(&self) -> Result<PathBuf> {
        let app_data_dir = path::app_data_dir(&tauri::Config::default())
            .ok_or_else(|| rusqlite::Error::InvalidPath("Could not get app data dir".into()))?;
        Ok(app_data_dir.join("sismed.db"))
    }
}