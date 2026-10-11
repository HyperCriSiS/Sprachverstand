import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {defaultRules} from "../src/rules";
import type {DetailedTransformResult} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
afterEach(() => {processor?.stop({restore: true}); processor=undefined; document.body.replaceChildren();});
function start(): void {
  processor=new DomProcessor(document,{rules:defaultRules,profile:"aggressive"});
  processor.start();processor.flush();
}
async function flush(): Promise<void> {await Promise.resolve();processor!.flush();await Promise.resolve();}

it("does not traverse a removed neutral subtree when its only tracked change is elsewhere",async()=>{
  document.body.innerHTML='<p>Nutzer:innen</p><div>'+ '<span>Neutraler Text</span>'.repeat(100)+'</div>';
  const root=document.querySelector("div")!;start();
  const walk=vi.spyOn(document,"createTreeWalker");
  root.remove();await flush();
  expect(walk.mock.calls.filter(call=>call[0]===root)).toHaveLength(0);
  expect(processor!.getReplacementCount()).toBe(1);
  expect(root.textContent).toBe("Neutraler Text".repeat(100));
});

it("restores tracked text and attributes before a detached subtree is recycled",async()=>{
  document.body.innerHTML='<div title="Lehrer:innen"><p>Nutzer:innen</p></div>';
  const root=document.querySelector("div")!;start();root.remove();await flush();
  expect(root.textContent).toBe("Nutzer:innen");
  expect(root.title).toBe("Lehrer:innen");
  expect(processor!.getReplacementCount()).toBe(0);
  document.body.append(root);await flush();
  expect(root.textContent).toBe("Nutzer");expect(root.title).toBe("Lehrer");
});

it("includes tracked descendants inside nested open ShadowRoots",async()=>{
  const root=document.createElement("div");const host=document.createElement("span");
  const shadow=host.attachShadow({mode:"open"});const nested=document.createElement("span");
  const inner=nested.attachShadow({mode:"open"});inner.textContent="Nutzer:innen";
  shadow.append(nested);root.append(host);document.body.append(root);start();
  expect(inner.textContent).toBe("Nutzer");root.remove();await flush();
  expect(inner.textContent).toBe("Nutzer:innen");expect(processor!.getReplacementCount()).toBe(0);
});

it("keeps the traversal path when there are many tracked changes",async()=>{
  document.body.innerHTML='<div>'+ '<span>Nutzer:innen</span>'.repeat(65)+'</div>';
  const root=document.querySelector("div")!;start();root.remove();await flush();
  expect(root.textContent).toBe("Nutzer:innen".repeat(65));expect(processor!.getReplacementCount()).toBe(0);
});

it("cancels a pending transformation when its subtree is detached and ignores its late response",async()=>{
  document.body.innerHTML='<div>Nutzer:innen</div>';
  const root=document.querySelector("div")!;
  const replies: ((result: DetailedTransformResult)=>void)[]=[];
  processor=new DomProcessor(document,{rules:defaultRules,profile:"aggressive",
    transformText:()=>new Promise(resolve=>{replies.push(resolve);})});
  const settle=async()=>{for(let index=0;index<12;index++)await Promise.resolve();};
  processor.start();processor.flush();await settle();expect(replies).toHaveLength(1);
  root.remove();await flush();document.body.append(root);await flush();await settle();
  expect(replies).toHaveLength(2);
  const result={text:"Nutzer",replacements:1,summaries:[{original:"Nutzer:innen",replacement:"Nutzer",count:1}]};
  replies[0]!(result);await settle();processor.flush();expect(root.textContent).toBe("Nutzer:innen");
  replies[1]!(result);await settle();processor.flush();expect(root.textContent).toBe("Nutzer");
  expect(processor.getReplacementCount()).toBe(1);
});
