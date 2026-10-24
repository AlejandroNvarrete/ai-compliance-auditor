"""Genera PDFs de demo en samples/. Uso: python scripts/make_samples.py"""
from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

OUT = Path(__file__).resolve().parent.parent / "samples"
OUT.mkdir(exist_ok=True)

CON_FALLOS = [
    ("h", "Política de Privacidad de TechNova Apps"),
    ("p", "El responsable del tratamiento de sus datos es TechNova Apps S.L., con CIF B12345678 y domicilio en Calle Mayor 10, 28013 Madrid. Puede contactarnos en privacidad@technova.example."),
    ("h2", "Finalidades"),
    ("p", "Tratamos sus datos para gestionar su cuenta de usuario, enviarle comunicaciones comerciales y mejorar nuestros servicios mediante analítica de uso."),
    ("h2", "Sus derechos"),
    ("p", "Usted puede ejercer sus derechos de acceso, rectificación y supresión escribiendo a privacidad@technova.example, adjuntando copia de su documento de identidad."),
    ("h2", "Seguridad"),
    ("p", "Aplicamos medidas técnicas y organizativas razonables para proteger su información frente a accesos no autorizados, pérdida o alteración."),
    ("h2", "Cambios en esta política"),
    ("p", "Podemos actualizar esta política en cualquier momento. Le recomendamos revisarla periódicamente. Última actualización: enero de 2026."),
]

CONFORME = [
    ("h", "Política de Privacidad de GreenLeaf Software"),
    ("h2", "1. Responsable del tratamiento"),
    ("p", "El responsable del tratamiento es GreenLeaf Software S.L., CIF B87654321, con domicilio en Avenida Diagonal 200, 08018 Barcelona, correo electrónico privacidad@greenleaf.example. Nuestro Delegado de Protección de Datos (DPO) es accesible en dpo@greenleaf.example."),
    ("h2", "2. Finalidades y base jurídica"),
    ("p", "Gestión de la cuenta y prestación del servicio: base jurídica la ejecución del contrato (art. 6.1.b RGPD). Envío de comunicaciones comerciales: base jurídica el consentimiento del interesado (art. 6.1.a RGPD), que puede retirar en cualquier momento. Prevención del fraude y seguridad de la plataforma: base jurídica el interés legítimo del responsable (art. 6.1.f RGPD). Cumplimiento de obligaciones fiscales: base jurídica la obligación legal (art. 6.1.c RGPD)."),
    ("h2", "3. Plazo de conservación"),
    ("p", "Los datos se conservarán mientras se mantenga la relación contractual y, tras su finalización, durante los plazos de prescripción de las acciones legales aplicables, con un máximo de 6 años para la documentación contable y fiscal. Los datos tratados con base en el consentimiento se conservarán hasta que este se retire."),
    ("h2", "4. Destinatarios y transferencias internacionales"),
    ("p", "Sus datos podrán ser comunicados a la Agencia Tributaria y a entidades bancarias para el cobro de los servicios. Utilizamos como encargados del tratamiento a Amazon Web Services EMEA SARL (alojamiento, región UE) y a Mailjet SAS (envío de correos). Algunos proveedores pueden realizar transferencias internacionales a Estados Unidos amparadas en el Marco de Privacidad de Datos UE-EE.UU. (Data Privacy Framework) o, en su defecto, en Cláusulas Contractuales Tipo aprobadas por la Comisión Europea."),
    ("h2", "5. Derechos del interesado"),
    ("p", "Puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad de los datos, así como retirar el consentimiento, enviando un correo a privacidad@greenleaf.example o por correo postal a la dirección indicada. Si considera que el tratamiento no se ajusta a la normativa, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es)."),
]


def build(name, blocks):
    st = getSampleStyleSheet()
    m = {"h": st["Title"], "h2": st["Heading2"], "p": st["BodyText"]}
    story = []
    for kind, text in blocks:
        story += [Paragraph(text, m[kind]), Spacer(1, 6)]
    SimpleDocTemplate(str(OUT / name), pagesize=A4, title=blocks[0][1]).build(story)
    print("ok", OUT / name)


if __name__ == "__main__":
    build("politica_privacidad_con_fallos.pdf", CON_FALLOS)
    build("politica_privacidad_conforme.pdf", CONFORME)
