import type { PosBatchPreview } from "./pos.types";

/** Each committed cart row owns its request; cleanup ignores late responses. */
export function startBatchPreviewRequest(
  load: () => Promise<PosBatchPreview | null>,
  receive: (preview: PosBatchPreview) => void,
  fail: () => void,
) {
  let cancelled = false;
  void (async () => {
    try {
      const preview = await load();
      if (!cancelled) {
        if (preview) receive(preview);
        else fail();
      }
    } catch {
      if (!cancelled) fail();
    }
  })();
  return () => { cancelled = true; };
}
