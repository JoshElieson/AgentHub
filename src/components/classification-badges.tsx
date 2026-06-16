"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS, MODEL_LABELS, compatibleModels } from "@/lib/taxonomy";
import type { Category, SkillModel } from "@/lib/types";
import anthropicLogo from "@/logos/anthropic.svg";
import openaiLogo from "@/logos/openai.svg";
import googleLogo from "@/logos/google.svg";
import metaLogo from "@/logos/meta.svg";
import mistralLogo from "@/logos/mistral.svg";

/** Brand logo per model/provider. `universal` has no logo (it's hidden). */
const MODEL_LOGOS: Partial<Record<SkillModel, { src: string }>> = {
  anthropic: anthropicLogo,
  openai: openaiLogo,
  google: googleLogo,
  meta: metaLogo,
  mistral: mistralLogo,
};

/** gap-1.5 → 0.375rem → 6px; used to predict line width during measurement. */
const GAP_PX = 6;

const CATEGORY_PILL =
  "shrink-0 rounded-md border border-brand-line bg-brand-dim px-2 py-0.5 text-2xs font-medium text-brand-muted";
const MORE_PILL = "shrink-0 px-1 py-0.5 text-2xs font-medium text-faint";

function ModelPill({
  m,
  refCb,
}: {
  m: SkillModel;
  refCb?: (el: HTMLSpanElement | null) => void;
}) {
  const logo = MODEL_LOGOS[m];
  const label = MODEL_LABELS[m];
  return logo ? (
    <span
      ref={refCb}
      title={label}
      className="inline-flex shrink-0 items-center rounded-md border border-line bg-surface-2 px-2 py-1"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo.src} alt={label} className="h-3.5 w-auto" />
    </span>
  ) : (
    <span
      ref={refCb}
      className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-0.5 text-2xs font-medium text-subtle"
    >
      {label}
    </span>
  );
}

/**
 * Category + model classification chips, kept on a single line. The category
 * pill (brand accent) and each compatible model logo share one row; a
 * `universal` package expands to every known provider (see
 * {@link compatibleModels}). When the row would overflow its container, the
 * trailing logos that don't fit are dropped and a borderless "+N more" pill
 * (matching the tag list) takes their place so the chips never wrap onto a
 * second line.
 */
export function ClassificationBadges({
  category,
  model,
  className,
}: {
  category?: Category;
  model?: SkillModel[];
  className?: string;
}) {
  // Memoised on a stable key so the measurement effect doesn't reconnect its
  // ResizeObserver on every render (compatibleModels returns a fresh array).
  const modelKey = (model ?? []).join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const models = useMemo(() => compatibleModels(model), [modelKey]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLSpanElement>(null);
  const moreRef = useRef<HTMLSpanElement>(null);
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [visible, setVisible] = useState(models.length);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const compute = () => {
      const avail = wrap.clientWidth;
      if (avail === 0) return;
      const catW = category ? (catRef.current?.offsetWidth ?? 0) : 0;
      const moreW = moreRef.current?.offsetWidth ?? 0;
      const widths = models.map((_, i) => measureRefs.current[i]?.offsetWidth ?? 0);

      // Does the whole row fit without a "More…" pill?
      let used = catW;
      let allFit = true;
      for (const w of widths) {
        used += GAP_PX + w;
        if (used > avail) {
          allFit = false;
          break;
        }
      }
      if (allFit) {
        setVisible(widths.length);
        return;
      }

      // Otherwise fit as many logos as possible while reserving the More pill.
      used = catW;
      let count = 0;
      for (const w of widths) {
        if (used + GAP_PX + w + GAP_PX + moreW > avail) break;
        used += GAP_PX + w;
        count++;
      }
      setVisible(count);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [category, models]);

  if (!category && models.length === 0) return null;

  const showMore = visible < models.length;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      {/* Hidden measurement row: every pill at natural width, off the flow. */}
      <div
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 flex flex-nowrap items-center gap-1.5"
      >
        {category && (
          <span ref={catRef} className={CATEGORY_PILL}>
            {CATEGORY_LABELS[category]}
          </span>
        )}
        {models.map((m, i) => (
          <ModelPill
            key={m}
            m={m}
            refCb={(el) => {
              measureRefs.current[i] = el;
            }}
          />
        ))}
        {/* Worst-case width so the reserve never under-counts. */}
        <span ref={moreRef} className={MORE_PILL}>
          +{models.length} more
        </span>
      </div>

      {/* Visible row: clipped to a single line. */}
      <div className="flex flex-nowrap items-center gap-1.5 overflow-hidden">
        {category && (
          <span className={CATEGORY_PILL}>{CATEGORY_LABELS[category]}</span>
        )}
        {models.slice(0, visible).map((m) => (
          <ModelPill key={m} m={m} />
        ))}
        {showMore && (
          <span className={MORE_PILL}>+{models.length - visible} more</span>
        )}
      </div>
    </div>
  );
}
