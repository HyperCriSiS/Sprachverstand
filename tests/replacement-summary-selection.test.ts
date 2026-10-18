import {expect,it} from "vitest";
import {compareReplacementSummaries,selectReplacementSummaries} from "../src/core/replacement-summary";
it("selects the exact report prefix for large, tied and shuffled counts without changing entries",()=>{
 const entries=Array.from({length:10000},(_,i)=>Object.freeze({original:`Wort${(i*7919)%10000}`,replacement:`Form${i%19}`,count:(i*37)%83+1}));
 const full=[...entries].sort(compareReplacementSummaries);
 for(const limit of [1,2,17,250,10001])expect(selectReplacementSummaries(entries,limit)).toEqual(full.slice(0,limit));
 const selected=selectReplacementSummaries(entries,250);expect(selected[0]).not.toBe(full[0]);
 Object.assign(selected[0]!,{count:0});expect(full[0]!.count).toBeGreaterThan(0);
 expect(selectReplacementSummaries(entries)).toEqual(full);
});
it("supports a zero report without iterating and rejects invalid limits",()=>{
 const entries={*[Symbol.iterator](){throw Error("must not iterate");}};
 expect(selectReplacementSummaries(entries,0)).toEqual([]);
 for(const value of [-1,NaN,1.5])expect(()=>selectReplacementSummaries([],value)).toThrow(RangeError);
 expect(selectReplacementSummaries([],250)).toEqual([]);
});
