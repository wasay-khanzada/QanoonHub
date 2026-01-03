const PDFDocument = require("pdfkit");
const fs = require("fs");
const { Document, Packer, Paragraph, TextRun } = require("docx");

function generatePDF(content, filePath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    
    doc.pipe(stream);
    
    // Split content into lines for better formatting
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (index === 0) {
        doc.fontSize(16).font('Helvetica-Bold').text(line, { align: "center" });
        doc.moveDown();
      } else {
        doc.fontSize(12).font('Helvetica').text(line || ' ', { align: "left" });
      }
    });
    
    doc.end();
    
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);
  });
}

async function generateDOCX(content, filePath) {
  try {
    // Split content into paragraphs
    const paragraphs = content.split('\n').filter(line => line.trim() !== '');
    
    const doc = new Document({
      sections: [{
        children: paragraphs.map((para, index) => {
          // First paragraph as title (bold, centered)
          if (index === 0) {
            return new Paragraph({
              children: [new TextRun({ text: para, bold: true })],
              alignment: "center",
              spacing: { after: 200 }
            });
          }
          // Regular paragraphs
          return new Paragraph({
            children: [new TextRun({ text: para })],
            spacing: { after: 100 }
          });
        })
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(filePath, buffer);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    throw error;
  }
}

module.exports = { generatePDF, generateDOCX };
