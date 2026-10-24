// Nodo Code "Normalizar texto" — Run Once for All Items
// Limpia el texto extraído del PDF, valida tamaño y genera metadatos de la auditoría.
const form = $('Formulario PDF').first().json;
const pdf = $input.first().json;

const MAX_CHARS = 200000; // ~50k tokens: protege la cuota gratuita de embeddings

let text = String(pdf.text || '')
  .replace(/\r/g, '')
  .replace(/-\n(?=\p{Ll})/gu, '')      // une palabras cortadas por guion al final de línea
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

if (text.length < 200) {
  throw new Error('El PDF no contiene texto extraíble (¿escaneado?). Aplica OCR antes de auditarlo.');
}
const truncado = text.length > MAX_CHARS;
if (truncado) text = text.slice(0, MAX_CHARS);

const TIPOS = {
  'Política de privacidad (RGPD)': 'politica_privacidad',
  'Contrato de servicios': 'contrato_servicios',
  'Especificación de requisitos (SRS)': 'especificacion_requisitos',
};

const fichero = (Array.isArray(form.documento) ? form.documento[0] : form.documento) || {};

return [{
  json: {
    audit_id: `audit_${$execution.id}`,
    tipo_documento: TIPOS[form.tipo_documento] || 'politica_privacidad',
    email: form.email || '',
    nombre_archivo: fichero.filename || 'documento.pdf',
    paginas: pdf.numpages || null,
    caracteres: text.length,
    truncado,
    preview: text.slice(0, 400).replace(/"/g, "'").replace(/\n/g, ' '),
    text,
  },
}];
