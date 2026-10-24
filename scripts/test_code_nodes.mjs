// Tests offline de los nodos Code (sin n8n). Uso: node scripts/test_code_nodes.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('../code/', import.meta.url);
const load = (f) => readFileSync(new URL(f, root), 'utf8');

// Simula el runtime de un nodo Code de n8n ("Run Once for All Items")
function runNode(file, { input = [], nodes = {}, executionId = '42' }) {
  const $ = (name) => ({ first: () => nodes[name][0], all: () => nodes[name] });
  const $input = { first: () => input[0], all: () => input };
  const fn = new Function('$', '$input', '$execution', 'Buffer', load(file));
  return fn($, $input, { id: executionId }, Buffer);
}

const TEXTO = `Política de privacidad. El responsable del tratamiento de sus datos es TechNova Apps S.L., con CIF B12345678.
Usted puede ejercer sus derechos de acceso, rectifica-
ción y supresión escribiendo a privacidad@technova.example. ` + 'Relleno. '.repeat(40);

let ok = 0;
const t = (name, f) => { f(); ok++; console.log('✔', name); };

// --- Normalizar texto
const form = { json: { tipo_documento: 'Política de privacidad (RGPD)', email: '', documento: [{ filename: 'p.pdf' }] } };
const norm = runNode('normalizar_texto.js', { input: [{ json: { text: TEXTO, numpages: 1 } }], nodes: { 'Formulario PDF': [form] } })[0].json;

t('normalizar: une palabras cortadas por guion', () => assert.ok(norm.text.includes('rectificación')));
t('normalizar: mapea tipo de documento', () => assert.equal(norm.tipo_documento, 'politica_privacidad'));
t('normalizar: audit_id por ejecución', () => assert.equal(norm.audit_id, 'audit_42'));
t('normalizar: rechaza PDF sin texto', () => assert.throws(() =>
  runNode('normalizar_texto.js', { input: [{ json: { text: '  ' } }], nodes: { 'Formulario PDF': [form] } }), /escaneado/));

// --- Preparar contexto
t('preparar: colapsa N chunks a 1 item sin texto', () => {
  const r = runNode('preparar_contexto.js', { input: [{}, {}, {}], nodes: { 'Normalizar texto': [{ json: norm }] } });
  assert.equal(r.length, 1); assert.equal(r[0].json.chunks_indexados, 3); assert.equal(r[0].json.text, undefined);
});

// --- Construir informe
const crit = (id, estado, cita, peso = 20) => ({ id, criterio: id, peso, estado, cita, hallazgo: 'h', recomendacion: estado === 'cumple' ? '' : 'r' });
const agentOut = {
  tipo_documento: 'politica_privacidad', titulo_documento: 'T', resumen_ejecutivo: 'R', riesgo_global: 'alto',
  criterios: [
    crit('PRIV-01', 'cumple', 'El responsable del tratamiento de sus datos es TechNova Apps S.L.', 25),
    crit('PRIV-02', 'cumple', 'Base legal: interés legítimo (INVENTADA)'),
    crit('PRIV-03', 'parcial', 'acceso, rectificación y supresión'),
    crit('PRIV-04', 'no_cumple', ''),
    crit('PRIV-05', 'no_cumple', '', 15),
  ],
};
const rep = runNode('construir_informe.js', { input: [{ json: { output: agentOut } }], nodes: { 'Normalizar texto': [{ json: norm }] } })[0].json;

t('informe: cita literal verificada (tolerante a espacios/mayúsculas)', () => assert.equal(rep.criterios[0].cita_verificada, true));
t('informe: cita inventada → degrada cumple a parcial', () => {
  assert.equal(rep.criterios[1].estado, 'parcial'); assert.match(rep.criterios[1].hallazgo, /Degradado/);
});
t('informe: puntuación determinista ponderada = 45%', () => assert.equal(rep.puntuacion, 45)); // (25 + 10 + 10) / 100
t('informe: nivel NO CONFORME', () => assert.equal(rep.nivel, 'NO CONFORME'));
t('informe: HTML escapa contenido', () => {
  const r = runNode('construir_informe.js', { input: [{ json: { output: { ...agentOut, resumen_ejecutivo: '<script>x</script>' } } }], nodes: { 'Normalizar texto': [{ json: norm }] } })[0].json;
  assert.ok(!r.html.includes('<script>x')); assert.ok(r.html.includes('&lt;script&gt;'));
});
t('informe: acepta salida string con ```json', () => {
  const r = runNode('construir_informe.js', { input: [{ json: { output: '```json\n' + JSON.stringify(agentOut) + '\n```' } }], nodes: { 'Normalizar texto': [{ json: norm }] } })[0].json;
  assert.equal(r.puntuacion, 45);
});

console.log(`\n${ok} tests OK`);
