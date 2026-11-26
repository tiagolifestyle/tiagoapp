"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  QUESTIONNAIRES,
  QUESTIONNAIRE_KINDS,
  pickQText,
  type QField,
  type QuestionnaireAnswers,
  type QuestionnaireKind,
  type QuestionnaireResponse,
} from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card } from "@/components/Card";

const KIND_LABELS: Record<QuestionnaireKind, string> = {
  training: "Questionário de treino",
  postpartum: "Questionário pós-parto",
  nutrition: "Questionário alimentar",
};

function text(answers: QuestionnaireAnswers, key: string): string {
  const value = answers[key];
  return typeof value === "string" ? value.trim() : "";
}

// Resposta legível (em português) de um campo simples; "" se não respondeu.
function answerText(field: QField, answers: QuestionnaireAnswers): string {
  switch (field.type) {
    case "text":
    case "textarea":
    case "scale":
    case "bmi":
      return text(answers, field.key);
    case "single": {
      const value = text(answers, field.key);
      const option = field.options.find((o) => o.key === value);
      return option ? pickQText(option.label, "pt") : value;
    }
    case "multi": {
      const values = Array.isArray(answers[field.key]) ? (answers[field.key] as string[]) : [];
      const labels = values.map((value) => {
        const option = field.options.find((o) => o.key === value);
        const label = option ? pickQText(option.label, "pt") : value;
        const other = text(answers, `${field.key}.other`);
        return value === field.otherKey && other ? `${label}: ${other}` : label;
      });
      return labels.join(", ");
    }
    default:
      return "";
  }
}

function Answer({ value }: { value: string }) {
  return value ? (
    <p className="whitespace-pre-wrap text-sm text-foreground">{value}</p>
  ) : (
    <p className="text-sm text-muted">—</p>
  );
}

function FieldAnswer({ field, answers }: { field: QField; answers: QuestionnaireAnswers }) {
  if (field.type === "info") return null;

  if (field.type === "grid") {
    const filledRows = field.rows.filter((row) =>
      field.columns.some((column) => text(answers, `${field.key}.${row.key}.${column.key}`))
    );
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted">{pickQText(field.label, "pt")}</p>
        {filledRows.length === 0 ? (
          <p className="text-sm text-muted">—</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-muted">
                <th className="py-1 pr-3 font-medium" />
                {field.columns.map((column) => (
                  <th key={column.key} className="py-1 pr-3 font-medium">
                    {pickQText(column.label, "pt")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filledRows.map((row) => (
                <tr key={row.key} className="border-t border-border">
                  <td className="py-1.5 pr-3 font-medium text-accent">{pickQText(row.label, "pt")}</td>
                  {field.columns.map((column) => {
                    const value = text(answers, `${field.key}.${row.key}.${column.key}`);
                    const label =
                      column.type === "single"
                        ? pickQText(column.options.find((o) => o.key === value)?.label ?? { pt: value, es: value, en: value }, "pt")
                        : value;
                    return (
                      <td key={column.key} className="py-1.5 pr-3 text-foreground">
                        {label || "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  if (field.type === "consent") {
    const accepted = text(answers, `${field.key}.accepted`) === "yes";
    const name = text(answers, `${field.key}.name`);
    const date = text(answers, `${field.key}.date`);
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted">Declaração e consentimento</p>
        <p className={`text-sm font-medium ${accepted ? "text-success" : "text-muted"}`}>
          {accepted ? "✓ Aceite" : "Não aceite"}
          {name ? ` — ${name}` : ""}
          {date ? ` — ${date}` : ""}
        </p>
      </div>
    );
  }

  if (field.type === "signature") {
    const name = text(answers, `${field.key}.name`);
    const date = text(answers, `${field.key}.date`);
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted">{pickQText(field.label, "pt")}</p>
        <Answer value={[name, date].filter(Boolean).join(" — ")} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs font-medium text-muted">{pickQText(field.label, "pt")}</p>
      <Answer value={answerText(field, answers)} />
    </div>
  );
}

export function QuestionnairesTab({ clientId }: { clientId: string }) {
  const [responses, setResponses] = useState<QuestionnaireResponse[] | null>(null);
  const [open, setOpen] = useState<QuestionnaireKind | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase
      .from("questionnaire_responses")
      .select("*")
      .eq("client_id", clientId)
      .then(({ data }) => setResponses((data ?? []) as QuestionnaireResponse[]));
  }, [clientId]);

  if (!responses) return <p className="text-sm text-muted">A carregar…</p>;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        O cliente preenche estes questionários na app (Perfil → Questionários) e pode atualizá-los quando quiser.
      </p>
      {QUESTIONNAIRE_KINDS.map((kind) => {
        const response = responses.find((r) => r.kind === kind);
        const definition = QUESTIONNAIRES[kind];
        const isOpen = open === kind;
        return (
          <Card key={kind} className="flex flex-col gap-4">
            <button
              onClick={() => response && setOpen(isOpen ? null : kind)}
              className="flex items-center justify-between gap-3 text-left"
              disabled={!response}
            >
              <div>
                <p className="font-semibold text-foreground">{KIND_LABELS[kind]}</p>
                <p className={`mt-0.5 text-xs ${response ? "text-success" : "text-muted"}`}>
                  {response
                    ? `Preenchido · última atualização ${new Date(response.updated_at).toLocaleDateString("pt-PT")}`
                    : "Por preencher"}
                </p>
              </div>
              {response && (isOpen ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />)}
            </button>

            {response && isOpen && (
              <div className="flex flex-col gap-6 border-t border-border pt-4">
                {definition.sections.map((section, index) => (
                  <div key={index} className="flex flex-col gap-3">
                    {section.title && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                        {section.number ? `${section.number}. ` : ""}
                        {pickQText(section.title, "pt")}
                      </p>
                    )}
                    {section.fields.map((field, fieldIndex) => (
                      <FieldAnswer
                        key={"key" in field ? field.key : `info-${fieldIndex}`}
                        field={field}
                        answers={response.answers ?? {}}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
