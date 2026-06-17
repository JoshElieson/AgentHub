"use client";

import { useCallback, useState } from "react";
import { createCollection, addCollectionItem } from "@/lib/collections-data";
import {
  CollectionItemPicker,
  type PickerItem,
} from "@/components/collection-item-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CollectionKind } from "@/lib/types";
import {
  ArrowLeft,
  Check,
  Layers,
  Loader2,
  Package,
  Plug,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export function CreateCollectionModal({
  open,
  onClose,
  onCreated,
}: CreateCollectionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [kind, setKind] = useState<CollectionKind | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedItems, setSelectedItems] = useState<Map<string, PickerItem>>(
    new Map()
  );
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setStep(1);
    setKind(null);
    setName("");
    setDescription("");
    setSelectedItems(new Map());
    setSaving(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectKind = (k: CollectionKind) => {
    setKind(k);
    setStep(2);
  };

  const toggleItem = (item: PickerItem) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, item);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (!kind || !name.trim()) return;
    setSaving(true);

    try {
      const collection = await createCollection({
        name: name.trim(),
        kind,
        description: description.trim(),
      });

      if (collection) {
        // Add all selected items
        const items = Array.from(selectedItems.values());
        await Promise.all(
          items.map((item) =>
            addCollectionItem(collection.id, item.id, item.kind)
          )
        );

        onCreated?.(collection.id);
        handleClose();
      }
    } catch (err) {
      console.error("Failed to create collection:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-canvas/80 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 mx-4 flex w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-overlay animate-scale-in",
          step === 1 ? "max-w-lg" : "max-w-2xl"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-content"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-brand-muted" />
              <h2 className="text-base font-semibold text-content">
                {step === 1 ? "New Collection" : "Create Collection"}
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-content"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 ? (
            <StepOne onSelect={handleSelectKind} />
          ) : (
            <StepTwo
              kind={kind!}
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              selectedItems={selectedItems}
              onToggle={toggleItem}
            />
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="flex items-center justify-between border-t border-line px-6 py-4">
            <span className="text-xs text-subtle">
              {selectedItems.size}{" "}
              {selectedItems.size === 1 ? "item" : "items"} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="md" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCreate}
                disabled={!name.trim() || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Collection
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Choose type
// ---------------------------------------------------------------------------

function StepOne({
  onSelect,
}: {
  onSelect: (kind: CollectionKind) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        What kind of collection do you want to create?
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TypeCard
          icon={<Package className="h-6 w-6" />}
          title="Skill Collection"
          description="Group skills together. Users can install all skills in the collection with one click."
          accent="brand"
          onClick={() => onSelect("skills")}
        />
        <TypeCard
          icon={<Plug className="h-6 w-6" />}
          title="MCP Collection"
          description="Bundle MCP servers. Users get a merged config they can copy to set up all servers at once."
          accent="info"
          onClick={() => onSelect("mcps")}
        />
      </div>
    </div>
  );
}

function TypeCard({
  icon,
  title,
  description,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "brand" | "info";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex flex-col items-start rounded-xl border p-5 text-left transition-all duration-200",
        "hover:shadow-md",
        accent === "brand"
          ? "border-line hover:border-brand/40 hover:bg-brand-dim/20"
          : "border-line hover:border-info/40 hover:bg-info-dim/20"
      )}
    >
      <div
        className={cn(
          "grid h-12 w-12 place-items-center rounded-xl border transition-colors",
          accent === "brand"
            ? "border-brand-line bg-brand-dim text-brand-muted group-hover:bg-brand group-hover:text-white"
            : "border-info/30 bg-info-dim text-info group-hover:bg-info group-hover:text-white"
        )}
      >
        {icon}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-content">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Details + Item Picker
// ---------------------------------------------------------------------------

function StepTwo({
  kind,
  name,
  setName,
  description,
  setDescription,
  selectedItems,
  onToggle,
}: {
  kind: CollectionKind;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  selectedItems: Map<string, PickerItem>;
  onToggle: (item: PickerItem) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-subtle">
          Collection Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={
            kind === "skills"
              ? "e.g. My DevOps Toolkit"
              : "e.g. Essential MCP Servers"
          }
          className="mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-content placeholder:text-faint transition-colors focus:border-brand/60 focus:outline-none"
          autoFocus
        />
      </div>

      {/* Description (optional) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-subtle">
          Description{" "}
          <span className="font-normal normal-case text-faint">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A short description of this collection…"
          rows={2}
          className="mt-2 w-full resize-none rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-content placeholder:text-faint transition-colors focus:border-brand/60 focus:outline-none"
        />
      </div>

      {/* Item picker */}
      <div>
        <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-subtle">
          Add {kind === "skills" ? "Skills" : "MCP Servers"}
        </label>
        <CollectionItemPicker
          filterKind={kind}
          selected={new Set(selectedItems.keys())}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
}
