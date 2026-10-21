import { describe, expect, it } from 'vitest';
import { calculateShootingQuote } from '../src/lib/config';
describe('calculateShootingQuote',()=>{
 it('calculates the configured 25% discount using integer XOF amounts',()=>{expect(calculateShootingQuote(100000)).toEqual({referencePriceXof:100000,discountPercent:25,discountXof:25000,proposedPriceXof:75000});});
 it('rounds discount amounts to whole XOF',()=>{expect(calculateShootingQuote(101,25).discountXof).toBe(25);});
 it('rejects invalid reference prices',()=>{expect(()=>calculateShootingQuote(-1)).toThrow();expect(()=>calculateShootingQuote(10.5)).toThrow();});
 it('rejects percentages outside 0–100',()=>{expect(()=>calculateShootingQuote(100,-1)).toThrow();expect(()=>calculateShootingQuote(100,101)).toThrow();});
});
