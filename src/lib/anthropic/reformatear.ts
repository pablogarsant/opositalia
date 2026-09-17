import { anthropic, MODEL } from "./client";

const SYSTEM = `Recibes texto extraído de un PDF de un libro de oftalmología. Tu único trabajo es devolverlo como markdown limpio y legible. No resumes, no añades, no interpretas, no comentas.

Reglas:
- Conserva TODO el contenido y el orden. No inventes datos, cifras ni clasificaciones.
- Las tablas (columnas separadas por espacios, guiones o pipes) se devuelven como tablas markdown GFM con cabecera y separador |---|.
- Los títulos de sección se marcan con ##.
- Las listas se marcan con "- ".
- Une los saltos de línea que parten un párrafo y las palabras cortadas por guion.
- Elimina números de página, cabeceras y pies sueltos.
- Si un trozo es ilegible o está truncado, omítelo en lugar de inventarlo.
- Devuelve SOLO el markdown, sin preámbulo ni bloque de código envolvente.`;

/** Reformateo con Claude para el texto que el limpiador determinista no arregla. */
export async function reformatearMarkdown(texto: string, titulo: string): Promise<string> {
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Punto del temario: ${titulo}\n\n--- TEXTO CRUDO ---\n${texto.slice(0, 40000)}`,
      },
    ],
  });
  const salida = res.content
    .filter((b): b is { type: "text"; text: string; citations: never } => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  // quita el ```markdown envolvente si el modelo lo añade igualmente
  return salida.replace(/^```(?:markdown|md)?\n?/, "").replace(/\n?```$/, "");
}
