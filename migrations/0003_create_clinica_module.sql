-- migration: 0003_create_clinica_module
-- This migration creates the core tables for the Bidxaagui Naturopathic Clinic module.
-- Focus: Pacientes, Consultas, and Dynamic Forms (Questionnaires) with AI.

-- Módulo de Pacientes
CREATE TABLE IF NOT EXISTS pacientes (
    id TEXT PRIMARY KEY,
    nombre_completo TEXT NOT NULL,
    fecha_nacimiento TEXT,
    telefono TEXT,
    ocupacion TEXT,
    estado TEXT DEFAULT 'activo', -- 'activo', 'seguimiento', 'primera_vez'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Módulo de Consultas
CREATE TABLE IF NOT EXISTS consultas (
    id TEXT PRIMARY KEY,
    paciente_id TEXT NOT NULL,
    fecha_cita TEXT NOT NULL,
    motivo_principal TEXT,
    terapia_focal TEXT, -- Ej. Ginecología Natural, Iridología, Acupuntura
    diagnostico_naturista TEXT,
    notas_privadas TEXT,
    estado TEXT DEFAULT 'agendada', -- 'agendada', 'completada', 'cancelada'
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
);

-- Módulo de Formularios Dinámicos
CREATE TABLE IF NOT EXISTS forms (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    is_active INTEGER DEFAULT 1,
    is_ai_assisted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Preguntas para los Formularios Dinámicos
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    tipo TEXT NOT NULL, -- e.g. 'texto', 'multiple_choice', 'boolean_sino', 'disclaimer'
    texto_pregunta TEXT NOT NULL,
    opciones_json TEXT, -- Array stringificado para opciones (si aplica)
    is_required INTEGER DEFAULT 1,
    orden_aparicion INTEGER DEFAULT 0,
    FOREIGN KEY(form_id) REFERENCES forms(id) ON DELETE CASCADE
);

-- Respuestas a los Formularios (enviados o completados)
CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    paciente_id TEXT, -- Puede ser un paciente nuevo sin registrar aún, o vinculado.
    nombre_paciente_temp TEXT, -- Si no hay paciente_id asociado aún.
    respuestas_json TEXT NOT NULL, -- Object stringificado { "question_id": "respuesta_valor" }
    estado TEXT DEFAULT 'completado',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(form_id) REFERENCES forms(id) ON DELETE CASCADE,
    FOREIGN KEY(paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL
);
