"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useEditor } from "@/store/editor";
import { updateRelation, deleteRelation, moveClass } from "@/lib/diagram";
import { CLASS_WIDTH, CLASS_HEIGHT } from "@/components/editor/canvas/constants";

type Kind = "ASSOCIATION" | "AGGREGATION" | "COMPOSITION" | "INHERITANCE" | "IMPLEMENTATION";

export default function RelationEditor() {
  const { diagramId } = useParams<{ diagramId: string }>();
  const dId = diagramId ? Number(diagramId) : undefined;

  const { edges, selectedRelationId, setSelectedRelation, setEdges, nodes } = useEditor();
  const rel = useMemo(() => edges.find((e: any) => e.id === selectedRelationId), [edges, selectedRelationId]);

  const [form, setForm] = useState<{
    kind: Kind;
    label: string;
    sourceMult: string;
    targetMult: string;
    navigableAToB: boolean;
    navigableBToA: boolean;
    associationClassId?: number | null;
  } | null>(null);

  // Defaults por tipo (editor). Ojo: en herencia/implementación → multiplicidad vacía "".
  const DEFAULTS: Record<Kind, { src: string; tgt: string; disableMult?: boolean }> = {
    ASSOCIATION: { src: "1", tgt: "0..*" },
    AGGREGATION: { src: "1", tgt: "0..*" },
    COMPOSITION: { src: "1..*", tgt: "1" },
    INHERITANCE: { src: "", tgt: "", disableMult: true },
    IMPLEMENTATION: { src: "", tgt: "", disableMult: true },
  };

  useEffect(() => {
    if (!rel) {
      setForm(null);
      return;
    }
    setForm({
      kind: (rel.kind as Kind) ?? "ASSOCIATION",
      label: (rel as any).sourceRole ?? "",
      sourceMult: rel.sourceMult ?? "",
      targetMult: rel.targetMult ?? "",
      navigableAToB: !!(rel as any).navigableAToB,
      navigableBToA: !!(rel as any).navigableBToA,
      associationClassId: (rel as any).associationClassId ?? null,
    });
  }, [rel]);

  if (!rel || !form) {
    return <div className="mt-3 text-sm opacity-80">Selecciona una relación desde el lienzo para editar…</div>;
  }

  const disableMult = DEFAULTS[form.kind]?.disableMult === true;
  const isMany = (m?: string) => !!m && m.includes("*");
  const isNM = isMany(form.sourceMult) && isMany(form.targetMult);

  // helper: no permitir seleccionar A/B como clase intermedia
  const isForbiddenAssoc = (id: number | null | undefined) => {
    if (id == null) return false;
    return id === rel.sourceClassId || id === rel.targetClassId;
  };

  async function onSave() {
    if (dId == null || Number.isNaN(dId)) {
      alert("DiagramId no definido");
      return;
    }
    
    if (!rel || !form) {
      return;
    }

    // Si es N-M y se eligió una clase intermedia inválida (A o B), corta
    if (isNM && isForbiddenAssoc(form.associationClassId)) {
      alert("La clase intermedia no puede ser la misma que el origen o el destino.");
      return;
    }

    const body: any = {
      kind: form.kind,
      sourceRole: form.label || null,
      sourceMult: disableMult ? "" : form.sourceMult || "",
      targetMult: disableMult ? "" : form.targetMult || "",
      navigableAToB: form.navigableAToB,
      navigableBToA: form.navigableBToA,
      // si dejó de ser N-M, reseteamos la classe intermedia
      associationClassId: isNM ? (form.associationClassId ?? null) : null,
    };

    try {
      await updateRelation(dId, rel.id, body);

      // auto-posicionar la clase intermedia cerca del punto medio si aplica
      if (isNM && body.associationClassId) {
        const src = nodes.find((n) => n.id === rel.sourceClassId);
        const tgt = nodes.find((n) => n.id === rel.targetClassId);
        const assoc = nodes.find((n) => n.id === body.associationClassId);
        if (src && tgt && assoc) {
          const cxA = src.x + (CLASS_WIDTH / 2);
          const cyA = src.y + (CLASS_HEIGHT / 2);
          const cxB = tgt.x + (CLASS_WIDTH / 2);
          const cyB = tgt.y + (CLASS_HEIGHT / 2);
          const mx = (cxA + cxB) / 2;
          const my = (cyA + cyB) / 2;

          const dx = assoc.x - mx;
          const dy = assoc.y - my;
          const dist2 = dx * dx + dy * dy;
          if (dist2 > 220 * 220) {
            // offset para no tapar la etiqueta
            await moveClass(assoc.id, Math.max(0, mx + 40), Math.max(0, my + 16));
          }
        }
      }

      setEdges(
        edges.map((e: any) =>
          e.id === rel.id
            ? {
                ...e,
                ...body,
              }
            : e
        )
      );
      setSelectedRelation(null);
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar la relación");
    }
  }

  async function onDelete() {
    if (!confirm("¿Eliminar relación?")) return;
    if (dId == null || Number.isNaN(dId)) return;
    if (!rel) return;
    try {
      await deleteRelation(dId, rel.id);
      setEdges(edges.filter((e: any) => e.id !== rel.id));
      setSelectedRelation(null);
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar la relación");
    }
  }

  return (
    <div className="mt-3 space-y-3 text-sm">
      <h3 className="font-medium">Relación #{rel.id}</h3>

      {/* Tipo */}
      <label className="block">
        <div className="text-xs text-muted-foreground mb-1">Tipo</div>
        <select
          value={form.kind}
          onChange={(e) => {
            const k = e.target.value as Kind;
            const d = DEFAULTS[k];
            setForm({
              ...form,
              kind: k,
              sourceMult: d.disableMult ? "" : d.src,
              targetMult: d.disableMult ? "" : d.tgt,
            });
          }}
          className="w-full rounded-xl bg-neutral-800 px-3 py-2"
        >
          <option value="ASSOCIATION">Asociación</option>
          <option value="AGGREGATION">Agregación</option>
          <option value="COMPOSITION">Composición</option>
          <option value="INHERITANCE">Herencia</option>
          <option value="IMPLEMENTATION">Implementación</option>
        </select>
      </label>

      {/* Etiqueta */}
      <label className="block">
        <div className="text-xs text-muted-foreground mb-1">Etiqueta (texto en la línea)</div>
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          className="w-full rounded-xl bg-neutral-800 px-3 py-2"
          placeholder='p. ej. "tiene"'
        />
      </label>

      {/* Multiplicidades */}
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Multiplicidad origen</div>
          <input
            value={form.sourceMult}
            onChange={(e) => setForm({ ...form, sourceMult: e.target.value })}
            className="w-full rounded-xl bg-neutral-800 px-3 py-2"
            placeholder="1, 0..*, etc."
            disabled={disableMult}
          />
        </label>
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Multiplicidad destino</div>
          <input
            value={form.targetMult}
            onChange={(e) => setForm({ ...form, targetMult: e.target.value })}
            className="w-full rounded-xl bg-neutral-800 px-3 py-2"
            placeholder="1, 0..*, etc."
            disabled={disableMult}
          />
        </label>
      </div>

      {/* Presets */}
      {!disableMult && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg bg-neutral-800 px-2 py-1"
            onClick={() => setForm({ ...form, sourceMult: "1", targetMult: "1" })}
            title="1–1"
          >
            1–1
          </button>
          <button
            type="button"
            className="rounded-lg bg-neutral-800 px-2 py-1"
            onClick={() => setForm({ ...form, sourceMult: "1", targetMult: "0..*" })}
            title="1–N"
          >
            1–N
          </button>
          <button
            type="button"
            className="rounded-lg bg-neutral-800 px-2 py-1"
            onClick={() => setForm({ ...form, sourceMult: "0..*", targetMult: "0..*" })}
            title="N–M"
          >
            N–M
          </button>
        </div>
      )}

      {/* Navegabilidad */}
      <div className="flex items-center gap-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.navigableAToB}
            onChange={(e) => setForm({ ...form, navigableAToB: e.target.checked })}
          />
          <span className="text-xs text-muted-foreground">Navegable A→B</span>
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.navigableBToA}
            onChange={(e) => setForm({ ...form, navigableBToA: e.target.checked })}
          />
          <span className="text-xs text-muted-foreground">Navegable B→A</span>
        </label>
      </div>

      {/* Asociación con clase intermedia */}
      {isNM && (
        <div className="space-y-2 border-t border-neutral-700 pt-2">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.associationClassId}
              onChange={(e) =>
                setForm({
                  ...form,
                  associationClassId: e.target.checked ? (form.associationClassId ?? null) : null,
                })
              }
            />
            <span className="text-xs text-muted-foreground">Usar clase intermedia</span>
          </label>

          {form.associationClassId !== null && (
            <select
              value={form.associationClassId ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  associationClassId: e.target.value ? Number(e.target.value) : null,
                })
              }
              className="w-full rounded-xl bg-neutral-800 px-3 py-2"
            >
              <option value="">— Selecciona clase —</option>
              {nodes.map((c: any) => {
                const disabled = c.id === rel.sourceClassId || c.id === rel.targetClassId;
                return (
                  <option key={c.id} value={c.id} disabled={disabled}>
                    {c.name}{disabled ? " (no válida)" : ""}
                  </option>
                );
              })}
            </select>
          )}
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-2 pt-2">
        <button onClick={onSave} className="rounded-xl bg-primary text-primary-foreground px-3 py-2">
          Guardar
        </button>
        <button onClick={() => setSelectedRelation(null)} className="rounded-xl bg-neutral-800 px-3 py-2">
          Cancelar
        </button>
        <button onClick={onDelete} className="rounded-xl bg-destructive/20 text-destructive px-3 py-2 ml-auto">
          Eliminar
        </button>
      </div>
    </div>
  );
}
