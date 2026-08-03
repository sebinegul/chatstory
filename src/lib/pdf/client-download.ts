export async function downloadBookPdf(rootId = "book-root", filename = "chatstory.pdf") {
  const root = document.getElementById(rootId);
  if (!root) throw new Error("Book root not found");

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(root, {
    scale: 2,
    backgroundColor: "#f7f3ec",
    useCORS: true,
  });

  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const x = (pageWidth - w) / 2;
  const y = (pageHeight - h) / 2;
  pdf.addImage(img, "PNG", x, y, w, h);
  pdf.save(filename);
}
