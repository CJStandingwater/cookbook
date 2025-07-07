const { hashIngredients } = require('../check-duplicates');

describe('hashIngredients', () => {
  test('is case-insensitive', () => {
    const a = [
      { items: [{ item: 'Sugar' }, { item: 'flour' }] }
    ];
    const b = [
      { items: [{ item: 'sugar' }, { item: 'Flour' }] }
    ];
    expect(hashIngredients(a)).toBe(hashIngredients(b));
  });

  test('order differences yield same hash', () => {
    const a = [
      { items: [{ item: 'milk' }, { item: 'eggs' }] }
    ];
    const b = [
      { items: [{ item: 'eggs' }, { item: 'milk' }] }
    ];
    expect(hashIngredients(a)).toBe(hashIngredients(b));
  });
});
