import {afterEach,expect,it,vi} from "vitest";
import type {MessageListener} from "../src/browser/api";
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();vi.restoreAllMocks();});
async function setup(){
 let listener:MessageListener|undefined;
 let navigate:((id:number,change:{status:string})=>void)|undefined;
 const persist=vi.fn(async (_value:unknown)=>undefined),badge=vi.fn(async (_value:unknown):Promise<void>=>{}),broadcast=vi.fn(async()=>undefined);
 vi.stubGlobal("browser",{runtime:{openOptionsPage:vi.fn(),getURL:(p:string)=>p,sendMessage:broadcast,
 onMessage:{addListener:(l:MessageListener)=>{listener=l;},removeListener:vi.fn()}},
 action:{setBadgeText:badge,setBadgeBackgroundColor:vi.fn(async()=>undefined),getBadgeText:vi.fn(async()=>"")},
 tabs:{query:vi.fn(async()=>[]),create:vi.fn(),sendMessage:vi.fn(),onUpdated:{addListener:(l:typeof navigate)=>{navigate=l;},removeListener:vi.fn()},onRemoved:{addListener:vi.fn(),removeListener:vi.fn()}},
 i18n:{getMessage:vi.fn(()=>""),getUILanguage:()=>"de"},
 storage:{local:{},sync:{},session:{set:persist,get:vi.fn(async()=>({})),remove:vi.fn(async()=>undefined)},onChanged:{addListener:vi.fn(),removeListener:vi.fn()}}});
 await import("../src/background");
 const send=(count=2,hostname="example.test",replacement="Nutzer")=>listener!({type:"sprachverstand.replacement-state",hostname,count,
 replacements:[{original:"Nutzer:innen",replacement,count}]},{tab:{id:37}});
 return {send,persist,badge,broadcast,navigate:()=>navigate!(37,{status:"loading"})};
}
it("skips complete duplicates but publishes changes to host, details and count",async()=>{
 const s=await setup();await s.send();await s.send();expect(s.persist).toHaveBeenCalledTimes(1);expect(s.badge).toHaveBeenCalledTimes(1);expect(s.broadcast).toHaveBeenCalledTimes(2);
 await s.send(2,"other.test");await s.send(2,"other.test","Andere");await s.send(3,"other.test","Andere");
 expect(s.persist).toHaveBeenCalledTimes(4);expect(s.badge).toHaveBeenCalledTimes(4);
});
it("retries identical state after a swallowed persistence error and a rejected badge update",async()=>{
 const s=await setup();s.persist.mockRejectedValueOnce(Error("synthetic storage failure"));
 await s.send();await s.send();await s.send();expect(s.persist).toHaveBeenCalledTimes(2);
 s.badge.mockRejectedValueOnce(Error("synthetic badge failure"));await expect(s.send(3)).rejects.toThrow("synthetic badge failure");
 await s.send(3);await s.send(3);expect(s.persist).toHaveBeenCalledTimes(4);
});
it("does not suppress a publication while an equal update is still pending",async()=>{
 const s=await setup();let release!:()=>void;
 s.badge.mockImplementationOnce(()=>new Promise<void>(resolve=>{release=resolve;}));
 const first=s.send();await vi.waitFor(()=>expect(s.badge).toHaveBeenCalledTimes(1));
 await s.send();expect(s.badge).toHaveBeenCalledTimes(2);release();await first;
});
it("does not reuse an old successful publication across navigation",async()=>{
 const s=await setup();await s.send();s.navigate();await vi.waitFor(()=>expect(s.badge).toHaveBeenCalledWith({text:"",tabId:37}));
 const before=s.persist.mock.calls.length;await s.send();expect(s.persist).toHaveBeenCalledTimes(before+1);
});
it("publishes the old value again when a different state is still in flight",async()=>{
 const s=await setup();await s.send(2);let release!:()=>void;
 s.badge.mockImplementationOnce(()=>new Promise<void>(resolve=>{release=resolve;}));
 const changed=s.send(3);await vi.waitFor(()=>expect(s.badge).toHaveBeenCalledTimes(2));
 await s.send(2);expect(s.persist).toHaveBeenCalledTimes(3);expect(s.badge).toHaveBeenCalledTimes(3);
 release();await changed;
});
