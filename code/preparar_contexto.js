// Nodo Code "Preparar contexto agente" — Run Once for All Items
// El Vector Store emite 1 item por chunk; colapsamos a 1 item para ejecutar el agente una sola vez.
const meta = $('Normalizar texto').first().json;
const { text, ...rest } = meta;
return [{ json: { ...rest, chunks_indexados: $input.all().length } }];
