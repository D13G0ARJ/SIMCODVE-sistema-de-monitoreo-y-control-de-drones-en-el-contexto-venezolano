"""Inserta las figuras (PNG) en el Markdown del Capitulo VI y deja un .md listo
para convertir a .docx con pandoc. Calcula el ancho de cada imagen para que quepa
en una pagina (max 15 cm de ancho, 21 cm de alto)."""
import re
import struct
import os

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "Capitulo_VI.md")
DST = os.path.join(BASE, "Capitulo_VI_docx.md")
DIAG = "Capitulo_VI_diagramas"


def png_size(path):
    with open(path, "rb") as f:
        f.read(16)
        w, h = struct.unpack(">II", f.read(8))
    return w, h


def ancho_cm(path):
    w, h = png_size(path)
    wcm = w / 96 * 2.54
    hcm = h / 96 * 2.54
    escala = min(15.0 / wcm, 21.0 / hcm, 1.0)
    return round(wcm * escala, 1)


# patron de la referencia de figura:
# > **Figura 6.1.** *Caption.* (Archivo: `archivo.png`.)
patron = re.compile(
    r">\s*\*\*(Figura [\d.]+)\.\*\*\s*\*(.+?)\*\s*\(Archivo:\s*>?\s*`(.+?)`\.\)"
)

texto = open(SRC, encoding="utf-8").read()


def reemplazo(m):
    etiqueta, caption, archivo = m.group(1), m.group(2), m.group(3)
    ruta = os.path.join(DIAG, archivo)
    ruta_abs = os.path.join(BASE, ruta)
    w = ancho_cm(ruta_abs)
    ruta_md = ruta.replace("\\", "/")
    return f"![{etiqueta}. {caption}]({ruta_md}){{width={w}cm}}"


texto2 = patron.sub(reemplazo, texto)
open(DST, "w", encoding="utf-8").write(texto2)
print("figuras insertadas:", len(patron.findall(texto)))
print("archivo:", DST)
