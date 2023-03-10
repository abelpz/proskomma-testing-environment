// @vitest-environment jsdom

import { Proskomma } from '.';
describe('pkCore', () => {
  it('should work', () => {
    const pkCore = new Proskomma();
    expect(pkCore).toBeDefined();
  });
});
