const assert = require('assert');
const { encontrarRecargaOptima } = require('./script.js');

console.log('--- Running Tests for encontrarRecargaOptima ---');

// 1. Edge Case: empty montosRecarga
console.log('Test: empty montosRecarga');
const resultEmpty = encontrarRecargaOptima(100, []);
assert(Array.isArray(resultEmpty), 'Should return an array');
assert.strictEqual(resultEmpty.length, 0, 'Should be an empty array');

// 2. Edge Case: null montosRecarga
console.log('Test: null montosRecarga');
const resultNull = encontrarRecargaOptima(100, null);
assert(Array.isArray(resultNull), 'Should return an array');
assert.strictEqual(resultNull.length, 0, 'Should be an empty array');

// 3. Happy Path: exact match
console.log('Test: exact match');
const resultExact = encontrarRecargaOptima(100, [50, 60]);
assert.strictEqual(resultExact.length, 1, 'Should have 1 option');
assert.strictEqual(resultExact[0].suma, 100, 'Sum should be 100');
assert.deepStrictEqual(resultExact[0].seleccionados, [50, 50], 'Should select two 50s');

// 4. Multiple Options: minimize sum vs minimize recharges
console.log('Test: multiple options');
// target 100
// option 1: 100 (diff 0, 5 recharges of 20)
// option 2: 120 (diff 20, 1 recharge of 120) - but within 20% limit?
// 120 / 100 = 1.2. 120 is at the 20% limit.
const resultMulti = encontrarRecargaOptima(100, [20, 120]);
assert(resultMulti.length >= 1, 'Should have at least one option');
console.log('Options found:', resultMulti.length);

console.log('--- ALL TESTS PASSED ---');
