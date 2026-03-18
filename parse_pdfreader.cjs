const { PdfReader } = require('pdfreader');
const fs = require('fs');

async function parsePdf(file) {
    return new Promise((resolve, reject) => {
        let text = '';
        new PdfReader().parseFileItems(file, (err, item) => {
            if (err) reject(err);
            else if (!item) resolve(text);
            else if (item.text) text += item.text + '\n';
        });
    });
}

async function run() {
    try {
        const c1 = await parsePdf('docs/COMPANION.PDF');
        fs.writeFileSync('docs/COMPANION.PDF.txt', c1);
        console.log('Parsed COMPANION');
        
        const c2 = await parsePdf('docs/The_Mental_Dashboard.pdf');
        fs.writeFileSync('docs/The_Mental_Dashboard.pdf.txt', c2);
        console.log('Parsed Dashboard');
    } catch(e) {
        console.error(e);
    }
}

run();
