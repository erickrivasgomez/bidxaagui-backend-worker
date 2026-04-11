import { Env } from '../types';
import { jsonResponse, errorResponse } from '../lib/utils';

// Interfaz para la solicitud que enviará el frontend (el prompt de la Dra.)
interface GenerateFormRequest {
    prompt: string;
    context?: string; // Info adicional sobre la práctica o el paciente
}

// Estructura esperada de la respuesta estructurada de Groq
interface StructuredQuestion {
    tipo: 'texto' | 'multiple_choice' | 'boolean_sino' | 'disclaimer';
    texto_pregunta: string;
    opciones?: string[];
    is_required: boolean;
}

interface StructuredForm {
    titulo: string;
    descripcion: string;
    preguntas: StructuredQuestion[];
}

export const generateFormWithAI = async (request: Request, env: Env): Promise<Response> => {
    try {
        if (!env.GROQ_API_KEY) {
            return errorResponse('La API Key de Groq no está configurada en el Worker.', 500, env);
        }

        const body = (await request.json()) as GenerateFormRequest;
        
        if (!body.prompt || body.prompt.trim() === '') {
            return errorResponse('El prompt no puede estar vacío.', 400, env);
        }

        const systemPrompt = `
Eres un asistente médico experto en Naturapatía, Ginecología Natural, Terapia Menstrual y Medicina Tradicional China.
Tu objetivo es ayudar a la doctora titular de Bidxaagui a generar cuestionarios (formularios) pre-consulta (Anamnesis) estructurados y "quirúrgicamente precisos" para sus pacientes.

REGLAS ESTRICTAS DE RESPUESTA:
1. DEBES retornar ÚNICAMENTE un objeto JSON válido, sin Markdown (\`\`\`json) y sin saludos ni texto adicional.
2. El JSON debe adherirse estrictamente a esta interfaz:
{
  "titulo": "Título profesional del cuestionario",
  "descripcion": "Breve descripción amistosa para el paciente de 1-2 líneas",
  "preguntas": [
    {
      "tipo": "texto" | "multiple_choice" | "boolean_sino" | "disclaimer",
      "texto_pregunta": "La pregunta clara y directa",
      "opciones": ["Opción A", "Opción B", "etc"], // SOLO incluir este campo si tipo es 'multiple_choice', NO incluirlo si es falso o vacío.
      "is_required": true | false
    }
  ]
}
3. Criterios de calidad: 
   - Siempre incluye preguntas sobre hábitos básicos (Digestión, Sueño, Emociones).
   - Indaga siempre por "Enfermedades crónicas o alergias" en modo texto.
   - El cuestionario SIEMPRE debe terminar con una última pregunta de tipo "disclaimer" obligatoria (is_required: true) que asegure que el paciente comprende que esta consulta holística/naturópata NO reemplaza diagnósticos médicos alópatas de urgencia.
        `;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile', // Modelo veloz, gratis y con gran contexto
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Crea un formulario basado en esto: ${body.prompt}\n\Contexto adicional (si aplica): ${body.context || 'Ninguno'}` }
                ],
                // Forzamos salida de JSON Object
                response_format: { type: 'json_object' },
                temperature: 0.3, // Temperatura baja para coherencia estructural
            })
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            console.error('Error desde Groq API:', errorDetails);
            return errorResponse('Error de comunicación con el motor de Inteligencia Artificial.', response.status, env);
        }

        const groqData: any = await response.json();
        const contentString = groqData.choices[0].message.content;
        
        let structuredData: StructuredForm;
        try {
            structuredData = JSON.parse(contentString);
        } catch (e) {
            console.error('Respuesta no era JSON válido:', contentString);
            return errorResponse('El agente devolvió un formato inválido. Reintenta.', 500, env);
        }

        return jsonResponse({
            success: true,
            data: structuredData
        }, 200, env);

    } catch (error: any) {
        console.error('Error generando form IA:', error);
        return errorResponse(error.message || 'Error interno en la generación del formulario', 500, env);
    }
};
