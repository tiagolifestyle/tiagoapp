import { useCallback, useEffect, useState } from "react";
import type { PhotoAngle, ProgressMetric, ProgressPhoto } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export interface ProgressPhotoWithUrl extends ProgressPhoto {
  signedUrl: string | null;
}

export function useProgress(clientId: string | undefined) {
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [photos, setPhotos] = useState<ProgressPhotoWithUrl[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);

    const [metricsResult, photosResult] = await Promise.all([
      supabase
        .from("progress_metrics")
        .select("*")
        .eq("client_id", clientId)
        .order("recorded_at", { ascending: true })
        .limit(30),
      supabase
        .from("progress_photos")
        .select("*")
        .eq("client_id", clientId)
        .order("taken_at", { ascending: false })
        .limit(60),
    ]);

    setMetrics((metricsResult.data ?? []) as ProgressMetric[]);

    const photoRows = (photosResult.data ?? []) as ProgressPhoto[];
    const withUrls = await Promise.all(
      photoRows.map(async (photo) => {
        const { data } = await supabase.storage.from("progress-photos").createSignedUrl(photo.storage_path, 3600);
        return { ...photo, signedUrl: data?.signedUrl ?? null };
      })
    );
    setPhotos(withUrls);

    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function logWeight(weightKg: number) {
    if (!clientId) return;
    await supabase.from("progress_metrics").insert({
      client_id: clientId,
      recorded_at: new Date().toISOString().slice(0, 10),
      weight_kg: weightKg,
    });
    await load();
  }

  async function logMeasurements(values: Record<string, number>) {
    if (!clientId) return;
    await supabase.from("progress_metrics").insert({
      client_id: clientId,
      recorded_at: new Date().toISOString().slice(0, 10),
      measurements: values,
    });
    await load();
  }

  async function uploadPhoto(angle: PhotoAngle, uri: string) {
    if (!clientId) return;
    const response = await fetch(uri);
    const blob = await response.blob();
    const path = `${clientId}/${Date.now()}-${angle}.jpg`;

    await supabase.storage.from("progress-photos").upload(path, blob, { contentType: "image/jpeg" });
    await supabase.from("progress_photos").insert({
      client_id: clientId,
      angle,
      storage_path: path,
      taken_at: new Date().toISOString().slice(0, 10),
    });
    await load();
  }

  return { metrics, photos, isLoading, refresh: load, logWeight, logMeasurements, uploadPhoto };
}
