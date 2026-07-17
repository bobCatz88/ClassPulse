import type {
  AnalysisConfidence,
  AnalyzeRequest,
  DiagnosticQuestion,
  LearningIssue,
  LessonRescue,
  LessonRescueStep,
  ReflectionAnalysis,
  ReflectionObservation,
} from "./types";

export const MAX_TRANSCRIPT_LENGTH = 20_000;
export const MAX_CLASS_ID_LENGTH = 100;

const confidenceValues = new Set<AnalysisConfidence>([
  "high",
  "medium",
  "low",
]);

export const reflectionAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "summary",
    "observations",
    "learningIssues",
    "diagnosticQuestions",
    "lessonRescue",
  ],
  properties: {
    summary: { type: "string" },
    observations: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["text", "evidence", "confidence"],
        properties: {
          text: { type: "string" },
          evidence: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    learningIssues: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "evidence", "confidence"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          evidence: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    diagnosticQuestions: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "question", "options", "allowUnsure"],
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          options: {
            type: "array",
            minItems: 2,
            maxItems: 4,
            items: { type: "string" },
          },
          allowUnsure: { type: "boolean" },
        },
      },
    },
    lessonRescue: {
      type: "object",
      additionalProperties: false,
      required: [
        "durationMinutes",
        "objective",
        "materials",
        "steps",
        "alternativeExplanation",
        "exitQuestions",
      ],
      properties: {
        durationMinutes: { type: "integer", enum: [5, 10, 15] },
        objective: { type: "string" },
        materials: {
          type: "array",
          maxItems: 6,
          items: { type: "string" },
        },
        steps: {
          type: "array",
          minItems: 1,
          maxItems: 6,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "instruction", "durationMinutes"],
            properties: {
              title: { type: "string" },
              instruction: { type: "string" },
              durationMinutes: {
                type: "integer",
                minimum: 1,
                maximum: 15,
              },
            },
          },
        },
        alternativeExplanation: { type: "string" },
        exitQuestions: {
          type: "array",
          minItems: 2,
          maxItems: 4,
          items: { type: "string" },
        },
      },
    },
  },
} as const;

export type AnalyzeRequestValidation =
  | { success: true; data: AnalyzeRequest }
  | { success: false; details: Record<string, string> };

export function validateAnalyzeRequest(
  value: unknown,
): AnalyzeRequestValidation {
  if (!isRecord(value)) {
    return {
      success: false,
      details: { body: "Badan permintaan mestilah objek JSON." },
    };
  }

  const details: Record<string, string> = {};
  const classId = typeof value.classId === "string" ? value.classId.trim() : "";
  const transcript =
    typeof value.transcript === "string" ? normalizeWhitespace(value.transcript) : "";

  if (!classId) {
    details.classId = "classId diperlukan.";
  } else if (classId.length > MAX_CLASS_ID_LENGTH) {
    details.classId = `classId tidak boleh melebihi ${MAX_CLASS_ID_LENGTH} aksara.`;
  }

  if (!transcript) {
    details.transcript = "Transkrip diperlukan.";
  } else if (transcript.length < 3) {
    details.transcript = "Transkrip terlalu pendek untuk dianalisis.";
  } else if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    details.transcript = `Transkrip tidak boleh melebihi ${MAX_TRANSCRIPT_LENGTH} aksara.`;
  }

  if (Object.keys(details).length > 0) {
    return { success: false, details };
  }

  return { success: true, data: { classId, transcript } };
}

export function createDemoReflectionAnalysis(
  request: AnalyzeRequest,
): ReflectionAnalysis {
  const evidence = truncate(request.transcript, 220);
  const lowerTranscript = request.transcript.toLocaleLowerCase("ms-MY");

  const explicitlyUnclear =
    /(?:tak|tidak|belum)\s+(?:faham|jelas)|keliru|sukar|susah|confus/.test(
      lowerTranscript,
    );
  const participationConcern =
    /diam|senyap|tak menjawab|tidak menjawab|kurang (?:aktif|terlibat)|tak angkat tangan/.test(
      lowerTranscript,
    );
  const pacingConcern =
    /terlalu cepat|tak sempat|tidak sempat|masa (?:tak|tidak) cukup/.test(
      lowerTranscript,
    );

  const observations: ReflectionObservation[] = [
    {
      text: explicitlyUnclear
        ? "Refleksi guru menyebut tanda bahawa kefahaman murid masih belum kukuh."
        : "Guru telah merekodkan pemerhatian selepas sesi pengajaran.",
      evidence,
      confidence: explicitlyUnclear ? "high" : "medium",
    },
  ];

  if (participationConcern) {
    observations.push({
      text: "Refleksi menyebut penglibatan atau respons murid yang terhad.",
      evidence,
      confidence: "high",
    });
  }

  if (pacingConcern) {
    observations.push({
      text: "Refleksi menyebut kekangan masa atau kadar penyampaian."
      ,evidence,
      confidence: "high",
    });
  }

  const learningIssues: LearningIssue[] = [
    explicitlyUnclear
      ? {
          title: "Kefahaman konsep perlu diperkukuh",
          description:
            "Kenal pasti salah faham khusus sebelum memilih penerangan semula. Dapatan ini masih memerlukan pengesahan guru.",
          evidence,
          confidence: "medium",
        }
      : {
          title: "Tahap kefahaman belum disahkan",
          description:
            "Transkrip belum memberikan bukti yang cukup untuk menentukan konsep khusus yang bermasalah. Gunakan semakan pantas pada awal kelas seterusnya.",
          evidence,
          confidence: "low",
        },
  ];

  if (participationConcern) {
    learningIssues.push({
      title: "Penglibatan murid perlu diperiksa",
      description:
        "Respons yang terhad tidak semestinya bermakna murid tidak faham. Bezakan isu keyakinan, arahan dan kefahaman melalui pilihan respons yang mudah.",
      evidence,
      confidence: "medium",
    });
  }

  return {
    summary: buildDemoSummary(request.transcript),
    observations,
    learningIssues,
    diagnosticQuestions: buildDemoQuestions(),
    lessonRescue: buildDemoLessonRescue(),
  };
}

export function parseReflectionAnalysis(value: unknown): ReflectionAnalysis {
  if (!isRecord(value)) {
    throw new Error("Analisis bukan objek JSON yang sah.");
  }

  const observations = readArray(
    value.observations,
    "observations",
    readObservation,
    6,
  );
  const learningIssues = readArray(
    value.learningIssues,
    "learningIssues",
    readLearningIssue,
    5,
  );
  const diagnosticQuestions = readArray(
    value.diagnosticQuestions,
    "diagnosticQuestions",
    readDiagnosticQuestion,
    3,
  );

  return {
    summary: readString(value.summary, "summary"),
    observations,
    learningIssues,
    diagnosticQuestions,
    lessonRescue: readLessonRescue(value.lessonRescue),
  };
}

function buildDemoSummary(transcript: string): string {
  const conciseTranscript = truncate(transcript, 260);
  return `Refleksi guru direkodkan untuk semakan: “${conciseTranscript}” Dapatan awal ini perlu disahkan oleh guru sebelum digunakan.`;
}

function buildDemoQuestions(): DiagnosticQuestion[] {
  return [
    {
      id: "evidence-of-understanding",
      question: "Apakah bukti paling jelas tentang tahap kefahaman murid?",
      options: [
        "Jawapan lisan murid",
        "Hasil latihan atau lembaran kerja",
        "Respons semasa aktiviti",
        "Tidak pasti",
      ],
      allowUnsure: true,
    },
    {
      id: "affected-group",
      question: "Siapakah yang paling memerlukan sokongan seterusnya?",
      options: [
        "Kebanyakan kelas",
        "Satu kumpulan kecil",
        "Beberapa individu",
        "Tidak pasti",
      ],
      allowUnsure: true,
    },
    {
      id: "main-barrier",
      question: "Apakah halangan yang paling mungkin berdasarkan bukti anda?",
      options: [
        "Konsep asas belum kukuh",
        "Arahan atau contoh kurang jelas",
        "Masa latihan tidak mencukupi",
        "Tidak pasti",
      ],
      allowUnsure: true,
    },
  ];
}

function buildDemoLessonRescue(): LessonRescue {
  return {
    durationMinutes: 10,
    objective:
      "Mengesan salah faham utama dan membetulkannya melalui penerangan ringkas serta respons aktif.",
    materials: [
      "Papan putih atau satu slaid ringkas",
      "Kertas kecil atau borang respons digital",
    ],
    steps: [
      {
        title: "Semak pantas",
        instruction:
          "Tunjukkan satu soalan asas dan minta semua murid memilih jawapan secara serentak tanpa menyebut nama.",
        durationMinutes: 2,
      },
      {
        title: "Fikir dan bincang",
        instruction:
          "Murid terangkan sebab pilihan kepada pasangan. Guru dengar dua pola salah faham yang berulang.",
        durationMinutes: 3,
      },
      {
        title: "Terangkan semula",
        instruction:
          "Gunakan contoh harian yang ringkas, kemudian tunjukkan satu contoh dan satu bukan contoh.",
        durationMinutes: 3,
      },
      {
        title: "Exit ticket",
        instruction:
          "Murid jawab satu soalan aplikasi dan nyatakan satu bahagian yang masih belum jelas.",
        durationMinutes: 2,
      },
    ],
    alternativeExplanation:
      "Gunakan analogi ‘peta dan destinasi’: konsep ialah destinasi, manakala setiap langkah penyelesaian ialah simpang yang perlu dipilih berdasarkan satu petunjuk. Minta murid menyebut petunjuk pada setiap simpang.",
    exitQuestions: [
      "Apakah idea utama pelajaran ini dalam satu ayat?",
      "Mengapa jawapan atau langkah ini betul?",
      "Bahagian manakah yang masih memerlukan contoh lain?",
    ],
  };
}

function readObservation(value: unknown): ReflectionObservation {
  if (!isRecord(value)) {
    throw new Error("Pemerhatian tidak sah.");
  }

  return {
    text: readString(value.text, "observation.text"),
    evidence: readString(value.evidence, "observation.evidence"),
    confidence: readConfidence(value.confidence),
  };
}

function readLearningIssue(value: unknown): LearningIssue {
  if (!isRecord(value)) {
    throw new Error("Isu pembelajaran tidak sah.");
  }

  return {
    title: readString(value.title, "learningIssue.title"),
    description: readString(value.description, "learningIssue.description"),
    evidence: readString(value.evidence, "learningIssue.evidence"),
    confidence: readConfidence(value.confidence),
  };
}

function readDiagnosticQuestion(value: unknown): DiagnosticQuestion {
  if (!isRecord(value)) {
    throw new Error("Soalan diagnostik tidak sah.");
  }

  if (typeof value.allowUnsure !== "boolean") {
    throw new Error("diagnosticQuestion.allowUnsure tidak sah.");
  }

  const options = readStringArray(value.options, "diagnosticQuestion.options", 4);
  if (options.length < 2) {
    throw new Error("Soalan diagnostik memerlukan sekurang-kurangnya dua pilihan.");
  }

  return {
    id: readString(value.id, "diagnosticQuestion.id"),
    question: readString(value.question, "diagnosticQuestion.question"),
    options,
    allowUnsure: value.allowUnsure,
  };
}

function readLessonRescue(value: unknown): LessonRescue {
  if (!isRecord(value)) {
    throw new Error("Pelan Lesson Rescue tidak sah.");
  }

  const durationMinutes = value.durationMinutes;
  if (durationMinutes !== 5 && durationMinutes !== 10 && durationMinutes !== 15) {
    throw new Error("lessonRescue.durationMinutes tidak sah.");
  }

  const steps = readArray(value.steps, "lessonRescue.steps", readLessonStep, 6);
  if (steps.length === 0) {
    throw new Error("Lesson Rescue mesti mempunyai sekurang-kurangnya satu langkah.");
  }

  const exitQuestions = readStringArray(
    value.exitQuestions,
    "lessonRescue.exitQuestions",
    4,
  );
  if (exitQuestions.length < 2) {
    throw new Error("Lesson Rescue memerlukan sekurang-kurangnya dua soalan keluar.");
  }

  return {
    durationMinutes,
    objective: readString(value.objective, "lessonRescue.objective"),
    materials: readStringArray(value.materials, "lessonRescue.materials", 6),
    steps,
    alternativeExplanation: readString(
      value.alternativeExplanation,
      "lessonRescue.alternativeExplanation",
    ),
    exitQuestions,
  };
}

function readLessonStep(value: unknown): LessonRescueStep {
  if (!isRecord(value)) {
    throw new Error("Langkah Lesson Rescue tidak sah.");
  }

  const durationMinutes = value.durationMinutes;
  if (
    typeof durationMinutes !== "number" ||
    !Number.isInteger(durationMinutes) ||
    durationMinutes < 1 ||
    durationMinutes > 15
  ) {
    throw new Error("lessonRescue.step.durationMinutes tidak sah.");
  }

  return {
    title: readString(value.title, "lessonRescue.step.title"),
    instruction: readString(
      value.instruction,
      "lessonRescue.step.instruction",
    ),
    durationMinutes,
  };
}

function readArray<T>(
  value: unknown,
  field: string,
  reader: (item: unknown) => T,
  maxItems: number,
): T[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new Error(`${field} tidak sah.`);
  }

  return value.map(reader);
}

function readStringArray(
  value: unknown,
  field: string,
  maxItems: number,
): string[] {
  return readArray(value, field, (item) => readString(item, field), maxItems);
}

function readString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} tidak sah.`);
  }

  return value.trim();
}

function readConfidence(value: unknown): AnalysisConfidence {
  if (typeof value !== "string" || !confidenceValues.has(value as AnalysisConfidence)) {
    throw new Error("Nilai confidence tidak sah.");
  }

  return value as AnalysisConfidence;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number): string {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}
