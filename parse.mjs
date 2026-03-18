import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractText(pdfPath) {
    try {
        const data = new Uint8Array(fs.readFileSync(pdfPath));
        const loadingTask = pdfjsLib.getDocument({data: data});
        const doc = await loadingTask.promise;
        const numPages = doc.numPages;
        let textPages = [];
        
        for (let i = 1; i <= numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            textPages.push(strings.join(' '));
        }
        
        fs.writeFileSync(pdfPath + '.txt', textPages.join('\n'));
        console.log('Successfully parsed ' + pdfPath);
    } catch (err) {
        console.error('Error processing ' + pdfPath + ':', err);
    }
}

async function run() {
    await extractText('docs/COMPANION.PDF');
    await extractText('docs/The_Mental_Dashboard.pdf');
}
run();
