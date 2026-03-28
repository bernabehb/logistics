const fs = require('fs');
const deliveries = JSON.parse(fs.readFileSync('src/lib/deliveries.json', 'utf8'));

const userBlocks = {
  "Juan Pérez": { block: "AZTLAN 1", addr: "Av. Rodrigo G\u00f3mez 1639, Monterrey, N.L." },
  "Ricardo Gomez": { block: "CAMINO REAL 2", addr: "Av. La Esperanza 1274, Monterrey, N.L." },
  "Mario Lopez": { block: "LA AURORA", addr: "Colonia La Aurora 1678, Santa Catarina, N.L." },
  "Roberto Torres": { block: "SAN NICOLAS CRISTINA LARRALDE", addr: "Av. Cristina Larralde 1564, San Nicol\u00e1s de los Garza, N.L." },
  "Luis Ram\u00edrez": { block: "SAN NICOLAS SANTO DOMINGO", addr: "Av. Diego D\u00edaz de Berlanga 2032, San Nicol\u00e1s de los Garza, N.L." },
  "Pedro M\u00e9ndez": { block: "FELIX U. GOMEZ", addr: "Calle Ruperto Martinez 801, Monterrey, N.L." }
};

const otherBlocksList = [
  { block: "AZTLAN 2", addr: "Calle Aztlan 222, Monterrey" },
  { block: "CAMINO REAL 1", addr: "Camino Real 111, Monterrey" },
  { block: "GENERAL ESCOBEDO", addr: "Centro, General Escobedo" },
  { block: "MIRASUR", addr: "Mirasur 333, Escobedo" },
  { block: "NIN\u00d1 ARTILLERO", addr: "Ni\u00f1o Artillero 444, Monterrey" },
  { block: "SAN NICOLAS MANUEL BARRAGAN", addr: "Barragan 555, San Nicolas" },
  { block: "SAN NICOLAS MIGUEL ALEMAN", addr: "Miguel Aleman 666, San Nicolas" },
  { block: "SANTA CATARINA", addr: "Centro, Santa Catarina" }
];

const allBlocks = [...Object.values(userBlocks), ...otherBlocksList];

deliveries.forEach(del => {
  const driver = del.driverName;
  const isPrimary = Math.random() < 0.7;
  let chosenTarget;
  
  if (isPrimary && userBlocks[driver]) {
    chosenTarget = userBlocks[driver];
  } else {
    const primaryBlock = userBlocks[driver] ? userBlocks[driver].block : null;
    const pool = allBlocks.filter(b => b.block !== primaryBlock);
    chosenTarget = pool[Math.floor(Math.random() * pool.length)];
  }
  
  if (chosenTarget) {
    del.block = chosenTarget.block;
    del.address = chosenTarget.addr;
  }
});

fs.writeFileSync('src/lib/deliveries.json', JSON.stringify(deliveries, null, 2));
console.log("Rewrite completed");
