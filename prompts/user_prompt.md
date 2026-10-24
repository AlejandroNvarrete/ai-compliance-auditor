=Audita el documento indexado.

- tipo_documento: {{ $json.tipo_documento }}
- nombre_archivo: {{ $json.nombre_archivo }}
- páginas: {{ $json.paginas }}
- inicio del documento (solo para contexto del título, NO es fuente de citas): "{{ $json.preview }}"

Ejecuta la checklist completa usando `buscar_en_documento` para cada criterio y entrega el resultado con `format_final_json_response`.