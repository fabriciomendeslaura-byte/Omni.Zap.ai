const fs = require('fs');
const data = JSON.parse(fs.readFileSync('OMNIZAP_ADAPTADO.json', 'utf8'));

const target = 'MENSAGEN OFICIAL PARA O AGENTE';

console.log('Incoming connections to:', target);
Object.entries(data.connections).forEach(([src, conns]) => {
  if (conns && conns.main && conns.main[0]) {
    conns.main[0].forEach(c => {
      if (c && c.node === target) {
        console.log('  ', src, '->', target);
      }
    });
  }
});

console.log('Outgoing connections from:', target);
const out = data.connections[target];
if (out) console.log(JSON.stringify(out, null, 2));

console.log('---');
console.log('Who connects to Agent?');
const agent = 'AGENTE LAURA WHATSAPP';
Object.entries(data.connections).forEach(([src, conns]) => {
  if (conns && conns.main && conns.main[0]) {
    conns.main[0].forEach(c => {
      if (c && c.node === agent) {
        console.log('  ', src, '->', agent);
      }
    });
  }
});
