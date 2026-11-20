"use client";

import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Trophy } from "lucide-react";
import type { ClientSex, ExerciseRecord } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export interface RecordExercise {
  id: string;
  name: string;
  image_url: string | null;
}

export interface RecordClient {
  id: string;
  sex: ClientSex | null;
  name: string;
}

const GENDER_LABELS: Record<ClientSex, string> = { male: "Masculino", female: "Feminino" };

const inputClass =
  "rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

function RecordRowEditor({
  record,
  exercise,
  clients,
  isFirst,
  isLast,
  onMove,
  onDelete,
  onSaved,
}: {
  record: ExerciseRecord;
  exercise: RecordExercise | undefined;
  clients: RecordClient[];
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onSaved: (record: ExerciseRecord) => void;
}) {
  const [holderId, setHolderId] = useState(record.holder_client_id ?? "");
  const [weight, setWeight] = useState(record.weight_kg != null ? String(record.weight_kg) : "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Clientes do mesmo sexo; o atual detentor fica sempre na lista, mesmo que o sexo tenha mudado.
  const options = clients.filter((client) => client.sex === record.gender || client.id === record.holder_client_id);

  async function handleSave() {
    const parsed = weight ? Number(weight.replace(",", ".")) : null;
    if (holderId && (parsed == null || Number.isNaN(parsed) || parsed <= 0)) {
      setMessage({ text: "Escreve o peso do recorde.", error: true });
      return;
    }
    setSaving(true);
    setMessage(null);
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase
      .from("exercise_records")
      .update({ holder_client_id: holderId || null, weight_kg: holderId ? parsed : null })
      .eq("id", record.id)
      .select()
      .single();
    setSaving(false);
    if (error) setMessage({ text: error.message, error: true });
    else {
      onSaved(data as ExerciseRecord);
      setMessage({ text: "Guardado", error: false });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-col">
        <button onClick={() => onMove(-1)} disabled={isFirst} className="text-muted hover:text-foreground disabled:opacity-30" title="Subir">
          <ArrowUp size={14} />
        </button>
        <button onClick={() => onMove(1)} disabled={isLast} className="text-muted hover:text-foreground disabled:opacity-30" title="Descer">
          <ArrowDown size={14} />
        </button>
      </div>
      {exercise?.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={exercise.image_url} alt="" className="h-12 w-12 rounded-xl bg-white object-contain" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated">
          <Trophy size={18} className="text-accent" />
        </div>
      )}
      <p className="min-w-40 flex-1 font-medium text-foreground">{exercise?.name ?? "Exercício eliminado"}</p>

      <select value={holderId} onChange={(e) => setHolderId(e.target.value)} className={`${inputClass} w-48`}>
        <option value="">— Sem recorde —</option>
        {options.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-1">
        <input
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="0"
          className={`${inputClass} w-20`}
          disabled={!holderId}
        />
        <span className="text-sm text-muted">kg</span>
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "A guardar…" : "Guardar"}
      </button>
      <button onClick={onDelete} className="text-muted hover:text-danger" title="Tirar dos recordes">
        <Trash2 size={16} />
      </button>
      {message && <p className={`w-full text-xs ${message.error ? "text-danger" : "text-success"}`}>{message.text}</p>}
    </div>
  );
}

function GenderSection({
  gender,
  records,
  exercises,
  clients,
  onChange,
}: {
  gender: ClientSex;
  records: ExerciseRecord[];
  exercises: RecordExercise[];
  clients: RecordClient[];
  onChange: (updater: (prev: ExerciseRecord[]) => ExerciseRecord[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState("");
  const [adding, setAdding] = useState(false);

  const list = records.filter((r) => r.gender === gender).sort((a, b) => a.order_index - b.order_index);
  const usedIds = new Set(list.map((r) => r.exercise_id));
  const available = exercises.filter(
    (exercise) => !usedIds.has(exercise.id) && exercise.name.toLowerCase().includes(search.trim().toLowerCase())
  );
  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const hasClientsWithSex = clients.some((client) => client.sex === gender);

  async function handleAdd() {
    if (!selectedExercise) return;
    setAdding(true);
    const supabase = createBrowserSupabaseClient();
    const nextOrder = list.reduce((max, r) => Math.max(max, r.order_index), -1) + 1;
    const { data, error } = await supabase
      .from("exercise_records")
      .insert({ exercise_id: selectedExercise, gender, order_index: nextOrder })
      .select()
      .single();
    setAdding(false);
    if (!error && data) {
      onChange((prev) => [...prev, data as ExerciseRecord]);
      setSelectedExercise("");
      setSearch("");
    }
  }

  async function handleDelete(record: ExerciseRecord) {
    const name = exerciseById.get(record.exercise_id)?.name ?? "este exercício";
    if (!confirm(`Tirar "${name}" dos recordes ${GENDER_LABELS[gender]}? O recorde atual também é apagado.`)) return;
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("exercise_records").delete().eq("id", record.id);
    if (!error) onChange((prev) => prev.filter((r) => r.id !== record.id));
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const reordered = [...list];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const renumbered = reordered.map((r, i) => ({ ...r, order_index: i }));
    const changed = renumbered.filter((r, i) => r.order_index !== reordered[i].order_index);
    onChange((prev) => prev.map((r) => renumbered.find((n) => n.id === r.id) ?? r));
    const supabase = createBrowserSupabaseClient();
    await Promise.all(
      changed.map((r) => supabase.from("exercise_records").update({ order_index: r.order_index }).eq("id", r.id))
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-foreground">{GENDER_LABELS[gender]}</h2>
      {!hasClientsWithSex && (
        <p className="text-xs text-warning">
          Ainda nenhum cliente tem o sexo &quot;{GENDER_LABELS[gender]}&quot; preenchido. Preenche-o na ficha do cliente
          (separador Info) para o poderes escolher aqui.
        </p>
      )}

      {list.length === 0 && (
        <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">Ainda não há exercícios.</p>
      )}
      {list.map((record, index) => (
        <RecordRowEditor
          key={record.id}
          record={record}
          exercise={exerciseById.get(record.exercise_id)}
          clients={clients}
          isFirst={index === 0}
          isLast={index === list.length - 1}
          onMove={(direction) => handleMove(index, direction)}
          onDelete={() => handleDelete(record)}
          onSaved={(saved) => onChange((prev) => prev.map((r) => (r.id === saved.id ? saved : r)))}
        />
      ))}

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed border-border p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Procurar na biblioteca…"
          className={`${inputClass} w-56`}
        />
        <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)} className={`${inputClass} min-w-56 flex-1`}>
          <option value="">Escolhe um exercício ({available.length})</option>
          {available.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={!selectedExercise || adding}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>
    </div>
  );
}

export function RecordsView({
  initialRecords,
  exercises,
  clients,
}: {
  initialRecords: ExerciseRecord[];
  exercises: RecordExercise[];
  clients: RecordClient[];
}) {
  const [records, setRecords] = useState(initialRecords);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Recordes</h1>
        <p className="mt-1 text-sm text-muted">
          Escolhe os exercícios da biblioteca e, depois de validares o vídeo, o cliente e o peso do recorde. Fica na app
          até alguém o bater. Quem desligou &quot;Aparecer no ranking&quot; aparece como Anónimo.
        </p>
      </div>
      <GenderSection gender="male" records={records} exercises={exercises} clients={clients} onChange={setRecords} />
      <GenderSection gender="female" records={records} exercises={exercises} clients={clients} onChange={setRecords} />
    </div>
  );
}
