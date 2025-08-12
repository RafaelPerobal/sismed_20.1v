// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

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

#[tauri::command]
async fn backup_database() -> Result<String, String> {
    use tauri::api::dialog::FileDialogBuilder;
    
    let path = FileDialogBuilder::new()
        .set_title("Fazer Backup dos Dados")
        .set_file_name("sismed_backup.db")
        .add_filter("Database", &["db"])
        .save_file();
    
    if let Some(path) = path {
        let app_data_dir = tauri::api::path::app_data_dir(&tauri::Config::default()).unwrap();
        let db_path = app_data_dir.join("sismed.db");
        
        std::fs::copy(&db_path, &path).map_err(|e| e.to_string())?;
        Ok(path.to_string_lossy().to_string())
    } else {
        Err("Operação cancelada".to_string())
    }
}

#[tauri::command]
async fn restore_database() -> Result<String, String> {
    use tauri::api::dialog::FileDialogBuilder;
    
    let path = FileDialogBuilder::new()
        .set_title("Restaurar Dados de um Backup")
        .add_filter("Database", &["db"])
        .pick_file();
    
    if let Some(path) = path {
        let app_data_dir = tauri::api::path::app_data_dir(&tauri::Config::default()).unwrap();
        let db_path = app_data_dir.join("sismed.db");
        
        std::fs::copy(&path, &db_path).map_err(|e| e.to_string())?;
        Ok("Dados restaurados com sucesso. Reinicie a aplicação.".to_string())
    } else {
        Err("Operação cancelada".to_string())
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![save_pdf, backup_database, restore_database])
        .setup(|app| {
            // Inicializar banco de dados na primeira execução
            let app_handle = app.handle();
            tauri::async_runtime::spawn(async move {
                let _ = initialize_database(&app_handle).await;
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

async fn initialize_database(app: &tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    use tauri_plugin_sql::{Migration, MigrationKind};
    
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: include_str!("../migrations/001_initial.sql"),
            kind: MigrationKind::Up,
        }
    ];
    
    let _db = tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:sismed.db", migrations)
        .build()
        .initialize(app, "main".to_string(), None)
        .await?;
    
    Ok(())
}