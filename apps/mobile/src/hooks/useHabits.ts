import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Habit } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

// O que o cliente marca fica só neste telemóvel, numa chave do dia de hoje.
// Ao mudar de dia (meia-noite) começa tudo como pendente e os dias anteriores são apagados.
const STORAGE_PREFIX = "mentor-habits:";

function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [today, setToday] = useState(localToday);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.from("habits").select("*").order("order_index", { ascending: true });
    setHabits((data ?? []) as Habit[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Verifica a mudança de dia de minuto a minuto, para o reset acontecer mesmo com o ecrã aberto.
  useEffect(() => {
    const timer = setInterval(() => setToday(localToday()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const key = `${STORAGE_PREFIX}${today}`;
    AsyncStorage.getItem(key)
      .then((saved) => setDone(saved ? (JSON.parse(saved) as string[]) : []))
      .catch(() => setDone([]));
    AsyncStorage.getAllKeys()
      .then((keys) => {
        const old = keys.filter((k) => k.startsWith(STORAGE_PREFIX) && k !== key);
        if (old.length) AsyncStorage.multiRemove(old);
      })
      .catch(() => {});
  }, [today]);

  function toggle(habitId: string) {
    const currentDay = localToday();
    // Se o dia mudou entretanto, recomeça do zero antes de marcar.
    const base = currentDay === today ? done : [];
    const next = base.includes(habitId) ? base.filter((id) => id !== habitId) : [...base, habitId];
    if (currentDay !== today) setToday(currentDay);
    setDone(next);
    AsyncStorage.setItem(`${STORAGE_PREFIX}${currentDay}`, JSON.stringify(next)).catch(() => {});
  }

  return { habits, done, toggle, isLoading, refresh: load };
}
