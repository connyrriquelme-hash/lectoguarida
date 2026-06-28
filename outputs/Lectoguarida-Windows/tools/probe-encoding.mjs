const sample = 'ðŸ«§';
const once = Buffer.from(sample, 'latin1').toString('utf8');
const twice = Buffer.from(once, 'latin1').toString('utf8');
const thrice = Buffer.from(twice, 'latin1').toString('utf8');
console.log(JSON.stringify({ sample, once, twice, thrice }));
