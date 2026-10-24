// Nodo Code "Construir informe" — Run Once for All Items
// 1) Valida la salida del agente  2) Verifica que cada cita existe LITERALMENTE en el PDF
// 3) Calcula la puntuación de forma determinista  4) Genera HTML del informe.
const meta = $('Normalizar texto').first().json;
let out = $input.first().json.output;
if (typeof out === 'string') {
  out = JSON.parse(out.replace(/^```(?:json)?\s*|\s*```$/g, ''));
}
if (!out || !Array.isArray(out.criterios) || out.criterios.length === 0) {
  throw new Error('Salida del agente inválida: falta "criterios".');
}

const norm = (s) => String(s || '')
  .normalize('NFKC')
  .replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'")
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();
const fuente = norm(meta.text);

const FACTOR = { cumple: 1, parcial: 0.5, no_cumple: 0 };
let pesoTotal = 0;
let pesoObtenido = 0;

const criterios = out.criterios.map((c) => {
  const peso = Number(c.peso) || 0;
  let estado = FACTOR[c.estado] !== undefined ? c.estado : 'no_cumple';
  const cita = String(c.cita || '').trim();
  const citaVerificada = cita.length > 0 && fuente.includes(norm(cita));
  let hallazgo = c.hallazgo || '';

  // Guardarraíl anti-alucinación: sin cita literal verificable no se puede "cumplir".
  if (estado === 'cumple' && !citaVerificada) {
    estado = 'parcial';
    hallazgo = `[Degradado automáticamente: cita no verificable en el documento] ${hallazgo}`;
  }

  pesoTotal += peso;
  pesoObtenido += peso * FACTOR[estado];
  return { ...c, peso, estado, cita, cita_verificada: citaVerificada, hallazgo };
});

const puntuacion = pesoTotal ? Math.round((pesoObtenido / pesoTotal) * 100) : 0;
const nivel = puntuacion >= 85 ? 'CONFORME' : puntuacion >= 60 ? 'CONFORME CON RESERVAS' : 'NO CONFORME';
const color = puntuacion >= 85 ? '#15803d' : puntuacion >= 60 ? '#b45309' : '#b91c1c';

const cumplidos = criterios.filter((c) => c.estado === 'cumple');
const incumplidos = criterios.filter((c) => c.estado !== 'cumple');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const BADGE = {
  cumple: ['#dcfce7', '#166534', 'CUMPLE'],
  parcial: ['#fef3c7', '#92400e', 'PARCIAL'],
  no_cumple: ['#fee2e2', '#991b1b', 'NO CUMPLE'],
};
const fecha = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' });

const filas = criterios.map((c) => {
  const [bg, fg, label] = BADGE[c.estado];
  return `
  <tr>
    <td class="id">${esc(c.id)}<div class="peso">peso ${c.peso}</div></td>
    <td>
      <div class="crit">${esc(c.criterio)}</div>
      <span class="badge" style="background:${bg};color:${fg}">${label}</span>
      ${c.cita ? `<blockquote>“${esc(c.cita)}”<span class="ver">${c.cita_verificada ? '✔ cita verificada' : '⚠ cita no verificada'}</span></blockquote>` : ''}
      <p><b>Hallazgo:</b> ${esc(c.hallazgo)}</p>
      ${c.recomendacion ? `<p class="rec"><b>Recomendación:</b> ${esc(c.recomendacion)}</p>` : ''}
    </td>
  </tr>`;
}).join('');

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Informe de cumplimiento · ${esc(meta.nombre_archivo)}</title>
<style>
  *{box-sizing:border-box} body{font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;margin:0;background:#f8fafc}
  .wrap{max-width:900px;margin:0 auto;padding:32px 20px}
  header{display:flex;justify-content:space-between;gap:24px;align-items:center;border-bottom:3px solid #0f172a;padding-bottom:16px}
  h1{font-size:22px;margin:0} .sub{color:#475569;font-size:13px;margin-top:4px}
  .score{text-align:center;min-width:150px} .score .n{font-size:48px;font-weight:800;color:${color};line-height:1}
  .score .l{font-size:12px;font-weight:700;color:${color};letter-spacing:.05em}
  .bar{height:10px;background:#e2e8f0;border-radius:6px;overflow:hidden;margin:20px 0}
  .bar div{height:100%;width:${puntuacion}%;background:${color}}
  .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}
  .kpi{background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;text-align:center}
  .kpi b{display:block;font-size:22px} .kpi span{font-size:12px;color:#64748b}
  .resumen{background:#fff;border-left:4px solid ${color};padding:14px 16px;border-radius:4px}
  table{width:100%;border-collapse:collapse;background:#fff;margin-top:20px}
  td{border-bottom:1px solid #e2e8f0;padding:14px;vertical-align:top;font-size:14px}
  td.id{font-weight:700;width:90px;white-space:nowrap} .peso{font-weight:400;color:#64748b;font-size:12px}
  .crit{font-weight:600;margin-bottom:6px}
  .badge{display:inline-block;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;margin-bottom:4px}
  td p{margin:8px 0}
  blockquote{margin:10px 0;padding:8px 12px;background:#f1f5f9;border-left:3px solid #94a3b8;font-style:italic;color:#334155}
  .ver{display:block;font-style:normal;font-size:11px;color:#64748b;margin-top:4px}
  .rec{background:#eff6ff;padding:8px 10px;border-radius:4px}
  footer{margin-top:24px;font-size:11px;color:#64748b}
  @media(max-width:600px){header{flex-direction:column;align-items:flex-start}.kpis{grid-template-columns:repeat(2,1fr)}}
  @media print{body{background:#fff}}
</style></head><body><div class="wrap">
<header>
  <div>
    <h1>Informe de Auditoría de Cumplimiento</h1>
    <div class="sub">${esc(out.titulo_documento || meta.nombre_archivo)} · ${esc(meta.tipo_documento.replace(/_/g, ' '))}</div>
    <div class="sub">Archivo: ${esc(meta.nombre_archivo)} · ${meta.paginas ?? '?'} págs · ID ${esc(meta.audit_id)} · ${esc(fecha)}</div>
  </div>
  <div class="score"><div class="n">${puntuacion}%</div><div class="l">${nivel}</div></div>
</header>
<div class="bar"><div></div></div>
<div class="kpis">
  <div class="kpi"><b>${cumplidos.length}</b><span>Cumplidos</span></div>
  <div class="kpi"><b>${criterios.filter((c) => c.estado === 'parcial').length}</b><span>Parciales</span></div>
  <div class="kpi"><b>${criterios.filter((c) => c.estado === 'no_cumple').length}</b><span>Incumplidos</span></div>
  <div class="kpi"><b>${esc(String(out.riesgo_global || '-').toUpperCase())}</b><span>Riesgo</span></div>
</div>
<div class="resumen"><b>Resumen ejecutivo.</b> ${esc(out.resumen_ejecutivo)}</div>
<table>${filas}</table>
<footer>Generado automáticamente por n8n + RAG + LLM (Gemini). La puntuación se calcula de forma determinista a partir de los estados; las citas se verifican contra el texto original. ${meta.truncado ? 'AVISO: documento truncado por tamaño.' : ''} Este informe no constituye asesoramiento legal.</footer>
</div></body></html>`;

// Versión texto para Slack / email
const iconos = { cumple: '✅', parcial: '⚠️', no_cumple: '❌' };
const slack = [
  `*Auditoría:* ${meta.nombre_archivo} — *${puntuacion}%* (${nivel}) · riesgo ${out.riesgo_global}`,
  `_${out.resumen_ejecutivo}_`,
  ...criterios.map((c) => `${iconos[c.estado]} *${c.id}* ${c.criterio}${c.recomendacion ? `\n   → ${c.recomendacion}` : ''}`),
].join('\n');

return [{
  json: {
    audit_id: meta.audit_id,
    email: meta.email,
    nombre_archivo: meta.nombre_archivo,
    tipo_documento: meta.tipo_documento,
    puntuacion,
    nivel,
    riesgo_global: out.riesgo_global,
    resumen_ejecutivo: out.resumen_ejecutivo,
    puntos_cumplidos: cumplidos.map(({ id, criterio, cita, cita_verificada }) => ({ id, criterio, cita, cita_verificada })),
    infracciones: incumplidos.map(({ id, criterio, estado, hallazgo, recomendacion }) => ({ id, criterio, estado, hallazgo, recomendacion })),
    recomendaciones: incumplidos.map((c) => `${c.id}: ${c.recomendacion}`).filter((r) => !r.endsWith(': ')),
    criterios,
    slack_text: slack,
    html,
  },
  // Binario index.html para Gotenberg (HTML -> PDF)
  binary: {
    html: {
      data: Buffer.from(html, 'utf8').toString('base64'),
      mimeType: 'text/html',
      fileName: 'index.html',
      fileExtension: 'html',
    },
  },
}];
