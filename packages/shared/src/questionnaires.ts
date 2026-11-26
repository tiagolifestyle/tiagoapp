// Questionários que o cliente preenche na app (treino, pós-parto, alimentar).
// Seguem os documentos do coach (mesmas secções, perguntas e opções, pela mesma
// ordem), traduzidos para PT/ES/EN. A app usa-os para mostrar o formulário e o
// admin para mostrar as respostas. As respostas ficam em questionnaire_responses.

export type QuestionnaireKind = "training" | "postpartum" | "nutrition";

export const QUESTIONNAIRE_KINDS: QuestionnaireKind[] = ["training", "postpartum", "nutrition"];

export interface QText {
  pt: string;
  es: string;
  en: string;
}

export interface QOption {
  key: string;
  label: QText;
}

export type QGridColumn =
  | { key: string; label: QText; type: "text" }
  | { key: string; label: QText; type: "single"; options: QOption[] };

// Valores preenchidos automaticamente com o que a app já sabe (o cliente pode alterar).
export type QPrefill = "name" | "firstName" | "lastName" | "email" | "today";

export type QField =
  | { type: "info"; text: QText }
  | { type: "text"; key: string; label: QText; prefill?: QPrefill; numeric?: boolean }
  | { type: "textarea"; key: string; label: QText }
  | { type: "single"; key: string; label: QText; options: QOption[] }
  // "otherKey": a opção "Outro" que abre um campo de texto, guardado em `${key}.other`.
  | { type: "multi"; key: string; label: QText; options: QOption[]; otherKey?: string }
  | { type: "scale"; key: string; label: QText; min: number; max: number }
  // Tabelas do documento: cada célula fica em `${key}.${linha}.${coluna}`.
  | { type: "grid"; key: string; label: QText; rows: QOption[]; columns: QGridColumn[] }
  // IMC calculado a partir da altura (cm ou m) e do peso (kg).
  | { type: "bmi"; key: string; label: QText; heightKey: string; weightKey: string }
  // Declaração: `${key}.accepted` ("yes"), `${key}.name` e `${key}.date` (automática ao guardar).
  | { type: "consent"; key: string; text: QText; accept: QText }
  // Assinatura simples: `${key}.name` e `${key}.date` (automática ao guardar).
  | { type: "signature"; key: string; label: QText };

export interface QSection {
  number?: number;
  title?: QText;
  fields: QField[];
}

export interface QuestionnaireDefinition {
  kind: QuestionnaireKind;
  header?: QText;
  title: QText;
  subtitle?: QText;
  intro?: QText;
  sections: QSection[];
}

export type QuestionnaireAnswers = Record<string, string | string[]>;

export interface QuestionnaireResponse {
  id: string;
  client_id: string;
  kind: QuestionnaireKind;
  answers: QuestionnaireAnswers;
  created_at: string;
  updated_at: string;
}

const t = (pt: string, es: string, en: string): QText => ({ pt, es, en });
const opt = (key: string, pt: string, es: string, en: string): QOption => ({ key, label: t(pt, es, en) });

const YES_NO: QOption[] = [opt("yes", "Sim", "Sí", "Yes"), opt("no", "Não", "No", "No")];
const GRADE_1_3: QOption[] = ["1", "2", "3"].map((n) => opt(n, n, n, n));
const GRADE_1_4: QOption[] = ["1", "2", "3", "4"].map((n) => opt(n, n, n, n));

export function pickQText(text: QText, locale: string): string {
  return text[locale as keyof QText] ?? text.pt;
}

// ─── Questionário de treino (Cuestionario de Evaluación Inicial) ───────────────

const TRAINING: QuestionnaireDefinition = {
  kind: "training",
  header: t(
    "Tiago Conceição · Personal Trainer · Especialista em pós-parto",
    "Tiago Conceição · Personal Trainer · Especialista en posparto",
    "Tiago Conceição · Personal Trainer · Postpartum specialist"
  ),
  title: t("Questionário de Avaliação Inicial", "Cuestionario de Evaluación Inicial", "Initial Assessment Questionnaire"),
  subtitle: t(
    "Entrevista pessoal antes do início do treino",
    "Entrevista personal previa al inicio del entrenamiento",
    "Personal interview before starting training"
  ),
  sections: [
    {
      fields: [
        { type: "text", key: "client", label: t("Cliente", "Cliente", "Client"), prefill: "name" },
        { type: "text", key: "date", label: t("Data", "Fecha", "Date"), prefill: "today" },
        {
          type: "text",
          key: "contact",
          label: t(
            "Contacto (email ou nº de telefone)",
            "Contacto (email o nº de teléfono)",
            "Contact (email or phone number)"
          ),
          prefill: "email",
        },
      ],
    },
    {
      number: 1,
      title: t("Dados do cliente", "Datos del cliente", "Client details"),
      fields: [
        {
          type: "single",
          key: "sex",
          label: t("Sexo", "Sexo", "Sex"),
          options: [opt("male", "Homem", "Hombre", "Male"), opt("female", "Mulher", "Mujer", "Female")],
        },
        { type: "text", key: "age", label: t("Idade", "Edad", "Age"), numeric: true },
        { type: "text", key: "height", label: t("Altura (cm)", "Altura (cm)", "Height (cm)"), numeric: true },
        { type: "text", key: "weight", label: t("Peso (kg)", "Peso (kg)", "Weight (kg)"), numeric: true },
        { type: "bmi", key: "bmi", label: t("IMC", "IMC", "BMI"), heightKey: "height", weightKey: "weight" },
      ],
    },
    {
      number: 2,
      title: t("Objetivos de fitness", "Objetivos fitness", "Fitness goals"),
      fields: [
        {
          type: "textarea",
          key: "motivation",
          label: t(
            "O que te motivou a procurar um personal trainer neste momento?",
            "¿Qué te ha motivado a buscar un entrenador personal en este momento?",
            "What made you look for a personal trainer at this moment?"
          ),
        },
        {
          type: "textarea",
          key: "previousTrainer",
          label: t(
            "Já trabalhaste com um treinador antes? Se sim, o que gostaste e o que não gostaste dessa experiência?",
            "¿Has trabajado con un entrenador antes? Si es así, ¿qué te gustó y qué no te gustó de esa experiencia?",
            "Have you worked with a trainer before? If so, what did you like and dislike about that experience?"
          ),
        },
        {
          type: "textarea",
          key: "mainGoal",
          label: t(
            "Objetivo principal (ex.: perder peso, ganhar força, melhorar a técnica, reduzir a dor nas costas...)",
            "Principal objetivo (ej. perder peso, ganar fuerza, mejorar la técnica, reducir el dolor de espalda...)",
            "Main goal (e.g. lose weight, gain strength, improve technique, reduce back pain...)"
          ),
        },
      ],
    },
    {
      number: 3,
      title: t(
        "Historial de saúde — Questionário PAR-Q",
        "Historial de salud — Cuestionario PAR-Q",
        "Health history — PAR-Q questionnaire"
      ),
      fields: [
        {
          type: "info",
          text: t(
            "O PAR-Q (Physical Activity Readiness Questionnaire) permite detetar possíveis riscos de saúde ou cardiovasculares antes de iniciar um programa de exercício físico. Se responderes «Sim» a alguma pergunta, recomenda-se uma avaliação médica antes de começar.",
            "El PAR-Q (Physical Activity Readiness Questionnaire) permite detectar posibles riesgos sanitarios o cardiovasculares antes de iniciar un programa de ejercicio físico. Si respondes «Sí» a alguna pregunta, se recomienda una revisión médica antes de comenzar.",
            "The PAR-Q (Physical Activity Readiness Questionnaire) helps detect possible health or cardiovascular risks before starting an exercise programme. If you answer “Yes” to any question, a medical check-up is recommended before you start."
          ),
        },
        {
          type: "single",
          key: "parq1",
          label: t(
            "Alguma vez um médico lhe diagnosticou uma doença cardíaca, recomendando-lhe que só fizesse atividade física supervisionada por profissionais de saúde?",
            "¿Le ha diagnosticado alguna vez un médico una enfermedad cardíaca, recomendándole que solo realice actividad física supervisada por personal sanitario?",
            "Has a doctor ever diagnosed you with a heart condition and recommended that you only do physical activity supervised by healthcare staff?"
          ),
          options: YES_NO,
        },
        {
          type: "single",
          key: "parq2",
          label: t(
            "Tem dores no peito provocadas pela atividade física?",
            "¿Tiene dolores en el pecho producidos por la actividad física?",
            "Do you have chest pain caused by physical activity?"
          ),
          options: YES_NO,
        },
        {
          type: "single",
          key: "parq3",
          label: t(
            "Notou dor no peito durante o último mês, mesmo em repouso?",
            "¿Ha notado dolor en el pecho durante el último mes, incluso en reposo?",
            "Have you had chest pain in the last month, even at rest?"
          ),
          options: YES_NO,
        },
        {
          type: "single",
          key: "parq4",
          label: t(
            "Tem tendência a perder o equilíbrio ou os sentidos devido a tonturas?",
            "¿Tiende a perder el equilibrio o el conocimiento como resultado de mareos?",
            "Do you tend to lose your balance or consciousness because of dizziness?"
          ),
          options: YES_NO,
        },
        {
          type: "single",
          key: "parq5",
          label: t(
            "Alguma vez um médico lhe receitou algum medicamento para a tensão arterial ou outro problema cardiovascular?",
            "¿Le ha recetado alguna vez un médico algún fármaco para la presión arterial u otro problema cardiocirculatorio?",
            "Has a doctor ever prescribed you medication for blood pressure or another heart or circulation problem?"
          ),
          options: YES_NO,
        },
        {
          type: "single",
          key: "parq6",
          label: t(
            "Tem alguma alteração óssea ou articular que possa agravar-se com a atividade física proposta?",
            "¿Tiene alguna alteración ósea o articular que pudiera agravarse por la actividad física propuesta?",
            "Do you have any bone or joint problem that could get worse with the proposed physical activity?"
          ),
          options: YES_NO,
        },
        {
          type: "single",
          key: "parq7",
          label: t(
            "Tem conhecimento, por experiência própria ou por conselho médico, de qualquer outra razão física que o/a impeça de fazer exercício sem supervisão médica?",
            "¿Tiene conocimiento, por experiencia propia o por consejo médico, de cualquier otra razón física que le impida hacer ejercicio sin supervisión médica?",
            "Do you know, from your own experience or medical advice, of any other physical reason that prevents you from exercising without medical supervision?"
          ),
          options: YES_NO,
        },
        {
          type: "textarea",
          key: "surgeries",
          label: t(
            "Tiveste alguma operação ou há mais alguma coisa que devas comunicar?",
            "¿Has tenido alguna operación o hay algo más que debas notificar?",
            "Have you had any surgery, or is there anything else you should tell us?"
          ),
        },
      ],
    },
    {
      number: 4,
      title: t("Dados específicos do pós-parto", "Datos específicos del posparto", "Postpartum-specific details"),
      fields: [
        {
          type: "info",
          text: t(
            "Esta secção permite-nos adaptar o teu plano de treino à tua recuperação real.",
            "Esta sección nos permite adaptar tu plan de entrenamiento a tu recuperación real.",
            "This section lets us adapt your training plan to your actual recovery."
          ),
        },
        { type: "text", key: "deliveryDate", label: t("Data do parto", "Fecha del parto", "Delivery date") },
        {
          type: "single",
          key: "deliveryType",
          label: t("Tipo de parto", "Tipo de parto", "Type of delivery"),
          options: [
            opt("vaginal", "Vaginal", "Vaginal", "Vaginal"),
            opt("cesarean", "Cesariana", "Cesárea", "C-section"),
            opt(
              "instrumental",
              "Vaginal instrumentado (fórceps/ventosa)",
              "Vaginal instrumental (fórceps/ventosa)",
              "Assisted vaginal (forceps/vacuum)"
            ),
          ],
        },
        {
          type: "single",
          key: "breastfeeding",
          label: t("Estás a amamentar?", "¿Estás en periodo de lactancia?", "Are you breastfeeding?"),
          options: YES_NO,
        },
        {
          type: "single",
          key: "medicalClearance",
          label: t(
            "Tens alta médica para fazer atividade física?",
            "¿Tienes el alta médica para realizar actividad física?",
            "Have you been medically cleared for physical activity?"
          ),
          options: [...YES_NO, opt("pending", "A aguardar revisão", "Pendiente de revisión", "Awaiting check-up")],
        },
        {
          type: "single",
          key: "diastasis",
          label: t(
            "Foi-te diagnosticada diástase abdominal (separação dos retos abdominais)?",
            "¿Te han diagnosticado diástasis abdominal (separación de los rectos abdominales)?",
            "Have you been diagnosed with abdominal diastasis (separation of the rectus abdominis)?"
          ),
          options: [
            ...YES_NO,
            opt(
              "unknown",
              "Não sei / não fui avaliado/a",
              "No lo sé / no me han revisado",
              "I don't know / I haven't been checked"
            ),
          ],
        },
        {
          type: "single",
          key: "urineLeaks",
          label: t(
            "Notas perdas de urina ao tossir, saltar, rir ou fazer esforço (incontinência urinária)?",
            "¿Notas pérdidas de orina al toser, saltar, reír o hacer esfuerzo (incontinencia urinaria)?",
            "Do you leak urine when coughing, jumping, laughing or straining (urinary incontinence)?"
          ),
          options: [...YES_NO, opt("sometimes", "Às vezes", "A veces", "Sometimes")],
        },
        {
          type: "single",
          key: "pelvicDiscomfort",
          label: t(
            "Sentes desconforto, pressão ou peso na zona pélvica ou vaginal?",
            "¿Sientes molestias, presión o pesadez a nivel pélvico o vaginal?",
            "Do you feel discomfort, pressure or heaviness in the pelvic or vaginal area?"
          ),
          options: YES_NO,
        },
        {
          type: "textarea",
          key: "scar",
          label: t(
            "Se tiveste cesariana ou episiotomia: a cicatriz está completamente fechada e sem desconforto?",
            "Si tuviste cesárea o episiotomía: ¿la cicatriz está completamente cerrada y sin molestias?",
            "If you had a C-section or episiotomy: is the scar fully closed and free of discomfort?"
          ),
        },
        {
          type: "single",
          key: "pelvicRehab",
          label: t(
            "Fizeste ou estás a fazer reabilitação do pavimento pélvico?",
            "¿Has realizado o estás realizando rehabilitación de suelo pélvico?",
            "Have you done, or are you doing, pelvic floor rehabilitation?"
          ),
          options: [...YES_NO, opt("ongoing", "Em curso", "En curso", "In progress")],
        },
      ],
    },
    {
      number: 5,
      title: t("Estilo de vida e nutrição", "Estilo de vida y nutrición", "Lifestyle and nutrition"),
      fields: [
        {
          type: "textarea",
          key: "occupation",
          label: t(
            "Qual é a tua ocupação? Passas muito tempo sentado/a ou de pé?",
            "¿Cuál es tu ocupación? ¿Pasas mucho tiempo sentado/a o de pie?",
            "What is your occupation? Do you spend a lot of time sitting or standing?"
          ),
        },
        {
          type: "textarea",
          key: "sleep",
          label: t(
            "Como é a qualidade do teu sono? Quantas horas dormes por dia?",
            "¿Cómo es tu calidad de sueño? ¿Cuántas horas duermes al día?",
            "How is your sleep quality? How many hours do you sleep a day?"
          ),
        },
        {
          type: "textarea",
          key: "nutrition",
          label: t(
            "Como descreverias a tua alimentação atual? Tens restrições alimentares ou és alérgico/a a algum alimento?",
            "¿Cómo describirías tu nutrición actual? ¿Tienes restricciones alimentarias o eres alérgico/a a algún alimento?",
            "How would you describe your current diet? Do you have any dietary restrictions or food allergies?"
          ),
        },
        {
          type: "textarea",
          key: "smokingAlcohol",
          label: t(
            "És fumador/a ou consomes álcool? Se sim, com que idade começaste, ou desde quando deixaste?",
            "¿Eres fumador/a o consumes alcohol? Si es así, ¿a qué edad empezaste, o desde cuándo lo dejaste?",
            "Do you smoke or drink alcohol? If so, at what age did you start, or since when have you stopped?"
          ),
        },
        {
          type: "single",
          key: "activityLevel",
          label: t(
            "Hábitos de exercício: qual é o teu nível de atividade física diária?",
            "Hábitos de ejercicio: ¿cuál es tu nivel de actividad física diaria?",
            "Exercise habits: what is your daily physical activity level?"
          ),
          options: [
            opt("sedentary", "Sedentário", "Sedentario", "Sedentary"),
            opt("moderate", "Moderado", "Moderado", "Moderate"),
            opt("intense", "Intenso", "Intenso", "Intense"),
          ],
        },
      ],
    },
    {
      number: 6,
      title: t("Experiência e disponibilidade", "Experiencia y disponibilidad", "Experience and availability"),
      fields: [
        {
          type: "textarea",
          key: "exercisePreferences",
          label: t(
            "Que tipo de exercício gostas de fazer e qual não gostas? (força, cardio, yoga...)",
            "¿Qué tipo de ejercicio disfrutas hacer y cuál no? (fuerza, cardio, yoga...)",
            "What kind of exercise do you enjoy and which don't you? (strength, cardio, yoga...)"
          ),
        },
        {
          type: "textarea",
          key: "daysPerWeek",
          label: t(
            "Quantos dias por semana te podes comprometer a treinar?",
            "¿Cuántos días a la semana puedes comprometerte a entrenar?",
            "How many days a week can you commit to training?"
          ),
        },
        {
          type: "textarea",
          key: "bestTime",
          label: t("Qual é o melhor horário para ti?", "¿Cuál es el mejor horario para ti?", "What time of day works best for you?"),
        },
        {
          type: "textarea",
          key: "equipment",
          label: t(
            "Que equipamento tens disponível? (ginásio, ginásio em casa, só peso corporal...)",
            "¿Qué equipo tienes disponible? (gimnasio, gimnasio en casa, solo peso corporal...)",
            "What equipment do you have available? (gym, home gym, bodyweight only...)"
          ),
        },
      ],
    },
    {
      number: 7,
      title: t("Encerramento", "Cierre", "Closing"),
      fields: [
        {
          type: "textarea",
          key: "anythingElse",
          label: t(
            "Há mais alguma coisa que eu deva saber para te ajudar a ter sucesso, ou tens alguma dúvida?",
            "¿Hay algo más que deba saber para ayudarte a tener éxito, o tienes alguna duda?",
            "Is there anything else I should know to help you succeed, or do you have any questions?"
          ),
        },
      ],
    },
    {
      title: t("Declaração e consentimento", "Declaración y consentimiento", "Declaration and consent"),
      fields: [
        {
          type: "consent",
          key: "consent",
          text: t(
            "Eu, {{name}}, declaro que toda a informação fornecida neste questionário é verdadeira e completa, tanto quanto é do meu conhecimento. Compreendo que a prática de exercício físico implica riscos inerentes e declaro que me encontro fisicamente apto/a para participar num programa de treino personalizado.\n\nAssumo total responsabilidade pelas minhas ações, decisões e estado de saúde. Isento Tiago Conceição de toda a responsabilidade legal, contratual ou extracontratual por lesões, danos ou prejuízos que possam surgir durante o meu treino, salvo negligência grave.",
            "Yo, {{name}}, declaro que toda la información proporcionada en este cuestionario es verdadera y completa, según mi mejor saber y entender. Entiendo que la práctica de ejercicio físico conlleva riesgos inherentes y declaro que me encuentro físicamente apto/a para participar en un programa de entrenamiento personal.\n\nAsumo la responsabilidad total de mis acciones, decisiones y estado de salud. Exonero a Tiago Conceição de toda responsabilidad legal, contractual o extracontractual por lesiones, daños o perjuicios que puedan surgir durante mi entrenamiento, salvo negligencia grave.",
            "I, {{name}}, declare that all the information provided in this questionnaire is true and complete to the best of my knowledge. I understand that physical exercise carries inherent risks and I declare that I am physically fit to take part in a personal training programme.\n\nI take full responsibility for my actions, decisions and state of health. I release Tiago Conceição from all legal, contractual or non-contractual liability for injuries, damage or losses that may arise during my training, except in cases of gross negligence."
          ),
          accept: t(
            "Li, compreendo e aceito os termos desta avaliação inicial.",
            "He leído, entiendo y acepto los términos de esta evaluación inicial.",
            "I have read, understand and accept the terms of this initial assessment."
          ),
        },
      ],
    },
  ],
};

// ─── Questionário pós-parto (parte que a cliente preenche) ─────────────────────

const POSTPARTUM: QuestionnaireDefinition = {
  kind: "postpartum",
  title: t("Questionário pós-parto", "Cuestionario posparto", "Postpartum questionnaire"),
  sections: [
    {
      title: t("Dados pessoais", "Datos personales", "Personal details"),
      fields: [
        { type: "text", key: "date", label: t("Data", "Fecha", "Date"), prefill: "today" },
        { type: "text", key: "lastName", label: t("Apelidos", "Apellidos", "Surname(s)"), prefill: "lastName" },
        { type: "text", key: "firstName", label: t("Nome", "Nombre", "First name"), prefill: "firstName" },
        { type: "text", key: "birthDate", label: t("Data de nascimento", "Fecha de nacimiento", "Date of birth") },
        { type: "text", key: "phone", label: t("Nº de telefone", "Nº de teléfono", "Phone number") },
        { type: "text", key: "email", label: t("E-mail", "E-mail", "Email"), prefill: "email" },
        { type: "text", key: "occupation", label: t("Profissão", "Profesión", "Occupation") },
      ],
    },
    {
      title: t("Controlos", "Controles", "Checks"),
      fields: [
        { type: "text", key: "weight", label: t("Peso (kg)", "Peso (kg)", "Weight (kg)"), numeric: true },
        { type: "text", key: "height", label: t("Altura (cm)", "Altura (cm)", "Height (cm)"), numeric: true },
        { type: "single", key: "smoker", label: t("Fumador/a", "Fumador/a", "Smoker"), options: YES_NO },
        { type: "single", key: "asthma", label: t("Asma", "Asma", "Asthma"), options: YES_NO },
        { type: "single", key: "diet", label: t("Dieta", "Dieta", "On a diet"), options: YES_NO },
        { type: "single", key: "hypertension", label: t("Hipertensão", "Hipertensión", "High blood pressure"), options: YES_NO },
        { type: "text", key: "bloodPressure", label: t("Tensão arterial", "Tensión", "Blood pressure") },
      ],
    },
    {
      title: t(
        "Antecedentes de atividade física e uroginecologia",
        "Antecedentes actividad física y uroginecología",
        "Physical activity and urogynaecological history"
      ),
      fields: [
        {
          type: "grid",
          key: "sports",
          label: t("Atividade desportiva - nível", "Actividad deportiva - nivel", "Sports activity - level"),
          rows: [opt("1", "1", "1", "1"), opt("2", "2", "2", "2"), opt("3", "3", "3", "3")],
          columns: [
            { key: "activity", label: t("Atividade", "Actividad", "Activity"), type: "text" },
            {
              key: "level",
              label: t("Nível", "Nivel", "Level"),
              type: "single",
              options: [
                opt("high", "Alto", "Alto", "High"),
                opt("medium", "Médio", "Medio", "Medium"),
                opt("low", "Baixo", "Bajo", "Low"),
              ],
            },
          ],
        },
        {
          type: "textarea",
          key: "goals",
          label: t("Metas - objetivos a alcançar", "Metas - objetivos a conseguir", "Goals to achieve"),
        },
        {
          type: "textarea",
          key: "medical",
          label: t(
            "Patologias - indicações médicas / Operações cirúrgicas / Medicação - Alergias",
            "Patologías - Ind. médicas / Operaciones quirúrgicas / Medicación - Alergias",
            "Medical conditions - medical advice / Surgery / Medication - Allergies"
          ),
        },
        {
          type: "grid",
          key: "pregnancies",
          label: t("Historial de gravidezes", "Historial embarazos", "Pregnancy history"),
          rows: [
            opt("1", "1º", "1º", "1st"),
            opt("2", "2º", "2º", "2nd"),
            opt("3", "3º", "3º", "3rd"),
            opt("4", "4º", "4º", "4th"),
          ],
          columns: [
            { key: "date", label: t("Data", "Fecha", "Date"), type: "text" },
            {
              key: "delivery",
              label: t("Natural - Cesariana", "Natural - Cesárea", "Natural - C-section"),
              type: "single",
              options: [opt("natural", "Natural", "Natural", "Natural"), opt("cesarean", "Cesariana", "Cesárea", "C-section")],
            },
            {
              key: "type",
              label: t("1 - Múltipla - Aborto", "1 - Múltiple - Aborto", "Single - Multiple - Miscarriage"),
              type: "single",
              options: [
                opt("single", "1", "1", "Single"),
                opt("multiple", "Múltipla", "Múltiple", "Multiple"),
                opt("abortion", "Aborto", "Aborto", "Miscarriage"),
              ],
            },
            { key: "ui", label: t("IU", "IU", "UI"), type: "single", options: YES_NO },
            { key: "pop", label: t("POP", "POP", "POP"), type: "single", options: YES_NO },
          ],
        },
        {
          type: "info",
          text: t(
            "IU: incontinência urinária · POP: prolapso de órgãos pélvicos",
            "IU: incontinencia urinaria · POP: prolapso de órganos pélvicos",
            "UI: urinary incontinence · POP: pelvic organ prolapse"
          ),
        },
        {
          type: "grid",
          key: "incontinence",
          label: t("Incontinência", "Incontinencia", "Incontinence"),
          rows: [
            opt("stress", "Urinária - esforço", "Urinaria - esfuerzo", "Urinary - stress"),
            opt("urgency", "Urinária - urgência", "Urinaria - urgencia", "Urinary - urgency"),
            opt("fecal", "Fecal", "Fecal", "Faecal"),
          ],
          columns: [{ key: "grade", label: t("Grau", "Grado", "Grade"), type: "single", options: GRADE_1_3 }],
        },
        {
          type: "textarea",
          key: "otherObservations",
          label: t("Outras observações", "Otras observaciones", "Other observations"),
        },
        {
          type: "grid",
          key: "prolapse",
          label: t("Prolapso", "Prolapso", "Prolapse"),
          rows: [
            opt("cystocele", "Cistocelo", "Cistocele", "Cystocele"),
            opt("uterine", "Uterino", "Uterino", "Uterine"),
            opt("rectocele", "Retocelo", "Rectocele", "Rectocele"),
          ],
          columns: [{ key: "grade", label: t("Grau", "Grado", "Grade"), type: "single", options: GRADE_1_4 }],
        },
        {
          type: "single",
          key: "constipation",
          label: t("Obstipação (prisão de ventre)", "Estreñido/a", "Constipation"),
          options: YES_NO,
        },
        { type: "single", key: "hemorrhoids", label: t("Hemorroidas", "Hemorroides", "Haemorrhoids"), options: YES_NO },
        { type: "text", key: "menstrualCycle", label: t("Ciclo menstrual", "Ciclo menstrual", "Menstrual cycle") },
      ],
    },
  ],
};

// ─── Questionário alimentar (Cuestionario de Evaluación Nutricional) ───────────

const NUTRITION: QuestionnaireDefinition = {
  kind: "nutrition",
  header: t("TiagoLifeStyle", "TiagoLifeStyle", "TiagoLifeStyle"),
  title: t("Questionário de Avaliação Nutricional", "Cuestionario de Evaluación Nutricional", "Nutrition Assessment Questionnaire"),
  intro: t(
    "Este questionário permite-nos conhecer melhor o teu estilo de vida, hábitos alimentares e objetivos, para construirmos juntos um plano nutricional verdadeiramente adaptado a ti. Responde com sinceridade — não existem respostas certas ou erradas.",
    "Este cuestionario nos permite conocer mejor tu estilo de vida, hábitos alimentarios y objetivos, para construir juntos un plan nutricional verdaderamente adaptado a ti. Responde con sinceridad — no existen respuestas correctas o incorrectas.",
    "This questionnaire helps us get to know your lifestyle, eating habits and goals better, so we can build together a nutrition plan that is truly tailored to you. Answer honestly — there are no right or wrong answers."
  ),
  sections: [
    {
      number: 1,
      title: t("Dados pessoais", "Datos personales", "Personal details"),
      fields: [
        { type: "text", key: "name", label: t("Nome", "Nombre", "Name"), prefill: "name" },
        { type: "text", key: "birthDate", label: t("Data de nascimento", "Fecha de nacimiento", "Date of birth") },
        { type: "text", key: "height", label: t("Altura (cm)", "Altura (cm)", "Height (cm)"), numeric: true },
        { type: "text", key: "weight", label: t("Peso atual (kg)", "Peso actual (kg)", "Current weight (kg)"), numeric: true },
        { type: "text", key: "occupation", label: t("Profissão", "Profesión", "Occupation") },
        { type: "text", key: "contact", label: t("Telefone / e-mail", "Teléfono / correo", "Phone / email"), prefill: "email" },
        {
          type: "text",
          key: "completedOn",
          label: t("Data de preenchimento", "Fecha de realización", "Date completed"),
          prefill: "today",
        },
      ],
    },
    {
      number: 2,
      title: t("Historial de saúde", "Historial de salud", "Health history"),
      fields: [
        {
          type: "textarea",
          key: "conditions",
          label: t(
            "Tens alguma condição de saúde diagnosticada (ex.: diabetes, hipertensão, tiroide)?",
            "¿Tienes alguna condición de salud diagnosticada (ej.: diabetes, hipertensión, tiroides)?",
            "Do you have any diagnosed health condition (e.g. diabetes, high blood pressure, thyroid)?"
          ),
        },
        {
          type: "textarea",
          key: "medication",
          label: t(
            "Tomas atualmente algum medicamento ou suplemento?",
            "¿Tomas actualmente algún medicamento o suplemento?",
            "Are you currently taking any medication or supplements?"
          ),
        },
        {
          type: "textarea",
          key: "allergies",
          label: t(
            "Tens alergias ou intolerâncias alimentares?",
            "¿Tienes alergias o intolerancias alimentarias?",
            "Do you have any food allergies or intolerances?"
          ),
        },
        {
          type: "textarea",
          key: "pregnancy",
          label: t(
            "Estás grávida, a amamentar ou em pós-parto? Se sim, há quanto tempo?",
            "¿Estás embarazada, en lactancia, o en posparto? Si es así, ¿desde hace cuánto tiempo?",
            "Are you pregnant, breastfeeding or postpartum? If so, for how long?"
          ),
        },
        {
          type: "textarea",
          key: "surgery",
          label: t(
            "Fizeste alguma cirurgia relevante (ex.: bariátrica, abdominal)?",
            "¿Te has realizado alguna cirugía relevante (ej.: bariátrica, abdominal)?",
            "Have you had any relevant surgery (e.g. bariatric, abdominal)?"
          ),
        },
      ],
    },
    {
      number: 3,
      title: t("Hábitos alimentares atuais", "Hábitos alimentarios actuales", "Current eating habits"),
      fields: [
        {
          type: "text",
          key: "mealsPerDay",
          label: t(
            "Quantas refeições fazes por dia, em média?",
            "¿Cuántas comidas haces al día, en promedio?",
            "How many meals do you have a day, on average?"
          ),
        },
        {
          type: "text",
          key: "mealTimes",
          label: t(
            "A que horas costumas fazer a primeira e a última refeição?",
            "¿A qué hora sueles hacer la primera y la última comida?",
            "What time do you usually have your first and last meal?"
          ),
        },
        {
          type: "multi",
          key: "whoCooks",
          label: t(
            "Quem cozinha as tuas refeições no dia a dia?",
            "¿Quién cocina tus comidas en el día a día?",
            "Who cooks your meals day to day?"
          ),
          options: [
            opt("me", "Eu próprio/a", "Yo mismo/a", "Myself"),
            opt("someoneElse", "Outra pessoa em casa", "Otra persona en casa", "Someone else at home"),
            opt("eatOut", "Como fora de casa com frequência", "Como fuera de casa con frecuencia", "I often eat out"),
            opt("delivery", "Uso serviços de entrega de comida", "Uso servicios de entrega de comida", "I use food delivery services"),
          ],
        },
        {
          type: "multi",
          key: "dietPattern",
          label: t(
            "Segues algum tipo de dieta ou padrão alimentar?",
            "¿Sigues algún tipo de dieta o patrón alimentario?",
            "Do you follow any kind of diet or eating pattern?"
          ),
          options: [
            opt("omnivore", "Omnívoro", "Omnívoro", "Omnivore"),
            opt("vegetarian", "Vegetariano", "Vegetariano", "Vegetarian"),
            opt("vegan", "Vegano", "Vegano", "Vegan"),
            opt("glutenFree", "Sem glúten", "Sin gluten", "Gluten-free"),
            opt("lactoseFree", "Sem lactose", "Sin lactosa", "Lactose-free"),
            opt("other", "Outro", "Otro", "Other"),
          ],
          otherKey: "other",
        },
        {
          type: "textarea",
          key: "dislikes",
          label: t(
            "Alimentos de que NÃO gostas ou que não comes de forma nenhuma:",
            "Alimentos que NO te gustan o no comes de ninguna forma:",
            "Foods you DON'T like or won't eat at all:"
          ),
        },
        {
          type: "textarea",
          key: "favorites",
          label: t(
            "Alimentos favoritos que gostarias de manter no plano:",
            "Alimentos favoritos que te gustaría mantener en el plan:",
            "Favourite foods you'd like to keep in the plan:"
          ),
        },
        {
          type: "text",
          key: "waterGlasses",
          label: t(
            "Quantos copos de água bebes, em média, por dia?",
            "¿Cuántos vasos de agua bebes, en promedio, al día?",
            "How many glasses of water do you drink a day, on average?"
          ),
        },
        {
          type: "textarea",
          key: "drinks",
          label: t(
            "Consomes álcool, café ou bebidas açucaradas? Com que frequência?",
            "¿Consumes alcohol, café o bebidas azucaradas? ¿Con qué frecuencia?",
            "Do you drink alcohol, coffee or sugary drinks? How often?"
          ),
        },
      ],
    },
    {
      number: 4,
      title: t("Rotina e estilo de vida", "Rutina y estilo de vida", "Routine and lifestyle"),
      fields: [
        {
          type: "single",
          key: "dailyActivity",
          label: t(
            "Como descreverias o teu nível de atividade física diária (fora do treino)?",
            "¿Cómo describirías tu nivel de actividad física diaria (fuera del entrenamiento)?",
            "How would you describe your daily physical activity level (outside training)?"
          ),
          options: [
            opt(
              "sedentary",
              "Sedentário (trabalho sentado/a, pouco movimento)",
              "Sedentario (trabajo sentado/a, poco movimiento)",
              "Sedentary (desk job, little movement)"
            ),
            opt("moderate", "Moderadamente ativo", "Moderadamente activo", "Moderately active"),
            opt("very", "Muito ativo", "Muy activo", "Very active"),
          ],
        },
        {
          type: "text",
          key: "sleepHours",
          label: t(
            "Quantas horas dormes, em média, por noite?",
            "¿Cuántas horas duermes, en promedio, por noche?",
            "How many hours do you sleep a night, on average?"
          ),
        },
        {
          type: "single",
          key: "stress",
          label: t(
            "Como classificarias o teu nível de stress no dia a dia?",
            "¿Cómo clasificarías tu nivel de estrés en el día a día?",
            "How would you rate your day-to-day stress level?"
          ),
          options: [
            opt("low", "Baixo", "Bajo", "Low"),
            opt("moderate", "Moderado", "Moderado", "Moderate"),
            opt("high", "Alto", "Alto", "High"),
          ],
        },
        {
          type: "textarea",
          key: "workSchedule",
          label: t(
            "Tens horários de trabalho fixos ou variam (ex.: turnos)?",
            "¿Tienes horarios fijos de trabajo o varían (ej.: turnos)?",
            "Do you have fixed working hours or do they vary (e.g. shifts)?"
          ),
        },
      ],
    },
    {
      number: 5,
      title: t("Objetivos", "Objetivos", "Goals"),
      fields: [
        {
          type: "multi",
          key: "mainGoal",
          label: t(
            "Qual é o teu principal objetivo com este acompanhamento?",
            "¿Cuál es tu principal objetivo con este acompañamiento?",
            "What is your main goal with this coaching?"
          ),
          options: [
            opt("loseFat", "Perder peso / gordura corporal", "Perder peso / grasa corporal", "Lose weight / body fat"),
            opt("gainMuscle", "Ganhar massa muscular", "Ganar masa muscular", "Build muscle"),
            opt("definition", "Definição muscular", "Definición muscular", "Muscle definition"),
            opt("postpartum", "Recuperação pós-parto", "Recuperación posparto", "Postpartum recovery"),
            opt("health", "Melhorar a saúde geral / energia", "Mejorar salud general / energía", "Improve general health / energy"),
            opt("other", "Outro", "Otro", "Other"),
          ],
          otherKey: "other",
        },
        {
          type: "textarea",
          key: "previousDiet",
          label: t(
            "Já fizeste alguma dieta ou plano nutricional antes? Como correu?",
            "¿Has hecho alguna dieta o plan nutricional antes? ¿Cómo te fue?",
            "Have you followed a diet or nutrition plan before? How did it go?"
          ),
        },
        {
          type: "textarea",
          key: "difficulties",
          label: t(
            "Há alguma coisa que te tenha dificultado seguir planos no passado?",
            "¿Hay algo que te haya dificultado seguir planes en el pasado?",
            "Has anything made it hard for you to follow plans in the past?"
          ),
        },
        {
          type: "scale",
          key: "motivation",
          label: t(
            "Numa escala de 1 a 10, qual é o teu nível de motivação atual?",
            "En una escala del 1 al 10, ¿cuál es tu nivel de motivación actual?",
            "On a scale from 1 to 10, how motivated are you right now?"
          ),
          min: 1,
          max: 10,
        },
      ],
    },
    {
      number: 6,
      title: t("Observações finais", "Observaciones finales", "Final remarks"),
      fields: [
        {
          type: "textarea",
          key: "finalNotes",
          label: t(
            "Há mais alguma coisa que gostarias de partilhar antes de começar?",
            "¿Hay algo más que te gustaría compartir antes de empezar?",
            "Is there anything else you'd like to share before we start?"
          ),
        },
        { type: "signature", key: "signature", label: t("Assinatura", "Firma", "Signature") },
      ],
    },
  ],
};

export const QUESTIONNAIRES: Record<QuestionnaireKind, QuestionnaireDefinition> = {
  training: TRAINING,
  postpartum: POSTPARTUM,
  nutrition: NUTRITION,
};

// IMC a partir da altura (cm ou metros) e do peso (kg); null se faltar algum valor.
export function computeBmi(height: string | undefined, weight: string | undefined): string | null {
  const h = Number((height ?? "").replace(",", "."));
  const w = Number((weight ?? "").replace(",", "."));
  if (!h || !w) return null;
  const meters = h > 3 ? h / 100 : h;
  const bmi = w / (meters * meters);
  return Number.isFinite(bmi) && bmi > 0 ? bmi.toFixed(1) : null;
}

export function todayLabel(date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}
