const PDFDocument = require('pdfkit');
const fs = require('fs');

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('public/challan-template.pdf'));

doc.fontSize(20).text('CHALLAN TEMPLATE', { align: 'center' });
doc.moveDown();

doc.fontSize(12).text('Use this format for optimal OCR extraction.', { align: 'center' });
doc.moveDown(2);

doc.fontSize(14).text('Party Name: Shree Dev Mills');
doc.text('Challan No: CH-20260424-001');
doc.text('Date: 24/04/2026');
doc.moveDown();

doc.text('Weaver Name: ABC Weavers');
doc.text('Weaver Challan No: WCH-1002');
doc.text('Weaver Marka: ABC-W');
doc.text('Quality: Polyster 100x100');
doc.moveDown();

doc.text('Total Meter: 120');
doc.text('Total Taka: 3');
doc.moveDown();

doc.text('Taka Details:', { underline: true });
doc.text('1. Taka 1: 40m (10kg)');
doc.text('2. Taka 2: 40m (10.2kg)');
doc.text('3. Taka 3: 40m (9.8kg)');

doc.end();
console.log("PDF generated at public/challan-template.pdf");
