import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from "docx";

const DOC_TYPES: Array<{ key: string; match: RegExp }> = [
  { key: "مذكرة_دفاع", match: /مذكرة\s*دفاع/ },
  { key: "مذكرة_استئناف", match: /استئناف/ },
  { key: "طلب_تأجيل", match: /تأجيل/ },
  { key: "إنذار_رسمي", match: /إنذار/ },
  { key: "صحيفة_دعوى", match: /صحيفة\s*دعوى|دعوى/ },
  { key: "ملخص_قانوني", match: /لخّص|تلخيص|ملخص/ },
  { key: "النقاط_الجوهرية", match: /النقاط|الجوهرية|استخرج/ },
];

export function detectDocType(hint: string): { key: string; label: string } {
  const text = hint || "";
  for (const t of DOC_TYPES) {
    if (t.match.test(text)) return { key: t.key, label: t.key.replace(/_/g, " ") };
  }
  return { key: "وثيقة_قانونية", label: "وثيقة قانونية" };
}

function sanitize(s: string): string {
  return (s || "")
    .trim()
    .replace(/[\\/:*?"<>|.]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);
}

export interface FileNameInput {
  typeKey: string;
  caseTitle?: string | null;
  caseNumber?: string | null;
  ext: "docx" | "pdf" | "txt";
  withTimestamp?: boolean;
}

export function buildFileName(i: FileNameInput): string {
  const parts: string[] = [i.typeKey];
  const caseRef = i.caseNumber ? `قضية_${i.caseNumber}` : i.caseTitle ? sanitize(i.caseTitle) : "";
  if (caseRef) parts.push(caseRef);
  if (i.withTimestamp) {
    const d = new Date();
    parts.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    );
  }
  return `${parts.join("_")}.${i.ext}`;
}

export interface DocMeta {
  title: string;
  caseTitle?: string | null;
  caseNumber?: string | null;
}

function todayArabic(): string {
  return new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
}

export async function buildDocxBlob(content: string, meta: DocMeta): Promise<Blob> {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({ text: meta.title, bold: true, size: 36, rightToLeft: true, font: "Amiri" }),
      ],
      spacing: { after: 240 },
    }),
  );

  if (meta.caseTitle || meta.caseNumber) {
    paragraphs.push(
      new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: [meta.caseTitle, meta.caseNumber ? `رقم ${meta.caseNumber}` : null]
              .filter(Boolean)
              .join(" — "),
            size: 24,
            rightToLeft: true,
            font: "Amiri",
          }),
        ],
        spacing: { after: 120 },
      }),
    );
  }

  paragraphs.push(
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `التاريخ: ${todayArabic()}`,
          size: 22,
          rightToLeft: true,
          font: "Amiri",
          color: "555555",
        }),
      ],
      spacing: { after: 360 },
    }),
  );

  const blocks = content.split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split(/\n/);
    for (const line of lines) {
      paragraphs.push(
        new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.JUSTIFIED,
          children: [
            new TextRun({ text: line || " ", size: 26, rightToLeft: true, font: "Amiri" }),
          ],
          spacing: { after: 120, line: 360 },
        }),
      );
    }
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
  }

  paragraphs.push(
    new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "— مسودة مولّدة بمساعدة الذكاء الاصطناعي، يجب مراجعتها قانونيًا —",
          size: 18,
          italics: true,
          color: "888888",
          rightToLeft: true,
          font: "Amiri",
        }),
      ],
      spacing: { before: 360 },
    }),
  );

  const doc = new Document({
    creator: "قضيتي",
    title: meta.title,
    styles: {
      default: {
        document: { run: { font: "Amiri", size: 26 } },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
        },
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openPrintPdf(content: string, meta: DocMeta) {
  const w = window.open("", "_blank", "width=900,height=1000");
  if (!w) return;
  const safe = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const blocks = content
    .split(/\n\s*\n/)
    .map((b) => `<p>${safe(b).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
  const subtitle = [meta.caseTitle, meta.caseNumber ? `رقم ${meta.caseNumber}` : null]
    .filter(Boolean)
    .join(" — ");
  w.document
    .write(`<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>${safe(meta.title)}</title>
<style>
  @page { margin: 2.5cm; }
  body { font-family: "Amiri","Traditional Arabic","Times New Roman",serif; line-height: 1.9; color:#111; }
  h1 { text-align:center; font-size: 24pt; margin: 0 0 .3em; }
  .sub { text-align:center; color:#444; margin: 0 0 .2em; }
  .date { text-align:center; color:#666; margin-bottom: 2em; font-size: 11pt; }
  p { text-align: justify; font-size: 13pt; margin: 0 0 1em; }
  .footer { text-align:center; color:#888; font-style: italic; font-size: 10pt; margin-top: 2em; }
</style></head><body>
<h1>${safe(meta.title)}</h1>
${subtitle ? `<p class="sub">${safe(subtitle)}</p>` : ""}
<p class="date">التاريخ: ${todayArabic()}</p>
${blocks}
<p class="footer">— مسودة مولّدة بمساعدة الذكاء الاصطناعي، يجب مراجعتها قانونيًا —</p>
<script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
</body></html>`);
  w.document.close();
}
