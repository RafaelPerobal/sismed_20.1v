// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;

use database::{Database, Patient, Medicine, Posology, Prescription, PrescriptionMedicine, PrescriptionWithMedicines};
use std::sync::Mutex;
use tauri::{Manager, State};

// Estado global da aplicação
struct AppState {
    db: Mutex<Database>,
}

// Comandos para Pacientes
#[tauri::command]
async fn get_patients(state: State<'_, AppState>) -> Result<Vec<Patient>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_patients().map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_patient(patient: Patient, state: State<'_, AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_patient(&patient).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_patient(id: i64, patient: Patient, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_patient(id, &patient).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_patient(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_patient(id).map_err(|e| e.to_string())
}

// Comandos para Medicamentos
#[tauri::command]
async fn get_medicines(state: State<'_, AppState>) -> Result<Vec<Medicine>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_medicines().map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_medicine(medicine: Medicine, state: State<'_, AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_medicine(&medicine).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_medicine(id: i64, medicine: Medicine, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_medicine(id, &medicine).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_medicine(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_medicine(id).map_err(|e| e.to_string())
}

// Comandos para Posologias
#[tauri::command]
async fn get_posologies(state: State<'_, AppState>) -> Result<Vec<Posology>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_posologies().map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_posology(posology: Posology, state: State<'_, AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_posology(&posology).map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_posology(id: i64, posology: Posology, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_posology(id, &posology).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_posology(id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_posology(id).map_err(|e| e.to_string())
}

// Comandos para Prescrições
#[tauri::command]
async fn get_prescriptions_by_patient(patient_id: i64, state: State<'_, AppState>) -> Result<Vec<Prescription>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_prescriptions_by_patient(patient_id).map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_prescription(prescription: Prescription, state: State<'_, AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_prescription(&prescription).map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_medicine_to_prescription(prescription_medicine: PrescriptionMedicine, state: State<'_, AppState>) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.add_medicine_to_prescription(&prescription_medicine).map_err(|e| e.to_string())
}

#[tauri::command]
async fn get_prescription_with_medicines(prescription_id: i64, state: State<'_, AppState>) -> Result<PrescriptionWithMedicines, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_prescription_with_medicines(prescription_id).map_err(|e| e.to_string())
}

// Comando para salvar PDF
#[tauri::command]
async fn save_pdf(data: Vec<u8>, filename: String) -> Result<String, String> {
    use tauri::api::dialog::FileDialogBuilder;
    
    let path = FileDialogBuilder::new()
        .set_title("Salvar Receita")
        .set_file_name(&filename)
        .add_filter("PDF", &["pdf"])
        .save_file();
    
    if let Some(path) = path {
        std::fs::write(&path, data).map_err(|e| e.to_string())?;
        Ok(path.to_string_lossy().to_string())
    } else {
        Err("Operação cancelada".to_string())
    }
}

// Comando para backup da base de dados
#[tauri::command]
async fn backup_database(state: State<'_, AppState>) -> Result<String, String> {
    use tauri::api::dialog::FileDialogBuilder;
    
    let path = FileDialogBuilder::new()
        .set_title("Fazer Backup dos Dados")
        .set_file_name("sismed_backup.db")
        .add_filter("Database", &["db"])
        .save_file();
    
    if let Some(path) = path {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let db_path = db.get_database_path().map_err(|e| e.to_string())?;
        
        std::fs::copy(&db_path, &path).map_err(|e| e.to_string())?;
        Ok(path.to_string_lossy().to_string())
    } else {
        Err("Operação cancelada".to_string())
    }
}

// Comando para restaurar base de dados
#[tauri::command]
async fn restore_database(state: State<'_, AppState>) -> Result<String, String> {
    use tauri::api::dialog::FileDialogBuilder;
    
    let path = FileDialogBuilder::new()
        .set_title("Restaurar Dados de um Backup")
        .add_filter("Database", &["db"])
        .pick_file();
    
    if let Some(path) = path {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let db_path = db.get_database_path().map_err(|e| e.to_string())?;
        
        std::fs::copy(&path, &db_path).map_err(|e| e.to_string())?;
        Ok("Dados restaurados com sucesso. Reinicie a aplicação.".to_string())
    } else {
        Err("Operação cancelada".to_string())
    }
}

fn main() {
    // Inicializar base de dados
    let database = Database::new().expect("Falha ao inicializar base de dados");
    
    tauri::Builder::default()
        .manage(AppState {
            db: Mutex::new(database),
        })
        .invoke_handler(tauri::generate_handler![
            get_patients,
            create_patient,
            update_patient,
            delete_patient,
            get_medicines,
            create_medicine,
            update_medicine,
            delete_medicine,
            get_posologies,
            create_posology,
            update_posology,
            delete_posology,
            get_prescriptions_by_patient,
            create_prescription,
            add_medicine_to_prescription,
            get_prescription_with_medicines,
            save_pdf,
            backup_database,
            restore_database
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}