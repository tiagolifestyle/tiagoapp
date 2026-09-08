import { useEffect, useState } from "react";
import type { PostpartumContentCard } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export function usePostpartumContent() {
  const [cards, setCards] = useState<PostpartumContentCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("postpartum_content_cards")
      .select("*")
      .order("category", { ascending: true })
      .order("order_index", { ascending: true })
      .then(({ data }) => {
        setCards((data ?? []) as PostpartumContentCard[]);
        setIsLoading(false);
      });
  }, []);

  return { cards, isLoading };
}
