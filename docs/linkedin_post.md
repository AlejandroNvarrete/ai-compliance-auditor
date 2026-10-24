# Borrador post LinkedIn

🛡️ He construido un **Auditor de Cumplimiento Documental con IA** que revisa una política de privacidad, un contrato o una especificación de requisitos en ~15 segundos.

Subes un PDF → recibes un informe ejecutivo con puntuación, citas literales del documento, infracciones y recomendaciones redactadas.

🔧 Stack
• n8n (orquestación) · Form Trigger → Extract → Chunking → Embeddings
• RAG con Qdrant (colección efímera por auditoría, se borra al terminar)
• Agente IA con Gemini 3.1 Flash-Lite (temperatura 0) + tool de búsqueda vectorial
• Salida tipada con JSON Schema · Informe HTML → PDF (Gotenberg)

🧠 Lo que más me ha enseñado: **no fiarse del LLM**
1️⃣ El modelo solo clasifica (cumple / parcial / no cumple); la puntuación la calcula código determinista.
2️⃣ Cada cita se verifica literalmente contra el texto original. Si el modelo "inventa" una cita, el criterio se degrada automáticamente y el informe lo marca (⚠ cita no verificada).
3️⃣ Prompts y código versionados fuera de n8n + tests automáticos → el workflow se genera desde el repo.

💸 Coste por auditoría: 0 € con el free tier de Gemini.

📂 Código: https://github.com/AlejandroNvarrete/ai-compliance-auditor

#n8n #RAG #IA #LLM #Qdrant #RGPD #IngenieríaInformática #Automatización
