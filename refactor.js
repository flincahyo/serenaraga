
const fs = require('fs');
let code = fs.readFileSync('src/components/FeedCanvasTemplates.tsx', 'utf8');

const switchStart = code.indexOf('switch (theme) {');
const switchEndMatch = code.match(/case 'layered_paper': return \([\s\S]*?\);\n    }\n/);
if (!switchStart || !switchEndMatch) throw new Error('Could not find switch');

const switchEnd = switchStart + code.substring(switchStart).indexOf(switchEndMatch[0]) + switchEndMatch[0].length;
const switchBody = code.substring(switchStart, switchEnd);

const beforeFeedStudio = code.substring(0, code.indexOf('export default function FeedStudio() {'));

let newCode = beforeFeedStudio;
newCode += 'export { THEMES };\n\n';
newCode += 'export function CanvasRenderer({ \n';
newCode += '  theme, bgImage, \n';
newCode += '  title, setTitle, \n';
newCode += '  label, setLabel, \n';
newCode += '  desc, setDesc, \n';
newCode += '  price, setPrice \n';
newCode += '}: {\n';
newCode += '  theme: string;\n';
newCode += '  bgImage: string;\n';
newCode += '  title: string; setTitle: (v: string) => void;\n';
newCode += '  label: string; setLabel: (v: string) => void;\n';
newCode += '  desc: string; setDesc: (v: string) => void;\n';
newCode += '  price: string; setPrice: (v: string) => void;\n';
newCode += '}) {\n';
newCode += '  const updatePriceItem = (index: number, text: string) => {};\n';
newCode += '  ' + switchBody + '\n';
newCode += '  return null;\n}\n';

fs.writeFileSync('src/components/FeedCanvasTemplates.tsx', newCode);
console.log('Successfully created CanvasRenderer');

