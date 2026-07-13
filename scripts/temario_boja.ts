// Temario oficial FEA Oftalmología — SAS Andalucía (BOJA 2024), 107 temas.
// Parte común (1-25): legislación/gestión, no en el Kanski.
// Parte específica (26-107): oftalmología clínica, mapeada a capítulos del Kanski.
// Fuente única para seed_temario_oficial.ts y el preview del plan.

export interface SubtemaBoja {
  titulo: string;
  puntos: string[];
}
export interface TemaBoja {
  numero: number;
  titulo: string;
  parte: "comun" | "especifica";
  capitulo_kanski: string | null;
  subtemas: SubtemaBoja[];
}

export const TEMAS_COMUNES: TemaBoja[] = [
  { numero: 1, titulo: "Constitución Española 1978", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Valores superiores y principios", puntos: ["Libertad", "Justicia", "Igualdad", "Pluralismo político"] },
    { titulo: "Derechos fundamentales", puntos: ["Derecho a la vida", "Derecho a la integridad", "Derecho a la protección de la salud (art. 43)"] },
    { titulo: "Poderes del Estado", puntos: ["Jefatura del Estado", "Cortes Generales", "Gobierno", "Poder Judicial"] } ] },
  { numero: 2, titulo: "Estatuto de Autonomía de Andalucía", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Título Preliminar", puntos: ["Competencias de la Junta", "Principios generales"] },
    { titulo: "Título I — Derechos sociales", puntos: ["Derechos en materia de salud", "Deberes ciudadanos", "Políticas públicas sanitarias"] },
    { titulo: "Título II — Competencias en salud", puntos: ["Sanidad", "Farmacia", "Salud pública"] },
    { titulo: "Título IV — Organización institucional", puntos: ["Parlamento andaluz", "Consejo de Gobierno", "Defensor del Pueblo Andaluz"] } ] },
  { numero: 3, titulo: "Organización sanitaria I — Ley General de Sanidad", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Ley 14/1986 General de Sanidad", puntos: ["Principios generales", "Competencias de las AAPP", "Estructura del sistema sanitario público"] },
    { titulo: "Sistema Sanitario Público de Andalucía (SSPA)", puntos: ["Organización general", "Ley 2/1998 de Salud de Andalucía", "Derechos y deberes de los ciudadanos"] },
    { titulo: "Planificación sanitaria", puntos: ["Plan Andaluz de Salud", "Planes marco y Estrategias vigentes", "Contrato Programa"] } ] },
  { numero: 4, titulo: "Organización sanitaria II — Estructura SAS", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Consejería de Salud y SAS", puntos: ["Estructura y organización", "Competencias", "Atención Primaria", "Atención Especializada"] },
    { titulo: "Áreas de Gestión Sanitaria", puntos: ["Concepto y organización", "Hospitales públicos andaluces"] },
    { titulo: "Áreas de organización especial", puntos: ["Salud Mental", "Trasplantes", "Urgencias", "Red Andaluza de Medicina Transfusional", "Biobanco del SSPA"] } ] },
  { numero: 5, titulo: "Protección de datos y transparencia", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "LOPDGDD (LO 3/2018)", puntos: ["Disposiciones generales", "Principios de protección de datos", "Derechos de las personas (acceso, rectificación, supresión, portabilidad)"] },
    { titulo: "Ley 1/2014 de Transparencia de Andalucía", puntos: ["Principios básicos", "Publicidad activa", "Derecho de acceso a la información pública"] } ] },
  { numero: 6, titulo: "Prevención de riesgos laborales", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Ley 31/1995 de PRL", puntos: ["Derechos y obligaciones", "Consulta y participación de los trabajadores", "Principios de la acción preventiva"] },
    { titulo: "Organización de la PRL en el SAS", puntos: ["Unidades de Prevención en Centros Asistenciales", "Delegados de Prevención", "Comité de Seguridad y Salud"] } ] },
  { numero: 7, titulo: "Igualdad de género y violencia", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Ley 12/2007 de igualdad de género en Andalucía", puntos: ["Objeto y ámbito", "Principios generales", "Políticas públicas de igualdad"] },
    { titulo: "Ley 13/2007 contra la violencia de género", puntos: ["Objeto y ámbito", "Formación a profesionales de la salud", "Plan de igualdad de la Junta de Andalucía"] } ] },
  { numero: 8, titulo: "Estatuto Marco del personal estatutario", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Ley 55/2003 — Clasificación y derechos", puntos: ["Clasificación del personal estatutario", "Derechos y deberes", "Adquisición y pérdida de condición de fijo"] },
    { titulo: "Provisión, selección y carrera", puntos: ["Provisión de plazas", "Selección y promoción interna", "Movilidad", "Carrera profesional"] },
    { titulo: "Condiciones laborales", puntos: ["Retribuciones", "Jornadas, permisos y licencias", "Situaciones del personal", "Régimen disciplinario", "Incompatibilidades"] } ] },
  { numero: 9, titulo: "Autonomía del paciente y documentación clínica", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Ley 41/2002 — Principios generales", puntos: ["Derecho a la información sanitaria", "Derecho a la intimidad", "Consentimiento informado"] },
    { titulo: "Historia clínica", puntos: ["Definición y contenido", "Acceso a la historia clínica", "Custodia y conservación"] },
    { titulo: "Documentación clínica", puntos: ["Informe de alta", "Tarjeta sanitaria de Andalucía", "Voluntad anticipada"] } ] },
  { numero: 10, titulo: "TIC en el SAS y ciberseguridad", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Sistemas de información corporativos", puntos: ["Puesto de trabajo digital", "Ayuda Digital", "Historia Clínica Digital (Diraya)"] },
    { titulo: "Ciberseguridad", puntos: ["Principios de seguridad de la información", "Código de conducta TIC en la Junta de Andalucía"] } ] },
  { numero: 11, titulo: "Sistema Nacional de Salud", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Ley 16/2003 de cohesión y calidad del SNS", puntos: ["Disposiciones generales", "Prestaciones del SNS", "Profesionales del SNS", "Consejo Interterritorial"] },
    { titulo: "Indicadores del SNS", puntos: ["INCLASNS-BD", "Indicadores clave actualizados"] } ] },
  { numero: 12, titulo: "Salud Pública", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Ley de Salud Pública de Andalucía", puntos: ["Objeto y principios", "One Health — una sola salud", "AVISTA: Vigilancia y Respuesta en Salud Pública"] },
    { titulo: "Epidemiología básica", puntos: ["EDOs (Enfermedades de Declaración Obligatoria)", "Indicadores demográficos: mortalidad, morbilidad, incidencia, prevalencia", "Indicadores de salud: clasificación y utilidad"] } ] },
  { numero: 13, titulo: "Derechos y garantías de ciudadanos en el SSPA", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Cartera de servicios y garantías", puntos: ["Tiempos de respuesta asistencial", "Libre elección", "Segunda opinión médica"] },
    { titulo: "Derechos especiales", puntos: ["Derechos en el proceso de muerte", "Voluntad anticipada y Registro de VVA", "Derecho a la eutanasia en España y Andalucía"] },
    { titulo: "Derechos LGTBI y salud reproductiva", puntos: ["Ley para personas trans y LGTBI: medidas en salud", "Reproducción asistida e IVE"] } ] },
  { numero: 14, titulo: "Calidad en el sistema sanitario", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Plan de Calidad del SSPA", puntos: ["Instrumentos de evaluación y mejora continua", "Comisiones de Calidad y Grupos de Mejora"] },
    { titulo: "ACSA y modelo andaluz de calidad", puntos: ["Acreditación de centros, servicios y unidades", "Estrategia para la Seguridad del Paciente en Andalucía"] } ] },
  { numero: 15, titulo: "Formación y desarrollo profesional", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Ley 44/2003 de Ordenación de Profesiones Sanitarias", puntos: ["Formación Sanitaria Especializada (FSE)", "Plan Estratégico de Formación del SSPA"] },
    { titulo: "Desarrollo profesional en Andalucía", puntos: ["Modelo de Acreditación de Competencias Profesionales", "Modelo de Carrera Profesional en el SSPA"] } ] },
  { numero: 16, titulo: "Gestión sanitaria", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Conceptos básicos de gestión", puntos: ["Equidad, eficacia, eficiencia y efectividad", "Tipos de estudios de evaluación económica", "Financiación, gestión y provisión de servicios"] },
    { titulo: "Sistemas de información para la gestión", puntos: ["INFOWEB", "Base Poblacional de Salud (BPS)", "CMBD", "Contabilidad Analítica (COAN)", "Case-Mix", "CIE y CIAP"] } ] },
  { numero: 17, titulo: "Gestión clínica", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Evaluación de intervenciones", puntos: ["Beneficios, daños y costes", "Test diagnósticos y de cribado", "Guías de práctica clínica (GPC)", "GuiaSalud"] },
    { titulo: "Gestión por procesos", puntos: ["Procesos Asistenciales Integrados (PAIs)", "Mapa de Procesos del SSPA", "Historia Clínica Digital — Diraya", "Acuerdo de Gestión"] } ] },
  { numero: 18, titulo: "Educación y Promoción de la Salud", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Educación para la Salud", puntos: ["Conceptos básicos", "Estrategias y metodologías", "Intervención educativa desde la consulta", "El consejo médico"] },
    { titulo: "Promoción de la Salud", puntos: ["Sistemas de participación y empoderamiento del paciente", "Escuelas de pacientes", "Comunicación sanitaria"] } ] },
  { numero: 19, titulo: "Estadística para la gestión clínica", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Estadística descriptiva", puntos: ["Medidas de tendencia central y dispersión", "Error aleatorio", "Test de hipótesis", "Significación estadística"] },
    { titulo: "Análisis estadístico", puntos: ["Pruebas análisis bivariante", "Análisis multivariante", "Curvas de supervivencia"] } ] },
  { numero: 20, titulo: "Investigación en biomedicina", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Métodos y diseños de investigación", puntos: ["Principales diseños en investigación clínica y epidemiológica", "Sesgos y variables confundentes", "El protocolo de investigación"] },
    { titulo: "Nuevas áreas", puntos: ["Big-data en salud", "Inteligencia Artificial en atención sanitaria", "Comunicación y publicación científica"] } ] },
  { numero: 21, titulo: "Regulación ética y legal de la investigación", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Marco legal", puntos: ["Ley 14/2007 de investigación biomédica", "Regulación del acceso y uso de datos", "Instrucciones ordenación del acceso SSPA (Resolución 1/2021)"] },
    { titulo: "Estructuras de apoyo", puntos: ["Plataforma BIGDATA de la FPS", "Biobanco del SSPA", "Comités de Ética de la Investigación en Andalucía"] } ] },
  { numero: 22, titulo: "Medicina Basada en la Evidencia", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Búsqueda y lectura crítica", puntos: ["Búsqueda bibliográfica eficiente", "Lectura crítica de artículos científicos", "Revisiones sistemáticas y meta-análisis"] },
    { titulo: "Recursos de síntesis", puntos: ["GPC basadas en evidencia", "Recursos disponibles en el SSPA", "Biblioteca Virtual del SSPA"] } ] },
  { numero: 23, titulo: "Ética y profesionalismo médico", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Principios bioéticos", puntos: ["Autonomía", "Beneficencia", "No maleficencia", "Justicia", "Código Deontológico médico vigente"] },
    { titulo: "Herramientas y estructuras éticas", puntos: ["Análisis de conflictos éticos en la práctica clínica", "Humanización de la asistencia", "Comités de Ética Asistencial", "Responsabilidad profesional en el SAS"] } ] },
  { numero: 24, titulo: "El acto clínico", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Comunicación médico-paciente", puntos: ["La entrevista clínica", "Conceptos básicos de clinimetría", "Aplicación e interpretación de pruebas diagnósticas"] },
    { titulo: "Toma de decisiones", puntos: ["Medición de la Calidad de Vida Relacionada con la Salud", "Instrumentos para incorporar preferencias del paciente", "Toma compartida de decisiones"] } ] },
  { numero: 25, titulo: "Uso racional de medicamentos", parte: "comun", capitulo_kanski: null, subtemas: [
    { titulo: "Prescripción racional", puntos: ["Principios del uso racional del medicamento", "Prescripción por principio activo y genérico", "Herramientas para mejorar la adherencia terapéutica", "Receta electrónica"] },
    { titulo: "Gestión de medicamentos", puntos: ["PRM y polimedicación", "Informes de Posicionamiento Terapéutico (AEMPS)", "Visado", "Medicamentos ECM, DH y H", "Notificación de reacciones adversas (RAM)"] } ] },
];

export const TEMAS_ESPECIFICOS: TemaBoja[] = [
  { numero: 26, titulo: "Fundamentos del aparato visual", parte: "especifica", capitulo_kanski: "Cap. 1 — Anatomía", subtemas: [
    { titulo: "Embriología ocular", puntos: ["Desarrollo del ojo", "Malformaciones congénitas básicas"] },
    { titulo: "Anatomía del globo ocular", puntos: ["Capas del ojo", "Segmento anterior", "Segmento posterior", "Anejos oculares"] },
    { titulo: "Fisiología visual básica", puntos: ["Transducción visual", "Vía óptica básica", "Acomodación y convergencia"] },
    { titulo: "Microbiología y farmacología ocular básica", puntos: ["Flora ocular normal", "Antibióticos oftálmicos", "Antiinflamatorios tópicos"] },
    { titulo: "Genética humana básica", puntos: ["Herencia autosómica dominante y recesiva", "Herencia ligada al X", "Mitocondrial"] } ] },
  { numero: 27, titulo: "Óptica geométrica", parte: "especifica", capitulo_kanski: "Cap. 1 — Óptica", subtemas: [
    { titulo: "Principios de óptica", puntos: ["Reflexión y refracción", "Índice de refracción", "Lentes esféricas — potencia y distancia focal", "Lentes cilíndricas"] },
    { titulo: "Óptica del ojo", puntos: ["Modelo reducido del ojo", "Sistema óptico del ojo normal", "Prismas ópticos", "Emetropía"] },
    { titulo: "Acomodación", puntos: ["Mecanismo de acomodación", "Amplitud de acomodación", "Punto próximo y punto remoto"] } ] },
  { numero: 28, titulo: "Ametropías", parte: "especifica", capitulo_kanski: "Cap. 1 — Refracción", subtemas: [
    { titulo: "Hipermetropía", puntos: ["Definición y tipos", "Clínica", "Exploración", "Corrección"] },
    { titulo: "Miopía", puntos: ["Definición y tipos", "Clínica", "Exploración", "Corrección"] },
    { titulo: "Astigmatismo", puntos: ["Tipos de astigmatismo", "Clínica y diagnóstico", "Corrección"] },
    { titulo: "Presbicia", puntos: ["Fisiopatología", "Diagnóstico", "Corrección"] },
    { titulo: "Conceptos específicos", puntos: ["Afaquia y pseudofaquia", "Anisometropía", "Agudeza visual", "Equivalente esférico"] } ] },
  { numero: 29, titulo: "Corrección óptica de las ametropías", parte: "especifica", capitulo_kanski: "Cap. 1 — Refracción", subtemas: [
    { titulo: "Tipos de lentes correctoras", puntos: ["Meniscos", "Lenticulares", "Lentes orgánicas y de alto índice", "Prisma de Fresnel"] },
    { titulo: "Lentes especiales", puntos: ["Lentes multifocales", "Lentes de absorción", "Gafas de protección"] } ] },
  { numero: 30, titulo: "Lentes de contacto", parte: "especifica", capitulo_kanski: "Cap. 1 — Refracción", subtemas: [
    { titulo: "Materiales y tipos", puntos: ["Lentes RPG esféricas y tóricas", "Lentes de hidrogel esféricas y tóricas", "Lentes de uso prolongado y desechables", "Lentes terapéuticas", "Lentes esclerales"] },
    { titulo: "Complicaciones", puntos: ["Queratitis bacteriana", "Queratitis por Acanthamoeba", "Infiltrados y depósitos", "Conjuntivitis papilar gigante"] } ] },
  { numero: 31, titulo: "Cirugía refractiva I", parte: "especifica", capitulo_kanski: "Cap. 1 — Cirugía refractiva", subtemas: [
    { titulo: "Evaluación preoperatoria", puntos: ["Criterios de selección del paciente", "Topografía y tomografía corneal", "Aberrometría"] },
    { titulo: "Técnicas de ablación de superficie", puntos: ["PRK — queratectomía fotorrefractiva", "LASEK", "Epi-LASIK", "Queratotomías radial y astigmática", "PTK"] } ] },
  { numero: 32, titulo: "Cirugía refractiva II", parte: "especifica", capitulo_kanski: "Cap. 1 — Cirugía refractiva", subtemas: [
    { titulo: "LASIK y técnicas avanzadas", puntos: ["LASIK convencional", "LASIK guiado por frente de onda", "SMILE"] },
    { titulo: "Otras técnicas refractivas", puntos: ["Tratamiento quirúrgico de la presbicia", "Lentes intraoculares fáquicas", "Anillos intraestromales"] } ] },
  { numero: 33, titulo: "Oftalmología pediátrica I", parte: "especifica", capitulo_kanski: "Cap. 18 — Estrabismo", subtemas: [
    { titulo: "Desarrollo visual", puntos: ["Maduración del sistema visual", "Período crítico", "Agudeza visual según edad"] },
    { titulo: "Exploración visual pediátrica", puntos: ["Recién nacido y lactante", "Preescolar", "Escolar"] },
    { titulo: "Ambliopía", puntos: ["Definición y clasificación", "Ambliopía refractiva, estrábica y deprivacional", "Diagnóstico y tratamiento", "Profilaxis"] },
    { titulo: "Ametropías en pediatría", puntos: ["Refracción en niños", "Control de progresión de miopía", "Nuevos tratamientos (orthokeratología, atropina, lentes multifocales)"] } ] },
  { numero: 34, titulo: "Oftalmología pediátrica II", parte: "especifica", capitulo_kanski: "Cap. 18 — Pediatría", subtemas: [
    { titulo: "Malformaciones congénitas", puntos: ["Genéticas y embriopatías", "Anomalías congénitas de la córnea"] },
    { titulo: "Patologías frecuentes pediátricas", puntos: ["Distrofias retinianas en niños", "Alergia ocular pediátrica", "Queratocono infantil", "Rosácea ocular"] },
    { titulo: "Otras patologías pediátricas", puntos: ["Cataratas pediátricas", "Uveítis pediátricas (diagnóstico, tratamiento, seguimiento)", "Retinopatía de la prematuridad"] } ] },
  { numero: 35, titulo: "Glaucomas primarios en infancia", parte: "especifica", capitulo_kanski: "Cap. 10 — Glaucoma", subtemas: [
    { titulo: "Glaucoma congénito primario", puntos: ["Epidemiología", "Etiopatogenia", "Clínica: buftalmia, epifora, fotofobia", "Diagnóstico", "Tratamiento quirúrgico (goniotomía, trabeculotomía)"] },
    { titulo: "Glaucoma juvenil", puntos: ["Epidemiología", "Clínica", "Diagnóstico", "Tratamiento médico y quirúrgico"] } ] },
  { numero: 36, titulo: "Glaucomas secundarios en infancia", parte: "especifica", capitulo_kanski: "Cap. 10 — Glaucoma", subtemas: [
    { titulo: "Clasificación y etiología", puntos: ["Glaucoma asociado a anomalías oculares", "Glaucoma postinflamatorio", "Glaucoma post-traumático"] },
    { titulo: "Diagnóstico y tratamiento", puntos: ["Signos clínicos", "Pruebas diagnósticas", "Opciones terapéuticas"] } ] },
  { numero: 37, titulo: "Estrabismos", parte: "especifica", capitulo_kanski: "Cap. 18 — Estrabismo", subtemas: [
    { titulo: "Diagnóstico y clasificación", puntos: ["Cover test y variantes", "Estrabismos concomitantes vs no concomitantes", "Endotropias", "Exotropias e intermitentes"] },
    { titulo: "Estrabismos no concomitantes", puntos: ["Estrabismos paralíticos", "Estrabismos restrictivos", "CCDD (trastornos congénitos de denervación craneal)"] },
    { titulo: "Exploración y tratamiento", puntos: ["Versiones, ducciones y vergencias", "Tratamiento (oclusión, prismas, cirugía)", "Pseudoestrabismos", "Disfunciones acomodativas"] } ] },
  { numero: 38, titulo: "Otros trastornos oculomotores", parte: "especifica", capitulo_kanski: "Cap. 18 — Motilidad", subtemas: [
    { titulo: "Forias y vergencias", puntos: ["Forias: definición y tipos", "Alteraciones de la convergencia"] },
    { titulo: "Alteraciones de la mirada conjugada", puntos: ["Parálisis de la mirada conjugada horizontal", "Parálisis de la mirada conjugada vertical", "Trastornos internucleares y supranucleares"] },
    { titulo: "Nistagmus", puntos: ["Clasificación", "Nistagmus congénito", "Nistagmus adquirido", "Tratamiento"] } ] },
  { numero: 39, titulo: "Leucocorias", parte: "especifica", capitulo_kanski: "Cap. 18 — Pediatría", subtemas: [
    { titulo: "Etiología y diagnóstico diferencial", puntos: ["Retinoblastoma", "Catarata congénita", "Persistencia vítreo primario hiperplásico (PVPH)", "Retinopatía de la prematuridad", "Toxocariasis", "Enfermedad de Coats"] },
    { titulo: "Diagnóstico y tratamiento", puntos: ["Exploración de la leucocoria", "Pruebas de imagen", "Tratamiento según etiología"] } ] },
  { numero: 40, titulo: "Anatomía y exploración de la órbita", parte: "especifica", capitulo_kanski: "Cap. 3 — Órbita", subtemas: [
    { titulo: "Anatomía clínica de la órbita", puntos: ["Paredes orbitarias", "Contenido orbitario", "Relaciones anatómicas importantes"] },
    { titulo: "Métodos de exploración orbitaria", puntos: ["Exploración clínica: exoftalmometría, auscultación", "TC de órbita", "RMN de órbita", "Ecografía orbitaria"] } ] },
  { numero: 41, titulo: "Patología orbitaria", parte: "especifica", capitulo_kanski: "Cap. 3 — Órbita", subtemas: [
    { titulo: "Patología infecciosa e inflamatoria", puntos: ["Celulitis preseptal vs orbitaria", "Absceso subperióstico", "Pseudotumor inflamatorio orbitario", "Dacrioadenitis"] },
    { titulo: "Patología vascular", puntos: ["Fístula carótido-cavernosa", "Varices orbitarias", "Hemangiomas"] },
    { titulo: "Patología tumoral", puntos: ["Tumores benignos: dermoides, hemangioma cavernoso", "Tumores malignos: linfoma, metástasis, rabdomiosarcoma", "Mucoceles"] },
    { titulo: "Cirugía orbitaria", puntos: ["Enucleación", "Evisceración", "Exenteración orbitaria"] } ] },
  { numero: 42, titulo: "Anomalías palpebrales", parte: "especifica", capitulo_kanski: "Cap. 2 — Párpados", subtemas: [
    { titulo: "Anatomía clínica palpebral", puntos: ["Capas del párpado", "Músculo orbicular y elevador", "Placa tarsal y glándulas de Meibomio"] },
    { titulo: "Trastornos de la posición palpebral", puntos: ["Blefaroptosis: congénita y adquirida", "Entropión: congénito, involutivo, cicatricial, espástico", "Ectropión: involutivo, cicatricial, paralítico"] },
    { titulo: "Otros trastornos de la motilidad", puntos: ["Síndrome de retracción palpebral", "Lagoftalmos"] },
    { titulo: "Lesiones benignas palpebrales", puntos: ["Molusco contagioso", "Chalazión y orzuelo", "Xantelasma", "Papiloma", "Queratosis seborreica", "Tricoepitelioma"] },
    { titulo: "Patología tumoral maligna", puntos: ["Carcinoma basocelular", "Carcinoma espinocelular", "Melanoma palpebral", "Carcinoma sebáceo"] },
    { titulo: "Traumatismos palpebrales", puntos: ["Laceraciones palpebrales", "Avulsión palpebral", "Reparación quirúrgica"] } ] },
  { numero: 43, titulo: "Aparato lacrimal — glándula", parte: "especifica", capitulo_kanski: "Cap. 2 — Aparato lacrimal", subtemas: [
    { titulo: "Glándula lacrimal", puntos: ["Anatomía y fisiología", "Dacrioadenitis aguda y crónica", "Tumores de la glándula lacrimal", "Sarcoidosis y síndrome de Mikulicz"] } ] },
  { numero: 44, titulo: "Vías lacrimales", parte: "especifica", capitulo_kanski: "Cap. 2 — Aparato lacrimal", subtemas: [
    { titulo: "Fisiopatología y diagnóstico", puntos: ["Anatomía de las vías lacrimales", "Epífora: definición y causas", "Test de Jones I y II", "Dacriocistografía"] },
    { titulo: "Obstrucción de vías lacrimales", puntos: ["Obstrucción congénita: masaje y sondaje", "Dacriocistitis aguda", "Dacriocistitis crónica", "Obstrucción de puntos y canalículos"] },
    { titulo: "Tratamiento quirúrgico", puntos: ["DCR (dacriocistorrinostomía) externa y endoscópica", "Intubación bicanalicular"] } ] },
  { numero: 45, titulo: "Superficie ocular — conceptos", parte: "especifica", capitulo_kanski: "Cap. 5 — Córnea", subtemas: [
    { titulo: "Sistemas de defensa y regeneración", puntos: ["Concepto de superficie ocular", "Film lacrimal: capas y función", "Regeneración corneal y conjuntival", "Cicatrización de heridas corneales"] },
    { titulo: "Técnicas de imagen del segmento anterior", puntos: ["Microscopía especular", "Topografía corneal", "Tomografía de coherencia óptica del segmento anterior (OCT-SA)", "Microscopía confocal"] } ] },
  { numero: 46, titulo: "Inmunología ocular", parte: "especifica", capitulo_kanski: "Cap. 5 — Córnea", subtemas: [
    { titulo: "Mecanismos de defensa", puntos: ["Inmunidad innata en el ojo", "Inmunidad humoral ocular", "Inmunidad celular ocular"] },
    { titulo: "Mediadores inflamatorios", puntos: ["Citocinas en la superficie ocular", "Complemento", "Inmunoglobulinas lagrimales"] },
    { titulo: "Diagnóstico inmunológico", puntos: ["Estudios de laboratorio relevantes", "Anticuerpos ANA, ANCA, FR, HLA"] } ] },
  { numero: 47, titulo: "Patología del sistema palpebral — blefaritis", parte: "especifica", capitulo_kanski: "Cap. 5 — Superficie", subtemas: [
    { titulo: "Anatomofisiología del borde libre palpebral", puntos: ["Glándulas de Meibomio: función y disfunción", "Flora bacteriana normal del borde libre"] },
    { titulo: "Blefaritis", puntos: ["Blefaritis anterior: estafilocócica, seborreica", "Blefaritis posterior: disfunción de glándulas de Meibomio (DGM)", "Diagnóstico", "Tratamiento (higiene, tetraciclinas, omega-3)"] } ] },
  { numero: 48, titulo: "Alergia ocular", parte: "especifica", capitulo_kanski: "Cap. 5 — Superficie", subtemas: [
    { titulo: "Mecanismos patogénicos", puntos: ["Hipersensibilidad tipo I (IgE)", "Hipersensibilidad tipo IV (linfocitos T)", "Mediadores: histamina, leucotrienos"] },
    { titulo: "Formas clínicas", puntos: ["Conjuntivitis alérgica estacional", "Conjuntivitis alérgica perenne", "Queratoconjuntivitis vernal (primaveral)", "Queratoconjuntivitis atópica", "Conjuntivitis papilar gigante", "Dermatoconjuntivitis alérgica"] },
    { titulo: "Diagnóstico y tratamiento", puntos: ["Exploración: cobblestone, papilas gigantes", "Antihistamínicos tópicos y sistémicos", "Cromoglicato", "Corticoides tópicos"] } ] },
  { numero: 49, titulo: "Ojo seco", parte: "especifica", capitulo_kanski: "Cap. 5 — Superficie", subtemas: [
    { titulo: "Fisiopatología y clasificación", puntos: ["Film lacrimal normal", "Ojo seco evaporativo vs acuodeficiente", "TFOS DEWS II: nueva clasificación"] },
    { titulo: "Exploración del film lacrimal", puntos: ["BUT (Break-Up Time)", "Test de Schirmer I y II", "Tinción con rosa de Bengala y verde lisamina", "Osmolaridad lagrimal"] },
    { titulo: "Formas clínicas y tratamiento", puntos: ["Ojo seco leve, moderado y severo", "Lágrimas artificiales", "Ciclosporina tópica", "Oclusión de puntos lagrimales", "Otros tratamientos"] } ] },
  { numero: 50, titulo: "Síndromes secos especiales", parte: "especifica", capitulo_kanski: "Cap. 5 — Superficie", subtemas: [
    { titulo: "Síndrome de Sjögren", puntos: ["Primario vs secundario", "Criterios diagnósticos", "Manifestaciones oculares", "Tratamiento"] },
    { titulo: "Situaciones especiales de ojo seco", puntos: ["Ojo seco y pantallas de visualización (VDT)", "Ojo seco y cirugía refractiva", "Enfermedad de injerto contra huésped (EICH)"] } ] },
  { numero: 51, titulo: "Síndromes mucocutáneos", parte: "especifica", capitulo_kanski: "Cap. 5 — Superficie", subtemas: [
    { titulo: "Penfigoide", puntos: ["Penfigoide cicatricial ocular", "Penfigoide de las membranas mucosas", "Diagnóstico (biopsia e inmunofluorescencia)", "Tratamiento sistémico"] } ] },
  { numero: 52, titulo: "Conjuntivitis no infecciosas especiales", parte: "especifica", capitulo_kanski: "Cap. 5 — Conjuntiva", subtemas: [
    { titulo: "Síndromes tóxicos y autoinmunes", puntos: ["Conjuntivitis folicular tóxica", "Síndrome de Stevens-Johnson", "Necrólisis tóxica epidérmica (NET)", "Epidermólisis bullosa"] },
    { titulo: "Otras conjuntivitis no infecciosas", puntos: ["Xeroderma pigmentosa", "Conjuntivitis leñosa"] } ] },
  { numero: 53, titulo: "Infecciones de la superficie", parte: "especifica", capitulo_kanski: "Cap. 5 — Conjuntiva", subtemas: [
    { titulo: "Defensa e inflamación", puntos: ["Mecanismos de defensa de la conjuntiva", "Respuesta inflamatoria conjuntival"] },
    { titulo: "Conjuntivitis bacterianas", puntos: ["Gonocócica", "Estreptocócica y estafilocócica", "Por Chlamydia (tracoma y conjuntivitis de inclusión)"] },
    { titulo: "Conjuntivitis virales", puntos: ["Adenoviral: fiebre faringoconjuntival y queratoconjuntivitis epidémica", "Herpética", "Molluscum contagiosum"] },
    { titulo: "Conjuntivitis micóticas y parasitarias", puntos: ["Fúngicas", "Parasitarias (larva migrans, filariasis)", "Conjuntivitis neonatal (oftalmía neonatorum)"] } ] },
  { numero: 54, titulo: "Queratitis infecciosas", parte: "especifica", capitulo_kanski: "Cap. 6 — Córnea", subtemas: [
    { titulo: "Queratitis bacterianas", puntos: ["Patógenos frecuentes: Pseudomonas, Staphylococcus, Streptococcus", "Úlcera corneal bacteriana: clínica y diagnóstico", "Tratamiento antibiótico tópico"] },
    { titulo: "Queratitis micóticas", puntos: ["Filamentosas (Fusarium, Aspergillus) vs levaduriformes (Candida)", "Factores de riesgo", "Diagnóstico (raspado, cultivo)", "Tratamiento antimicótico"] },
    { titulo: "Queratitis parasitarias", puntos: ["Queratitis por Acanthamoeba", "Microsporidiasis corneal"] },
    { titulo: "Queratitis virales", puntos: ["Herpes simplex: epitelial, estromal y endotelial", "Herpes varicela-zoster: HZO", "Queratitis adenoviral", "Queratitis por CMV"] } ] },
  { numero: 55, titulo: "Queratitis no infecciosas", parte: "especifica", capitulo_kanski: "Cap. 6 — Córnea", subtemas: [
    { titulo: "Queratitis específicas", puntos: ["Queratitis puntata superficial de Thygeson", "Queratoconjuntivitis límbica superior (Theodore)", "Úlcera de Mooren"] },
    { titulo: "Queratitis neurotróficas", puntos: ["Anestesia corneal: causas", "Clasificación Mackie", "Tratamiento"] },
    { titulo: "Degeneraciones corneales periféricas", puntos: ["Degeneración marginal de Terrien", "Síndrome de párpado flácido (FES)"] } ] },
  { numero: 56, titulo: "Degeneraciones, distrofias y tumores corneales", parte: "especifica", capitulo_kanski: "Cap. 6 — Córnea", subtemas: [
    { titulo: "Degeneraciones corneales", puntos: ["Arco corneal (gerontoxon)", "Queratopatía en banda", "Degeneración nodular de Salzmann", "Pterigium"] },
    { titulo: "Distrofias corneales", puntos: ["Distrofias del epitelio y membrana de Bowman", "Distrofias estromales: granular, macular, reticular", "Distrofias del endotelio: Fuchs, PPCD"] },
    { titulo: "Ectasias corneales", puntos: ["Queratocono: estadios y diagnóstico", "Degeneración marginal pelúcida", "Queratoglobo"] },
    { titulo: "Tumores conjuntivales y corneales", puntos: ["Neoplasia escamosa de superficie ocular (OSSN)", "Melanoma conjuntival", "Linfoma conjuntival"] } ] },
  { numero: 57, titulo: "Cirugía de la superficie ocular I", parte: "especifica", capitulo_kanski: "Cap. 6 — Córnea", subtemas: [
    { titulo: "Cirugía conjuntival", puntos: ["Simblefaron: tratamiento", "Colgajos y trasplantes conjuntivales", "Cirugía del pterigium"] },
    { titulo: "Reconstrucción de la superficie ocular", puntos: ["Transplante de membrana amniótica (MAT)", "Transplante de células madre límbicas", "Tratamiento del adelgazamiento corneal", "Perforación corneal: manejo"] } ] },
  { numero: 58, titulo: "Cirugía de la superficie ocular II — Queratoplastias", parte: "especifica", capitulo_kanski: "Cap. 6 — Córnea", subtemas: [
    { titulo: "Banco de ojos y selección del donante", puntos: ["Criterios de selección del donante", "Preservación del tejido corneal", "Estudio endotelial del donante"] },
    { titulo: "Queratoplastia penetrante (KP)", puntos: ["Indicaciones", "Técnica quirúrgica", "Complicaciones", "Seguimiento y rechazo"] },
    { titulo: "Queratoplastia endotelial", puntos: ["DSAEK (queratoplastia endotelial automatizada)", "DMEK (queratoplastia endotelial de membrana de Descemet)", "Ventajas sobre la KP"] },
    { titulo: "Queratoplastia lamelar anterior", puntos: ["DALK (queratoplastia lamelar anterior profunda)", "Indicaciones (queratocono, distrofias estromales)"] },
    { titulo: "Técnicas especiales", puntos: ["Cross-linking corneal (CXL)", "Córnea artificial (queratoprótesis): Boston KPro"] } ] },
  { numero: 59, titulo: "Epiescleritis", parte: "especifica", capitulo_kanski: "Cap. 7 — Esclera", subtemas: [
    { titulo: "Anatomofisiología de la esclera", puntos: ["Estructura de la esclera", "Irrigación e inervación"] },
    { titulo: "Epiescleritis", puntos: ["Simple vs nodular", "Clínica y diagnóstico", "Relación con enfermedades sistémicas", "Tratamiento"] } ] },
  { numero: 60, titulo: "Escleritis", parte: "especifica", capitulo_kanski: "Cap. 7 — Esclera", subtemas: [
    { titulo: "Escleritis inflamatoria", puntos: ["Anterior: difusa, nodular, necrotizante", "Posterior: clínica y diagnóstico por imagen", "Enfermedades sistémicas asociadas: AR, Wegener, LES"] },
    { titulo: "Escleritis infecciosa", puntos: ["Bacteriana (Pseudomonas)", "Viral (HZO)", "Micótica"] },
    { titulo: "Enfermedades no inflamatorias", puntos: ["Escleritis difusa benigna", "Tratamiento sistémico: AINE, corticoides, inmunosupresores"] } ] },
  { numero: 61, titulo: "Fisiopatología y clasificación de las uveítis", parte: "especifica", capitulo_kanski: "Cap. 11 — Úvea", subtemas: [
    { titulo: "Anatomía de la úvea", puntos: ["Iris", "Cuerpo ciliar", "Coroides"] },
    { titulo: "Fisiopatología e inmunología", puntos: ["Mecanismos inmunológicos en las uveítis", "Barrera hemato-ocular", "Clasificación SUN (Standardization of Uveitis Nomenclature)"] },
    { titulo: "Signos y síntomas", puntos: ["Precipitados queráticos", "Tyndall y flare", "Synechias", "Vitritis", "Exudados retinianos"] } ] },
  { numero: 62, titulo: "Uveítis anterior", parte: "especifica", capitulo_kanski: "Cap. 11 — Úvea", subtemas: [
    { titulo: "Uveítis anteriores infecciosas", puntos: ["Herpética (CMV, HSV, VZV)", "Sifilítica"] },
    { titulo: "Uveítis anteriores asociadas a HLA-B27", puntos: ["Espondilitis anquilosante", "Artritis reactiva", "Enfermedad inflamatoria intestinal", "Psoriasis"] },
    { titulo: "Otras uveítis anteriores", puntos: ["AIJ (artritis idiopática juvenil)", "Nefritis túbulo-intersticial (TINU)", "Sarcoidosis", "Síndrome de Fuchs (heterocromia de Fuchs)", "Uveítis inducidas por el cristalino"] } ] },
  { numero: 63, titulo: "Uveítis intermedia", parte: "especifica", capitulo_kanski: "Cap. 11 — Úvea", subtemas: [
    { titulo: "Pars planitis", puntos: ["Clínica: snowballs y snowbank", "Diagnóstico", "Tratamiento"] },
    { titulo: "Uveítis intermedias asociadas a enfermedades sistémicas", puntos: ["Uveítis intermedia sifilítica", "Asociada a esclerosis múltiple", "Asociada a sarcoidosis"] } ] },
  { numero: 64, titulo: "Uveítis posterior", parte: "especifica", capitulo_kanski: "Cap. 11 — Úvea", subtemas: [
    { titulo: "Infecciosas", puntos: ["Toxoplasmosis ocular: clínica y tratamiento", "Necrosis retiniana aguda (ARN)", "Sífilis", "Tuberculosis ocular", "Citomegalovirus: retinitis por CMV en inmunodeprimidos", "Toxocariasis", "Histoplasmosis ocular", "Otras infecciones fúngicas"] },
    { titulo: "No infecciosas", puntos: ["Sarcoidosis ocular posterior", "White Dot Syndromes: MEWDS, APMPPE, coroiditis multifocal, punctate inner choroidopathy"] } ] },
  { numero: 65, titulo: "Panuveítis y endoftalmitis", parte: "especifica", capitulo_kanski: "Cap. 11 — Úvea", subtemas: [
    { titulo: "Panuveítis infecciosas", puntos: ["Sifilítica", "Tuberculosa"] },
    { titulo: "Panuveítis asociadas a enfermedades sistémicas", puntos: ["Sarcoidosis", "Enfermedad de Behçet: criterios diagnósticos y tratamiento", "Síndrome de Vogt-Koyanagi-Harada (VKH)"] },
    { titulo: "Panuveítis limitadas al ojo", puntos: ["Oftalmía simpática: patogenia, prevención y tratamiento", "Síndromes mascarada", "Endoftalmitis endógena"] } ] },
  { numero: 66, titulo: "Anomalías del cristalino", parte: "especifica", capitulo_kanski: "Cap. 9 — Cristalino", subtemas: [
    { titulo: "Luxación y subluxación del cristalino", puntos: ["Causas: síndrome de Marfan, homocistinuria, síndrome de Weill-Marchesani, trauma", "Clínica y diagnóstico", "Tratamiento"] } ] },
  { numero: 67, titulo: "Cataratas I", parte: "especifica", capitulo_kanski: "Cap. 9 — Cristalino", subtemas: [
    { titulo: "Epidemiología y fisiopatología", puntos: ["Incidencia mundial", "Mecanismos de opacificación del cristalino", "Factores de riesgo: UV, tabaco, diabetes, corticoides"] },
    { titulo: "Clasificación morfológica", puntos: ["Nuclear", "Cortical", "Subcapsular posterior", "Sistema LOCS III"] },
    { titulo: "Efectos visuales", puntos: ["Pérdida de AV", "Deslumbramiento", "Diplopia monocular", "Miopización"] } ] },
  { numero: 68, titulo: "Cataratas II — cirugía", parte: "especifica", capitulo_kanski: "Cap. 9 — Cristalino", subtemas: [
    { titulo: "Lentes intraoculares (LIO)", puntos: ["Óptica de las LIO", "Fórmulas de cálculo (IOL Master, biometría óptica)", "Tipos de LIO: monofocales, tóricas, multifocales, EDF"] },
    { titulo: "Técnicas quirúrgicas", puntos: ["Facoemulsificación", "SICS (cirugía de pequeña incisión sin faco)", "Cirugía asistida por láser femtosegundo (FLACS)", "Extracción extracapsular manual (ECCE)"] },
    { titulo: "Complicaciones", puntos: ["Intraoperatorias: rotura cápsula posterior, prolapso vítreo", "Postoperatorias tempranas: edema corneal, hipertensión ocular, uveítis", "Catarata secundaria (opacificación de cápsula posterior): YAG láser"] },
    { titulo: "Aspectos especiales", puntos: ["Anestesia para cirugía de cataratas", "Fluidica de la facoemulsificación", "Aspectos refractivos", "Ojos complejos", "Cirugía pediátrica", "Procedimientos combinados"] } ] },
  { numero: 69, titulo: "Concepto y epidemiología del glaucoma", parte: "especifica", capitulo_kanski: "Cap. 10 — Glaucoma", subtemas: [
    { titulo: "Definición y epidemiología", puntos: ["Concepto de glaucoma", "Hipertensión ocular (HTO)", "Sospecha de glaucoma", "Epidemiología mundial y en España"] },
    { titulo: "Patofisiología", puntos: ["Teoría mecánica vs vascular", "Daño de fibras nerviosas retinianas", "Disfunción de células ganglionares"] },
    { titulo: "Indicaciones terapéuticas", puntos: ["Cuándo tratar HTO", "Objetivos de PIO", "Factores de riesgo de progresión"] } ] },
  { numero: 70, titulo: "Diagnóstico del glaucoma", parte: "especifica", capitulo_kanski: "Cap. 10 — Glaucoma", subtemas: [
    { titulo: "Tonometría y paquimetría", puntos: ["Goldmann (patrón oro)", "Tonómetros de rebote (iCare)", "Tono ocular normal y corrección por paquimetría", "Medición del espesor corneal central"] },
    { titulo: "Gonioscopia", puntos: ["Técnica", "Clasificación de Shaffer y Spaeth", "Anatomía del ángulo camerular", "Diferenciación ángulo abierto vs cerrado"] },
    { titulo: "Evaluación de la papila óptica", puntos: ["Relación C/D", "Signos de daño glaucomatoso: muescas, hemorragias de disco, adelgazamiento de RNFL", "Fotografía de disco"] },
    { titulo: "Perimetría", puntos: ["Campo visual de Humphrey (estrategia SITA)", "Hallazgos perimétricos en glaucoma: escalón nasal, depresión arcuata, punto ciego ampliado", "MD, PSD, GHT"] },
    { titulo: "OCT en glaucoma", puntos: ["OCT de capa de fibras nerviosas retinianas (RNFL)", "OCT de complejo de células ganglionares", "OCT de cabeza del nervio óptico"] } ] },
  { numero: 71, titulo: "Glaucoma primario de ángulo abierto", parte: "especifica", capitulo_kanski: "Cap. 10 — Glaucoma", subtemas: [
    { titulo: "GPAA — diagnóstico", puntos: ["Criterios diagnósticos", "Evaluación diagnóstica completa", "PIO objetivo"] },
    { titulo: "Tratamiento médico", puntos: ["Prostaglandinas: mecanismo y fármacos", "Betabloqueantes: mecanismo y contraindicaciones", "Inhibidores de la anhidrasa carbónica", "Alfa-agonistas", "Mióticos", "Rho-kinasa inhibidores (Netarsudil)"] },
    { titulo: "Tratamiento con láser", puntos: ["Trabeculoplastia con láser argón (ALT)", "Trabeculoplastia selectiva con láser (SLT)"] },
    { titulo: "Tratamiento quirúrgico", puntos: ["Trabeculectomía: técnica y antimetabolitos", "Dispositivos de drenaje (Ahmed, Baerveldt)", "Cirugía mínimamente invasiva (MIGS): iStent, Hydrus, XEN"] },
    { titulo: "Glaucoma normotensional", puntos: ["Definición", "Patogenia (componente vascular)", "Diagnóstico diferencial", "Tratamiento"] } ] },
  { numero: 72, titulo: "Glaucoma primario por cierre angular", parte: "especifica", capitulo_kanski: "Cap. 10 — Glaucoma", subtemas: [
    { titulo: "Fisiopatología", puntos: ["Bloqueo pupilar relativo", "Iris plateau", "Factores anatómicos predisponentes"] },
    { titulo: "Formas clínicas", puntos: ["Sospecha de cierre angular", "Cierre angular primario (sin daño glaucomatoso)", "Glaucoma por cierre angular (con daño glaucomatoso)", "Crisis aguda de glaucoma"] },
    { titulo: "Tratamiento", puntos: ["Iridotomía periférica con láser YAG", "Iridoplastia láser argón", "Facoemulsificación para resolver el bloqueo", "Cirugía combinada (faco-trabeculectomía)"] } ] },
  { numero: 73, titulo: "Glaucomas secundarios", parte: "especifica", capitulo_kanski: "Cap. 10 — Glaucoma", subtemas: [
    { titulo: "Por anomalías del segmento anterior", puntos: ["Glaucoma pseudoexfoliativo (PEX)", "Glaucoma pigmentario"] },
    { titulo: "Por enfermedades oculares", puntos: ["Glaucoma neovascular: retinopatía diabética, oclusión de vena central", "Glaucoma inflamatorio", "Glaucoma inducido por corticosteroides"] },
    { titulo: "Otros glaucomas secundarios", puntos: ["Asociado a traumatismos (recesión angular, hifema)", "Por aumento de la presión venosa episcleral (fístula carótido-cavernosa)", "Glaucoma maligno (aqueous misdirection)"] } ] },
  { numero: 74, titulo: "Técnicas de exploración vítreo-retinianas", parte: "especifica", capitulo_kanski: "Cap. 13 — Retina", subtemas: [
    { titulo: "Técnicas de imagen funcional", puntos: ["Autofluorescencia (AF)", "Angiografía fluoresceínica (AFG): fases y hallazgos normales", "Angiografía con indocianina verde (ICG): coroide"] },
    { titulo: "OCT y AngioOCT", puntos: ["OCT de dominio espectral", "OCT-A (angio-OCT): sin contraste", "Exploración multimodal"] },
    { titulo: "Otras técnicas", puntos: ["Ecografía ocular modo A y B", "Electrofisiología: ERG, PEV, EOG", "Microperimetría"] } ] },
  { numero: 75, titulo: "Anomalías congénitas y hereditarias de retina", parte: "especifica", capitulo_kanski: "Cap. 14 — Retina hereditaria", subtemas: [
    { titulo: "Facomatosis", puntos: ["Neurofibromatosis tipo 1 y 2", "Esclerosis tuberosa", "Angiomatosis retino-cerebelosa (Von Hippel-Lindau)", "Síndrome de Sturge-Weber"] },
    { titulo: "Otras anomalías congénitas", puntos: ["Colobomas", "Mielinización de fibras nerviosas", "Drusen del nervio óptico"] } ] },
  { numero: 76, titulo: "Retinopatía diabética", parte: "especifica", capitulo_kanski: "Cap. 13 — Retina", subtemas: [
    { titulo: "Patogenia", puntos: ["Microangiopatía diabética", "Acumulación de sorbitol", "Glicosilación de proteínas", "VEGF y neovascularización"] },
    { titulo: "Clasificación y clínica", puntos: ["RDNP leve, moderada y severa (regla 4-2-1)", "RDP: neovascularización, hemorragia vítrea, DR traccional", "Edema macular diabético (EMD): focal vs difuso"] },
    { titulo: "Tratamiento", puntos: ["Fotocoagulación panretiniana (PRP)", "Inyecciones intravítreas de anti-VEGF (ranibizumab, aflibercept, bevacizumab)", "Implante de dexametasona", "Vitrectomía"] },
    { titulo: "Otras manifestaciones oculares diabéticas", puntos: ["Cataratas diabéticas", "Parálisis de pares craneales", "Glaucoma neovascular"] } ] },
  { numero: 77, titulo: "Patología vascular retiniana", parte: "especifica", capitulo_kanski: "Cap. 13 — Retina", subtemas: [
    { titulo: "Oclusiones vasculares", puntos: ["OACR: clínica, etiología y tratamiento", "OVCR: isquémica vs no isquémica", "Oclusión de rama arterial y venosa"] },
    { titulo: "Retinopatía hipertensiva", puntos: ["Clasificación de Keith-Wagener", "Cruces arteriovenosos", "Cambios agudos vs crónicos"] },
    { titulo: "Otras retinopatías vasculares", puntos: ["Retinopatía de células falciformes", "Enfermedad de Coats", "Retinopatía de la prematuridad (ROP)", "Edema macular no diabético", "Macroaneurisma arterial retiniano"] } ] },
  { numero: 78, titulo: "Enfermedades de la coroides", parte: "especifica", capitulo_kanski: "Cap. 13 — Retina", subtemas: [
    { titulo: "Corioretinopatía central serosa (CRCS)", puntos: ["Fisiopatología", "Clínica: escotoma central, metamorfopsia, micropsia", "Diagnóstico por OCT y AFG", "Tratamiento"] },
    { titulo: "Anomalías de perfusión coroidea", puntos: ["Coroidopatía por polipoides (PCV)", "Neovascularización coroidea de tipo 1 y 2"] },
    { titulo: "Otras enfermedades coroideas", puntos: ["Coroidemia", "Atrofia girata", "Nevo coroideo vs melanoma coroideo pequeño"] } ] },
  { numero: 79, titulo: "Patología inflamatoria e infecciosa vítreoretiniana", parte: "especifica", capitulo_kanski: "Cap. 11 y 13", subtemas: [
    { titulo: "Vitritis y endoftalmitis", puntos: ["Endoftalmitis postoperatoria aguda y crónica", "Endoftalmitis endógena", "Tratamiento con vitrectomía e inyecciones intravítreas de antibióticos"] },
    { titulo: "Patología infecciosa retiniana", puntos: ["Toxoplasmosis (ya en T64 — repasar contexto)", "ARN (necrosis retiniana aguda): VZV, HSV", "Retinitis por CMV en SIDA"] } ] },
  { numero: 80, titulo: "Miopía patológica", parte: "especifica", capitulo_kanski: "Cap. 13 — Retina", subtemas: [
    { titulo: "Definición y patogenia", puntos: ["Miopía patológica (>-6D o longitud axial >26mm)", "Cambios degenerativos: estafiloma posterior, atrofia coriorretiniana", "Neovascularización coroidea miópica"] },
    { titulo: "Complicaciones y tratamiento", puntos: ["Retinosquisis miópica", "Agujero macular miópico", "DR en miope patológico", "Tratamiento: anti-VEGF para NVC miópica"] } ] },
  { numero: 81, titulo: "Distrofias retinianas hereditarias", parte: "especifica", capitulo_kanski: "Cap. 14 — Retina hereditaria", subtemas: [
    { titulo: "Distrofias del fotorreceptor", puntos: ["Retinitis pigmentosa: patogenia, clínica y herencia", "Amaurosis congénita de Leber", "Coroideremia"] },
    { titulo: "Distrofias maculares", puntos: ["Distrofia de Stargardt (ABCA4)", "Enfermedad de Best (distrofia macular viteliforme)", "Distrofia de conos"] },
    { titulo: "Visión cromática y nocturna", puntos: ["Acromatopsia", "Daltonismo: tipos y herencia", "Nictalopia: causas y diagnóstico"] },
    { titulo: "Toxicidad retiniana", puntos: ["Cloroquina/hidroxicloroquina: cribado y toxicidad", "Vigabatrina", "Tamoxifeno"] } ] },
  { numero: 82, titulo: "Degeneración macular asociada a la edad (DMAE)", parte: "especifica", capitulo_kanski: "Cap. 13 — Retina", subtemas: [
    { titulo: "DMAE seca", puntos: ["Drusen: duros y blandos", "Atrofia geográfica", "Factores de riesgo (tabaco, genética, dieta)", "Suplementos AREDS2"] },
    { titulo: "DMAE húmeda (NVC)", puntos: ["Neovascularización coroidea: tipos 1, 2 y 3", "Diagnóstico: OCT y AngioOCT", "Tratamiento con anti-VEGF: ranibizumab, aflibercept, brolucizumab, faricimab"] },
    { titulo: "Otras causas de NVC", puntos: ["Miopía patológica", "Estrías angioides", "Histoplasmosis", "CRCS crónica"] } ] },
  { numero: 83, titulo: "Patología de la interfase vítreo-macular", parte: "especifica", capitulo_kanski: "Cap. 13 — Retina", subtemas: [
    { titulo: "Membrana epirretiniana (MER)", puntos: ["Fisiopatología", "Clínica: metamorfopsia, pérdida de AV", "Diagnóstico OCT", "Vitrectomía y pelado de MER"] },
    { titulo: "Agujero macular", puntos: ["Clasificación de Gass (estadios 1-4)", "Diagnóstico OCT", "Tratamiento: vitrectomía + ILM peeling + gas"] },
    { titulo: "Opacidades vítreas", puntos: ["Miodesopsias: causas benignas vs desprendimiento de vítreo posterior (DVP)", "DVP: síntomas y riesgo de DR", "Sinquisis y asteroidosis"] } ] },
  { numero: 84, titulo: "Desprendimiento de retina", parte: "especifica", capitulo_kanski: "Cap. 13 — Retina", subtemas: [
    { titulo: "DR regmatógeno", puntos: ["Lesiones predisponentes: degeneración en empalizada, agujero atrófico, desgarro en herradura", "Factores de riesgo: miopía, cirugía de cataratas, trauma", "Clínica: fotopsias, miodesopsias, escotoma progresivo", "Diagnóstico: ecografía, oftalmoscopia indirecta"] },
    { titulo: "Tratamiento del DR regmatógeno", puntos: ["Retinopexia pneumática", "Crioterapia y fotocoagulación profiláctica", "Cerclaje escleral", "Vitrectomía vía pars plana (PPV)"] },
    { titulo: "Otros tipos de DR", puntos: ["DR traccional: en RDP, EVRC", "DR exudativo: tumores, uveítis, VKH", "Diagnóstico diferencial"] } ] },
  { numero: 85, titulo: "Patología tumoral coroidea", parte: "especifica", capitulo_kanski: "Cap. 17 — Tumores", subtemas: [
    { titulo: "Melanoma uveal", puntos: ["Epidemiología", "Clínica y diagnóstico (eco modo B, AFG, ICG)", "Factores pronósticos: tamaño, localización, citogenética (monosomía 3)", "Tratamiento: braquiterapia, protonerapia, enucleación"] },
    { titulo: "Otros tumores coroideos", puntos: ["Nevo coroideo: criterios de seguimiento vs biopsia", "Hemangioma coroideo: circunscrito vs difuso", "Metástasis coroideas: mama, pulmón", "Osteoma coroideo"] } ] },
  { numero: 86, titulo: "Terapia láser retiniana e inyecciones intravítreas", parte: "especifica", capitulo_kanski: "Cap. 13 — Retina", subtemas: [
    { titulo: "Láser retiniano", puntos: ["Principios del láser argón", "Fotocoagulación focal/rejilla para EMD", "Fotocoagulación panretiniana (PRP)", "Láser subumbral (micropulso)"] },
    { titulo: "Inyecciones intravítreas", puntos: ["Anti-VEGF: bevacizumab, ranibizumab, aflibercept, faricimab, brolucizumab", "Corticoides intravítreos: triamcinolona, implante de dexametasona (Ozurdex), implante de fluocinolona (Iluvien)", "Técnica y complicaciones"] } ] },
  { numero: 87, titulo: "Traumatismos de polo posterior", parte: "especifica", capitulo_kanski: "Cap. 16 — Trauma", subtemas: [
    { titulo: "Trauma de polo posterior", puntos: ["Conmoción retiniana (commotio retinae)", "Desgarros coroideos", "Hemorragia macular", "Avulsión del nervio óptico"] },
    { titulo: "Traumatismo craneal por maltrato", puntos: ["Abusive Head Trauma (síndrome del niño sacudido)", "Hemorragias retinianas en la infancia", "Diagnóstico y protocolo de actuación"] } ] },
  { numero: 88, titulo: "La pupila y sus alteraciones", parte: "especifica", capitulo_kanski: "Cap. 19 — Neuro-oftalmología", subtemas: [
    { titulo: "Vías pupilares", puntos: ["Vía aferente: fotorreceptores → nervio óptico → quiasma → colículo superior", "Vía eferente parasimpática: III par → ganglio ciliar → esfínter del iris", "Vía simpática: hipotálamo → médula → cadena simpática → músculo de Müller"] },
    { titulo: "Alteraciones pupilares", puntos: ["DPAR (defecto pupilar aferente relativo): técnica de la linterna oscilante", "Pupila de Argyll Robertson (sífilis)", "Disociación luz-acomodación", "Anisocoria esencial (fisiológica)"] },
    { titulo: "Síndromes pupilares", puntos: ["Pupila tónica de Adie", "Síndrome de Horner: ptosis, miosis, anhidrosis — localización de la lesión", "Disfunción episódica pupilar", "Anomalías congénitas e iatrogénicas"] },
    { titulo: "Farmacología pupilar", puntos: ["Test de cocaína y apraclonidina (Horner)", "Test de pilocarpina 0,1% (Adie)", "Atropina y otras midriáticas"] } ] },
  { numero: 89, titulo: "Diagnóstico topográfico por campo visual y electrofisiología", parte: "especifica", capitulo_kanski: "Cap. 19 — Neuro-oftalmología", subtemas: [
    { titulo: "Defectos campimétricos por localización", puntos: ["Lesión del nervio óptico: escotoma central o altitudinal", "Lesión quiasmática: hemianopsia bitemporal", "Lesión de la cintilla: hemianopsia homónima incongruente", "Lesión geniculada, radiaciones y cortical: hemianopsias homónimas congruentes"] },
    { titulo: "Electrofisiología", puntos: ["ERG (electrorretinograma): tipos y utilidad", "PEV (potenciales evocados visuales): latencia P100", "EOG (electrooculograma): relación luz/oscuridad"] } ] },
  { numero: 90, titulo: "Patología del nervio óptico", parte: "especifica", capitulo_kanski: "Cap. 19 — Neuro-oftalmología", subtemas: [
    { titulo: "Anomalías congénitas del disco", puntos: ["Drusas del nervio óptico", "Hipoplasia del nervio óptico", "Morning glory syndrome", "Coloboma del nervio óptico"] },
    { titulo: "Papiledema", puntos: ["Definición (edema de papila bilateral por HIC)", "Clasificación de Frisén", "Etiología: hipertensión intracraneal idiopática (pseudotumor cerebri)", "Diagnóstico y tratamiento"] },
    { titulo: "Neuropatías ópticas inflamatorias", puntos: ["Neuritis óptica: retrobulbar vs papilitis", "Asociación con esclerosis múltiple", "Neuromielitis óptica (NMO-AQP4)", "MOGAD (anti-MOG)", "Neuroretinitis (Bartonella)"] },
    { titulo: "Neuropatías ópticas isquémicas", puntos: ["NOIAN: no arterítica (ASA, factores de riesgo cardiovascular)", "NOIA arterítica: arteritis de la temporal (Horton)", "Diagnóstico: VSG, PCR, biopsia de arteria temporal", "Tratamiento urgente con corticoides"] },
    { titulo: "Otras neuropatías ópticas", puntos: ["Papilopatía diabética", "Neuropatía óptica nutricional y tóxica", "Neuropatía de Leber (LHON): gen ND4, MT", "Neuropatías compresivas"] } ] },
  { numero: 91, titulo: "Tumores del nervio óptico", parte: "especifica", capitulo_kanski: "Cap. 19 — Neuro-oftalmología", subtemas: [
    { titulo: "Tumores del nervio óptico", puntos: ["Glioma del nervio óptico: en NF1, RMN", "Meningioma de la vaina del nervio óptico: signo del tranvía en RMN", "Melanocitoma del disco", "Hemangioblastoma en VHL"] } ] },
  { numero: 92, titulo: "Síndromes quiasmáticos y retroquiasmáticos", parte: "especifica", capitulo_kanski: "Cap. 19 — Neuro-oftalmología", subtemas: [
    { titulo: "Lesiones quiasmáticas", puntos: ["Lesiones intraquiasmáticas: hemianopsia bitemporal", "Lesiones intraselares: adenoma hipofisario (el más frecuente)", "Lesiones extraselares: craneofaringioma, meningioma del tubérculo selar"] },
    { titulo: "Lesiones retroquiasmáticas", puntos: ["Cintilla óptica: hemianopsia homónima incongruente + pupila de Wernicke", "Cuerpo geniculado lateral", "Radiaciones ópticas: 'pie de pastel' temporal", "Corteza occipital: hemianopsia homónima congruente con visión macular preservada"] },
    { titulo: "Funciones corticales superiores", puntos: ["Síndrome de Balint (simultanagnosia, apraxia oculomotora, ataxia óptica)", "Prosopagnosia", "Pérdida visual no orgánica: diagnóstico diferencial"] } ] },
  { numero: 93, titulo: "Parálisis de pares craneales y miopatías", parte: "especifica", capitulo_kanski: "Cap. 19 — Neuro-oftalmología", subtemas: [
    { titulo: "Parálisis de los pares craneales", puntos: ["III par: completa vs incompleta, compresiva vs isquémica", "IV par: diplopia vertical, test de Parks-Bielschowsky", "VI par: el más frecuente, causas (HIC, DM, tumor)"] },
    { titulo: "Oftalmoplegia dolorosa", puntos: ["Síndrome de Tolosa-Hunt", "Oftalmoplejia diabética"] },
    { titulo: "Unión neuromuscular y miopatías", puntos: ["Miastenia gravis: ptosis fluctuante, test de tensilon, anticuerpos anti-AChR", "Otras miastenias: LEMS, botulismo", "Miopatías oculares: oftalmoplejia externa progresiva crónica (CPEO), síndrome de Kearns-Sayre"] },
    { titulo: "Nistagmos e intrusiones sacádicas", puntos: ["Nistagmo congénito vs adquirido", "Opsoclonus", "Oscilaciones sacádicas"] } ] },
  { numero: 94, titulo: "Manifestaciones oculares cardiovasculares y hematológicas", parte: "especifica", capitulo_kanski: "Cap. 15 — Sistémicas", subtemas: [
    { titulo: "Retinopatía hipertensiva", puntos: ["Fisiopatología: vasoconstricción, esclerosis, exudación, papiledema", "Clasificación de Keith-Wagener-Barker", "Neuropatía óptica hipertensiva", "Coroidopatía hipertensiva"] },
    { titulo: "Arteritis de la temporal", puntos: ["Clínica: cefalea, claudicación mandibular, VSG elevada", "Pérdida visual brusca (NOIA arterítica)", "Diagnóstico: biopsia de arteria temporal", "Tratamiento urgente: corticoides intravenosos"] },
    { titulo: "Manifestaciones hematológicas", puntos: ["Anemias: hemorragias retinianas, manchas de Roth", "Leucemias: infiltración retiniana y coroidea", "Disproteinemias: hiperviscosidad"] } ] },
  { numero: 95, titulo: "Manifestaciones oculares del tejido conectivo", parte: "especifica", capitulo_kanski: "Cap. 15 — Sistémicas", subtemas: [
    { titulo: "Colagenosis", puntos: ["LES: queratoconjuntivitis sicca, vasculitis retiniana", "Síndrome de Sjögren (ya en T50)", "Artritis reumatoide: escleritis, epiescleritis, ojo seco"] },
    { titulo: "Enfermedades reumáticas", puntos: ["Espondilitis anquilosante: uveítis anterior HLA-B27", "Artritis psoriásica", "Artritis reactiva (Reiter): uveítis, conjuntivitis"] },
    { titulo: "Sarcoidosis ocular", puntos: ["Manifestaciones: uveítis, conjuntivitis granulomatosa, infiltración lagrimal, neuropatía óptica", "Diagnóstico: biopsia, ECA, PET-TC", "Tratamiento: corticoides"] } ] },
  { numero: 96, titulo: "Manifestaciones oculares endocrinas y metabólicas", parte: "especifica", capitulo_kanski: "Cap. 15 — Sistémicas", subtemas: [
    { titulo: "Oftalmopatía tiroidea (OT)", puntos: ["Enfermedad de Graves: exoftalmos, retracción palpebral, miopatía restrictiva", "Clasificación CAS (Clinical Activity Score)", "Diagnóstico: RMN de órbita", "Tratamiento: selenio, corticoides, radioterapia, descompresión orbitaria", "Neuropatía óptica compresiva: urgencia"] },
    { titulo: "Diabetes mellitus (oculares)", puntos: ["Ya cubierto en T76 (RD) — repasar: otras manifestaciones (parálisis de pares, glaucoma neovascular)"] } ] },
  { numero: 97, titulo: "Manifestaciones oculares de infecciones sistémicas", parte: "especifica", capitulo_kanski: "Cap. 15 — Sistémicas", subtemas: [
    { titulo: "Infecciones bacterianas sistémicas", puntos: ["Tuberculosis ocular: uveítis, coroiditis, Eales disease", "Sífilis ocular: iridociclitis, coriorretinitis, neuritis óptica", "Brucelosis", "Lyme ocular"] },
    { titulo: "Infecciones por Chlamydias y Rickettsias", puntos: ["Tracoma: clasificación de Foster", "Fiebre de las Garrapatas Rocky Mountain"] },
    { titulo: "Infecciones micóticas y parasitarias", puntos: ["Candidiasis ocular en inmunodeprimidos", "Toxoplasmosis (ya en T64)", "Toxocariasis (ya en T39)"] },
    { titulo: "Infecciones virales sistémicas", puntos: ["CMV en inmunocompetentes vs inmunodeprimidos", "VIH: microangiopatía, retinitis por CMV", "Herpesvirus"] } ] },
  { numero: 98, titulo: "Manifestaciones oculares de las facomatosis", parte: "especifica", capitulo_kanski: "Cap. 15 — Sistémicas", subtemas: [
    { titulo: "Facomatosis principales", puntos: ["Neurofibromatosis tipo 1 (NF1): nódulos de Lisch, glioma del NO, neurofibroma palpebral", "Esclerosis tuberosa: hamartomas retinianos astrocíticos, manchas en hoja de fresno", "Angiomatosis retino-cerebelosa (VHL): hemangioblastoma de retina, policitemia", "Angiomatosis encéfalo-trigeminal (Sturge-Weber): angioma coroideo difuso, glaucoma"] },
    { titulo: "Facomatosis menos frecuentes", puntos: ["Síndrome de Wyburn-Mason: fístula AV retiniana", "Ataxia-telangiectasia: telangiectasias conjuntivales, apraxia oculomotora"] } ] },
  { numero: 99, titulo: "Manifestaciones oculares dermatológicas", parte: "especifica", capitulo_kanski: "Cap. 15 — Sistémicas", subtemas: [
    { titulo: "Manifestaciones oculares cutáneas", puntos: ["Albinismo: nistagmo, fóvea hipoplásica, iridodonesis, fotofobia", "Psoriasis: uveítis, queratitis", "Penfigoide cicatricial (ya en T51)"] },
    { titulo: "Dermatosis inflamatorias", puntos: ["Síndrome de Stevens-Johnson (ya en T52)", "Dermatitis atópica: cataratas subcapsulares anteriores, queratocono, ojo seco", "Acné rosácea: blefaritis posterior, chalazión, meibomitis, queratitis rosácea"] } ] },
  { numero: 100, titulo: "Migraña, cefaleas y embarazo", parte: "especifica", capitulo_kanski: "Cap. 19 — Neuro-oftalmología", subtemas: [
    { titulo: "Migraña y cefaleas", puntos: ["Migraña con aura visual: escotoma centelleante, aura típica", "Migraña oftalmopléjica", "Cefalea en racimos (cluster): síndrome de Horner transitorio", "Algias faciales: neuralgia del trigémino"] },
    { titulo: "Ojo y embarazo", puntos: ["Cambios refractivos durante el embarazo", "Retinopatía de la eclampsia", "DMAE y embarazo", "Uso seguro de fármacos oftálmicos en embarazo"] } ] },
  { numero: 101, titulo: "Traumatismos oculares — generalidades", parte: "especifica", capitulo_kanski: "Cap. 16 — Trauma", subtemas: [
    { titulo: "Epidemiología y prevención", puntos: ["Incidencia de trauma ocular", "Grupos de riesgo", "Medidas de prevención (gafas protectoras)", "Clasificación del traumatismo ocular: BETT (Birmingham Eye Trauma Terminology)"] },
    { titulo: "Evaluación clínica inicial", puntos: ["Historia clínica del trauma", "Exploración básica urgente: AV, pupilas, PIO, fondo de ojo", "Diagnóstico por imagen: TC de órbita en trauma", "Clasificación: globo cerrado vs abierto"] } ] },
  { numero: 102, titulo: "Traumatismos de órbita y anejos", parte: "especifica", capitulo_kanski: "Cap. 16 — Trauma", subtemas: [
    { titulo: "Fracturas orbitarias", puntos: ["Fractura de blow-out: mecanismo, atrapamiento del recto inferior", "Fractura del suelo orbitario: diagnóstico (TC), enoftalmos", "Fractura del techo: comunicación con SNC", "Fractura malar"] },
    { titulo: "Traumatismos palpebrales y canaliculares", puntos: ["Laceraciones palpebrales: suturas por capas", "Lesión del canalículo lacrimal: intubación y reparación", "Avulsión del párpado"] },
    { titulo: "Tratamiento quirúrgico", puntos: ["Indicaciones y timing de la cirugía", "Abordajes para reparación orbitaria"] } ] },
  { numero: 103, titulo: "Traumatismo ocular con globo cerrado", parte: "especifica", capitulo_kanski: "Cap. 16 — Trauma", subtemas: [
    { titulo: "Contusión ocular — segmento anterior", puntos: ["Hifema: clasificación, manejo y complicaciones (rebleeding, glaucoma)", "Iridodiálisis y ciclodialisis", "Luxación traumática del cristalino", "Catarata traumática"] },
    { titulo: "Contusión ocular — segmento posterior", puntos: ["Commotio retinae (de Berlin)", "Desgarro retiniano traumático", "Hemorragia vítrea traumática", "Avulsión de la base del vítreo", "Daño macular: agujero macular traumático"] } ] },
  { numero: 104, titulo: "Traumatismo ocular con globo abierto", parte: "especifica", capitulo_kanski: "Cap. 16 — Trauma", subtemas: [
    { titulo: "Heridas oculares", puntos: ["Laceración corneal sin prolapso de iris", "Laceración corneal con prolapso de iris", "Laceración escleral", "Técnicas de sutura"] },
    { titulo: "Cuerpos extraños intraoculares (CEIO)", puntos: ["CEIO de segmento anterior", "CEIO de segmento posterior", "Siderosis ocular y calcocis", "Técnicas de extracción: magnético vs no magnético"] },
    { titulo: "Heridas perforantes", puntos: ["Mecanismo (de entrada y salida)", "Diagnóstico: eco modo B, TC", "Manejo quirúrgico"] } ] },
  { numero: 105, titulo: "Traumatismo ocular no mecánico", parte: "especifica", capitulo_kanski: "Cap. 16 — Trauma", subtemas: [
    { titulo: "Quemaduras químicas", puntos: ["Clasificación de Roper-Hall (grados I-IV)", "Mecanismo: álcalis (peor pronóstico) vs ácidos", "Tratamiento urgente: irrigación masiva, pH", "Manejo posterior: corticoides, vitamina C, ciclosporina, cirugía reconstructiva"] },
    { titulo: "Otras quemaduras", puntos: ["Quemaduras térmicas", "Quemaduras por radiación UV (fotoqueratitis): soldadura, nieve", "Quemaduras por radiación ionizante"] } ] },
  { numero: 106, titulo: "Simulación, Oftalmología Laboral y Peritaje", parte: "especifica", capitulo_kanski: null, subtemas: [
    { titulo: "Simulación en oftalmología", puntos: ["Diagnóstico de pérdida visual no orgánica", "Tests objetivos vs subjetivos: PEV, pupilografía, OKN", "Malingering vs histeria de conversión"] },
    { titulo: "Oftalmología laboral", puntos: ["Incapacidades visuales: baremos legales", "Aptitud visual para conducir: normativa española", "Patologías ocupacionales: VDT, UV laboral"] },
    { titulo: "Peritaje médico", puntos: ["Valoración del daño ocular en accidentes de tráfico", "Baremo de daño corporal", "Informes periciales"] } ] },
  { numero: 107, titulo: "Toxicología ocular y enfermedades iatrogénicas", parte: "especifica", capitulo_kanski: null, subtemas: [
    { titulo: "Toxicología ocular", puntos: ["Corticoides: glaucoma, cataratas", "Antimaláricos (cloroquina/HCQ): maculopatía en ojo de buey", "Amiodarona: depósitos corneales (cornea verticillata)", "Digoxina: xantopsia, fotopsia", "Tamoxifeno: cristales maculares", "Vigabatrina: pérdida campo visual"] },
    { titulo: "Enfermedades iatrogénicas", puntos: ["Complicaciones de cirugía de cataratas (ya en T68)", "Endoftalmitis postquirúrgica (ya en T79)", "Iatrogenia por inyecciones intravítreas: endoftalmitis, hipertensión ocular"] } ] },
];

export const TODOS_LOS_TEMAS: TemaBoja[] = [...TEMAS_COMUNES, ...TEMAS_ESPECIFICOS];
