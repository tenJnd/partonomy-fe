import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import type { Database } from "../../../lib/database.types";

type Part = Database["public"]["Tables"]["parts"]["Row"];

export function usePartRender(args: {
  selectedPartId: string | null;
  parts: Part[];
  normalContainerRef: React.RefObject<HTMLDivElement>;
  fullscreenContainerRef: React.RefObject<HTMLDivElement>;
}) {
  const { selectedPartId, parts, normalContainerRef, fullscreenContainerRef } = args;

  const [partRenderUrl, setPartRenderUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedPartId) return;

    const fetchPartRender = async () => {
      setImageLoading(true);
      setPartRenderUrl(null);
      setImageAspectRatio(null);

      const part = parts.find((p) => p.id === selectedPartId);
      if (!part?.render_bucket || !part?.render_storage_key) {
        setImageLoading(false);
        return;
      }

      const { data, error } = await supabase.storage
        .from(part.render_bucket)
        .createSignedUrl(part.render_storage_key, 3600);

      if (error) {
        console.error("Error fetching render:", error);
      } else if (data?.signedUrl) {
        setPartRenderUrl(data.signedUrl);

        const img = new Image();
        img.onload = () => {
          setImageAspectRatio(img.width / img.height);

          if (normalContainerRef.current) {
            normalContainerRef.current.scrollTop = 0;
            normalContainerRef.current.scrollLeft = 0;
          }
          if (fullscreenContainerRef.current) {
            fullscreenContainerRef.current.scrollTop = 0;
            fullscreenContainerRef.current.scrollLeft = 0;
          }
        };
        img.src = data.signedUrl;
      }

      setImageLoading(false);
    };

    fetchPartRender();
  }, [selectedPartId, parts, normalContainerRef, fullscreenContainerRef]);

  return { partRenderUrl, imageLoading, imageAspectRatio };
}
