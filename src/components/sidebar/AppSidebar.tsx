"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useEditor } from "@/store/editor";
import {
  createClass,
  validateDiagram,
  exportCode,
  exportPostman,
  deleteClass as apiDeleteClass,
  renameClass,
  addAttribute,
  updateAttribute,
  deleteAttribute,
  addMethod,
  updateMethod,
  deleteMethod,
} from "../../lib/diagram";
import type { UmlAttribute, UmlMethod } from "@/lib/types";
import {
  Plus,
  Link2,
  CheckCircle2,
  Code2,
  FileJson,
  ArrowLeft,
  Edit3,
  Trash2,
  Settings,
  Layers,
  Box,
  FenceIcon as Function,
  Type,
} from "lucide-react";
import RelationEditor from "@/components/editor/RelationEditor"; // ⬅️ nuevo

function uniqueName(base: string, existing: string[]) {
  let n = 1;
  const set = new Set(existing);
  while (set.has(`${base}${n}`)) n++;
  return `${base}${n}`;
}

export default function AppSidebar() {
  const { diagramId } = useParams<{ diagramId: string }>();
  const search = useSearchParams();
  const projectId = search.get("projectId");

  const {
    nodes,
    selectedId,
    select,
    addNode,
    setNodes,
    relationMode,
    toggleRelationMode,
    attrMap,
    methodMap,
    nextAttrOrder,
    nextMethodOrder,
    addAttrLocal,
    updateAttrLocal,
    removeAttrLocal,
    addMethodLocal,
    updateMethodLocal,
    removeMethodLocal,
    selectedRelationId, // ⬅️ del store
  } = useEditor();

  const [msg, setMsg] = useState<string | null>(null);
  const existingNames = useMemo(() => nodes.map((n) => n.name), [nodes]);

  async function onAddClass() {
    try {
      const name = uniqueName("Clase", existingNames);
      const c = await createClass(diagramId, name, 100 + nodes.length * 30, 100);
      addNode({ id: c.id, name: c.name, x: c.x, y: c.y });
      setMsg(`Clase creada: ${c.name}`);
    } catch {
      setMsg("No se pudo crear la clase");
    }
  }

  async function onValidate() {
    try {
      const res = await validateDiagram(diagramId);
      setMsg(res.ok ? "Diagrama válido ✔" : `Problemas: ${res.issues.length}`);
    } catch {
      setMsg("Error al validar");
    }
  }

  async function onExportCode() {
    try {
      const blob = await exportCode(diagramId);
      const url = URL.createObjectURL(new Blob([blob]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `diagram_${diagramId}_springboot.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg("No se pudo exportar código");
    }
  }

  async function onExportPostman() {
    try {
      const blob = await exportPostman(diagramId);
      const url = URL.createObjectURL(new Blob([blob], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `diagram_${diagramId}_postman.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg("No se pudo exportar Postman");
    }
  }

  async function onRenameSelected() {
    if (!selectedId) return;
    const current = nodes.find((n) => n.id === selectedId)?.name ?? "";
    const name = prompt("Nuevo nombre de clase:", current);
    if (!name || name === current) return;
    try {
      await renameClass(selectedId, name);
      setNodes(nodes.map((n) => (n.id === selectedId ? { ...n, name } : n)));
    } catch {
      setMsg("No se pudo renombrar");
    }
  }

  async function onDeleteSelected() {
    if (!selectedId) return;
    if (!confirm("¿Eliminar clase seleccionada?")) return;
    try {
      await apiDeleteClass(selectedId);
      setNodes(nodes.filter((n) => n.id !== selectedId));
      select(undefined);
    } catch {
      setMsg("No se pudo eliminar la clase");
    }
  }

  // ------- ATRIBUTOS -------
  const attrs: UmlAttribute[] = selectedId ? (attrMap[selectedId] ?? []) : [];
  async function onAddAttribute() {
    if (!selectedId) return setMsg("Selecciona una clase");
    try {
      const order = nextAttrOrder(selectedId);
      const created = await addAttribute(selectedId, "nombre", "String");
      addAttrLocal(selectedId, { id: created.id, name: "nombre", type: "String", order });
    } catch {
      setMsg("No se pudo crear el atributo");
    }
  }

  async function onEditAttr(a: UmlAttribute) {
    const name = prompt("Nombre del atributo:", a.name) ?? a.name;
    const type = prompt("Tipo del atributo:", a.type) ?? a.type;
    try {
      await updateAttribute(a.id, { name, type });
      updateAttrLocal(selectedId!, a.id, { name, type });
    } catch {
      setMsg("No se pudo actualizar el atributo");
    }
  }

  async function onDeleteAttr(a: UmlAttribute) {
    if (!confirm("¿Eliminar atributo?")) return;
    try {
      await deleteAttribute(a.id);
      removeAttrLocal(selectedId!, a.id);
    } catch {
      setMsg("No se pudo eliminar el atributo");
    }
  }

  // ------- MÉTODOS -------
  const methods: UmlMethod[] = selectedId ? (methodMap[selectedId] ?? []) : [];
  async function onAddMethod() {
    if (!selectedId) return setMsg("Selecciona una clase");
    try {
      const order = nextMethodOrder(selectedId);
      const created = await addMethod(selectedId, "metodo", "void");
      addMethodLocal(selectedId, { id: created.id, name: "metodo", returnType: "void", order });
    } catch {
      setMsg("No se pudo crear el método");
    }
  }

  async function onEditMethod(m: UmlMethod) {
    const name = prompt("Nombre del método:", m.name) ?? m.name;
    const ret = prompt("Tipo de retorno:", m.returnType) ?? m.returnType;
    try {
      await updateMethod(m.id, { name, returnType: ret });
      updateMethodLocal(selectedId!, m.id, { name, returnType: ret });
    } catch {
      setMsg("No se pudo actualizar el método");
    }
  }

  async function onDeleteMethod(m: UmlMethod) {
    if (!confirm("¿Eliminar método?")) return;
    try {
      await deleteMethod(m.id);
      removeMethodLocal(selectedId!, m.id);
    } catch {
      setMsg("No se pudo eliminar el método");
    }
  }

  return (
    <aside className="w-80 shrink-0 border-r border-border bg-sidebar h-screen overflow-y-auto">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Layers className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">Editor UML</h2>
            <p className="text-xs text-muted-foreground">Diagrama #{diagramId}</p>
          </div>
        </div>

        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-sidebar-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Volver a proyectos
        </Link>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
            <Box className="size-4" />
            Herramientas
          </h3>

          <div className="space-y-2">
            <button
              onClick={onAddClass}
              className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 font-medium"
            >
              <Plus className="size-4" />
              Agregar clase
            </button>

            <button
              onClick={toggleRelationMode}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200 font-medium ${
                relationMode
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
              }`}
            >
              <Link2 className="size-4" />
              {relationMode ? "Relacionar (activo)" : "Crear relación"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
            <Settings className="size-4" />
            Acciones
          </h3>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={onValidate}
              className="flex items-center gap-3 px-4 py-3 text-left rounded-xl bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-all duration-200"
            >
              <CheckCircle2 className="size-4" />
              <span className="font-medium">Validar</span>
            </button>

            <button
              onClick={onExportCode}
              className="flex items-center gap-3 px-4 py-3 text-left rounded-xl bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-all duration-200"
            >
              <Code2 className="size-4" />
              <span className="font-medium">Exportar código</span>
            </button>

            <button
              onClick={onExportPostman}
              className="flex items-center gap-3 px-4 py-3 text-left rounded-xl bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80 transition-all duration-200"
            >
              <FileJson className="size-4" />
              <span className="font-medium">Postman</span>
            </button>
          </div>
        </div>

        {msg && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
            <p className="text-sm text-primary font-medium">{msg}</p>
          </div>
        )}

        {relationMode && (
          <div className="p-4 bg-accent/50 border border-accent rounded-xl">
            <p className="text-sm text-accent-foreground">
              <strong>Modo relación activo:</strong> Haz clic en la clase origen y luego en la clase destino para crear
              una relación.
            </p>
          </div>
        )}
      </div>

      {/* --- Panel de edición --- */}
      {selectedRelationId ? (
        <div className="border-t border-sidebar-border bg-sidebar-accent/30">
          <div className="p-6">
            <h3 className="font-semibold text-sidebar-foreground mb-2">Relación seleccionada</h3>
            <RelationEditor />
          </div>
        </div>
      ) : selectedId ? (
        <div className="border-t border-sidebar-border bg-sidebar-accent/30">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sidebar-foreground">Clase seleccionada</h3>
              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">ID: {selectedId}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onRenameSelected}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-sidebar-accent text-sidebar-accent-foreground rounded-lg hover:bg-sidebar-accent/80 transition-colors text-sm font-medium"
              >
                <Edit3 className="size-3" />
                Renombrar
              </button>
              <button
                onClick={onDeleteSelected}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
              >
                <Trash2 className="size-3" />
                Eliminar
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
                  <Type className="size-4" />
                  Atributos ({(attrMap[selectedId] ?? []).length})
                </h4>
                <button
                  onClick={onAddAttribute}
                  className="p-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus className="size-3" />
                </button>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {(attrMap[selectedId] ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sin atributos</p>
                ) : (
                  (attrMap[selectedId] ?? []).map((a: UmlAttribute) => (
                    <div key={a.id} className="flex items-center justify-between gap-2 p-2 bg-sidebar rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-sidebar-foreground truncate">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.type}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEditAttr(a)}
                          className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-sidebar-foreground transition-colors"
                        >
                          <Edit3 className="size-3" />
                        </button>
                        <button
                          onClick={() => onDeleteAttr(a)}
                          className="p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-sidebar-foreground flex items-center gap-2">
                  <Function className="size-4" />
                  Métodos ({(methodMap[selectedId] ?? []).length})
                </h4>
                <button
                  onClick={onAddMethod}
                  className="p-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus className="size-3" />
                </button>
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {(methodMap[selectedId] ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sin métodos</p>
                ) : (
                  (methodMap[selectedId] ?? []).map((m: UmlMethod) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 p-2 bg-sidebar rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-sidebar-foreground truncate">{m.name}()</p>
                        <p className="text-xs text-muted-foreground">→ {m.returnType}</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEditMethod(m)}
                          className="p-1 hover:bg-sidebar-accent rounded text-muted-foreground hover:text-sidebar-foreground transition-colors"
                        >
                          <Edit3 className="size-3" />
                        </button>
                        <button
                          onClick={() => onDeleteMethod(m)}
                          className="p-1 hover:bg-destructive/20 rounded text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-sm opacity-80">Selecciona un elemento para editar…</div>
      )}
    </aside>
  );
}
