"""Genera los workflows importables desde la fuente única de verdad (prompts/ + code/).

  python scripts/build_workflow.py

Salida:
  workflows/compliance_auditor.json       -> Qdrant + Gotenberg (docker compose)
  workflows/compliance_auditor_lite.json  -> Simple Vector Store en memoria, 0 infraestructura
"""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
read = lambda p: (ROOT / p).read_text(encoding="utf-8")

base = json.loads(read("workflows/compliance_auditor.json"))  # topología base; code/ y prompts/ se reinyectan
nodes = {n["name"]: n for n in base["nodes"]}

# --- inyectar fuente única de verdad
nodes["Normalizar texto"]["parameters"]["jsCode"] = read("code/normalizar_texto.js")
nodes["Preparar contexto agente"]["parameters"]["jsCode"] = read("code/preparar_contexto.js")
nodes["Construir informe"]["parameters"]["jsCode"] = read("code/construir_informe.js")
nodes["Agente Auditor"]["parameters"]["text"] = read("prompts/user_prompt.md")
nodes["Agente Auditor"]["parameters"]["options"]["systemMessage"] = read("prompts/system_prompt.md")
nodes["Schema JSON informe"]["parameters"]["inputSchema"] = read("prompts/output_schema.json")


def dump(wf, name):
    out = ROOT / "workflows" / name
    out.write_text(json.dumps(wf, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("ok", out.relative_to(ROOT))


full = copy.deepcopy(base)
full["name"] = "AI Compliance Auditor (RAG · Qdrant · Gemini)"
dump(full, "compliance_auditor.json")

# --- variante LITE: sin Docker. Qdrant -> Simple Vector Store, sin Gotenberg ni borrado
lite = copy.deepcopy(base)
lite["name"] = "AI Compliance Auditor LITE (RAG en memoria · Gemini)"
DROP = {"HTML a PDF (Gotenberg)", "Guardar PDF", "Borrar colección Qdrant"}
lite["nodes"] = [n for n in lite["nodes"] if n["name"] not in DROP]
mem_key = {"__rl": True, "mode": "list", "value": "=audit_{{ $execution.id }}", "cachedResultName": "=audit_{{ $execution.id }}"}
for n in lite["nodes"]:
    if n["type"] == "@n8n/n8n-nodes-langchain.vectorStoreQdrant":
        n["type"] = "@n8n/n8n-nodes-langchain.vectorStoreInMemory"
        n["typeVersion"] = 1.3
        p = n["parameters"]
        p.pop("qdrantCollection", None)
        p["memoryKey"] = mem_key
        if n["name"] == "Indexar en Qdrant":
            p.pop("embeddingBatchSize", None)
    if n["name"] == "Nota ingesta":
        n["parameters"]["content"] = n["parameters"]["content"].replace("**Qdrant**", "**Simple Vector Store** (memoria)")
    if n["name"] == "Mostrar informe":
        n["position"] = [2200, 0]
    if n["name"] == "Formulario PDF":
        n["webhookId"] = "c3d1a7e2-5f4b-4e8a-9b61-1a2b3c4d5e6f"  # distinto del full: ambos pueden convivir
    if n["name"] == "Nota salida":
        n["parameters"]["content"] = "## 3 · Informe\nPuntuación determinista + verificación literal de citas → informe HTML en pantalla (Ctrl+P → PDF)"
# renombrar nodos Qdrant
ren = {"Indexar en Qdrant": "Indexar vectores"}
for n in lite["nodes"]:
    n["name"] = ren.get(n["name"], n["name"])
conns = {}
for src, c in lite["connections"].items():
    if src in DROP:
        continue
    for kind in c.values():
        for outs in kind:
            for t in outs:
                t["node"] = ren.get(t["node"], t["node"])
    conns[ren.get(src, src)] = c
conns["Construir informe"] = {"main": [[{"node": "Mostrar informe", "type": "main", "index": 0}]]}
lite["connections"] = conns
dump(lite, "compliance_auditor_lite.json")
