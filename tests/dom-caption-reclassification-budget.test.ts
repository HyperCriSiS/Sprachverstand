import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import type {Rule} from "../src/core/rule";
import {defaultRules} from "../src/rules";
const rule: Rule = {id:"test.caption-classification", risk:"safe", apply(input) {
  const text=input.replaceAll("Nutzer:innen", "Nutzer");
  return {text, replacements:text===input?0:1};
}};
let processor: DomProcessor | undefined;
function fixture() {
  const root=document.createElement("section"); root.title="Nutzer:innen title";
  const nodes=Array.from({length:256}, (_,index)=> {
    const node=document.createTextNode("Nutzer:innen "+index);
    const span=document.createElement("span"); span.append(node); root.append(span); return node;
  });
  const outside=document.createElement("p"); outside.textContent="Nutzer:innen outside";
  document.body.append(root,outside);
  processor=new DomProcessor(document,{rules:[rule],profile:"aggressive",
    processQuotedText:true,processAccessibleAttributes:true,processSubtitles:false});
  processor.start();processor.flush();
  return {root,nodes,outside};
}
afterEach(()=>{processor?.stop({restore:true});processor=undefined;vi.restoreAllMocks();document.body.replaceChildren();});
describe("Budgetierter Restore nach Untertitelklassifikation",()=>{
  it("fasst wiederholte Änderungen desselben ausgeschlossenen Captiontexts vor der Boundarysuche zusammen",async()=>{
    const {root,nodes}=fixture();await Promise.resolve();
    root.className="ytp-caption-window-container";await Promise.resolve();processor!.flush();await Promise.resolve();
    const captionProcessor=processor! as unknown as {isSubtitleContent(node:Node):boolean};
    const classification=vi.spyOn(captionProcessor,"isSubtitleContent");
    for(let index=0;index<5000;index++) nodes[0]!.data="Nutzer:innen extern "+index;
    await Promise.resolve();
    expect(classification.mock.calls.length).toBeLessThanOrEqual(2);
    expect(nodes[0]!.data).toBe("Nutzer:innen extern 4999");
  });
  it("scannt bei vielen Änderungen im vollständig ausgeschlossenen Captionblock keine Grammatiknachbarn",async()=>{
    const {root,nodes}=fixture();await Promise.resolve();
    root.className="ytp-caption-window-container";await Promise.resolve();processor!.flush();await Promise.resolve();
    const contextProcessor=processor! as unknown as {
      invalidatePrecedingParticipleContext(node:Node):void;
      invalidateFollowingContext(node:Node):void;
    };
    const preceding=vi.spyOn(contextProcessor,"invalidatePrecedingParticipleContext");
    const following=vi.spyOn(contextProcessor,"invalidateFollowingContext");
    for(const node of nodes) node.data="Nutzer:innen extern";
    await Promise.resolve();processor!.flush();
    expect(preceding).not.toHaveBeenCalled();
    expect(following).not.toHaveBeenCalled();
    expect(nodes.every(node=>node.data==="Nutzer:innen extern")).toBe(true);
  });
  it("bewahrt grammatische Nachbarupdates bei inline ausgeschlossenen Captions",async()=>{
    document.body.innerHTML='<p><span class="ytp-caption-segment">mit </span><span id="word">Nutzer:innen</span></p>';
    processor=new DomProcessor(document,{rules:defaultRules,profile:"aggressive",processSubtitles:false});
    processor.start();processor.flush();await Promise.resolve();
    expect(document.querySelector('#word')!.textContent).toBe('Nutzern');
    document.querySelector('span')!.firstChild!.textContent='für ';
    await Promise.resolve();processor.flush();
    expect(document.querySelector('#word')!.textContent).toBe('Nutzer');
  });
  it("restauriert einen großen ausgeschlossenen Captionbereich ohne die normale Textarbeit zu blockieren",async()=>{
    const {root,nodes,outside}=fixture();await Promise.resolve();
    root.className="ytp-caption-window-container";outside.firstChild!.textContent="Nutzer:innen neu";
    await Promise.resolve();
    expect(processor!.getReplacementCount()).toBeGreaterThan(1);
    const clock=vi.spyOn(performance,"now").mockReturnValue(0);
    try {(processor as unknown as {flushRegularNodesBudgeted():void}).flushRegularNodesBudgeted();}
    finally {clock.mockRestore();}
    expect(outside.textContent).toBe("Nutzer neu");
    expect(nodes.some((node,index)=>node.data==="Nutzer "+index)).toBe(true);
    processor!.flush();
    expect(nodes.every((node,index)=>node.data==="Nutzer:innen "+index)).toBe(true);
    expect(root.title).toBe("Nutzer:innen title");
    expect(processor!.getReplacementCount()).toBe(1);
  });
  it("behält bei rechtzeitiger Rücknahme des Captionstatus korrekte eigene Änderungen",async()=>{
    const {root,nodes}=fixture();await Promise.resolve();
    root.className="ytp-caption-window-container";await Promise.resolve();
    root.className="normal";await Promise.resolve();processor!.flush();
    expect(nodes.every((node,index)=>node.data==="Nutzer "+index)).toBe(true);
    expect(root.title).toBe("Nutzer title");
    expect(processor!.getReplacementCount()).toBe(258);
    processor!.stop({restore:true});
    expect(nodes.every((node,index)=>node.data==="Nutzer:innen "+index)).toBe(true);
  });
  it("stellt bei StopBudgeted alle noch ausstehenden Captionoriginale wieder her",async()=>{
    const {root,nodes}=fixture();await Promise.resolve();
    root.className="ytp-caption-window-container";await Promise.resolve();
    await processor!.stopBudgeted();
    expect(nodes.every((node,index)=>node.data==="Nutzer:innen "+index)).toBe(true);
    expect(root.title).toBe("Nutzer:innen title");
    expect(processor!.getReplacementCount()).toBe(0);
  });
});
