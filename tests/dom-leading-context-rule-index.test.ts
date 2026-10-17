import {afterEach,describe,expect,it} from 'vitest';
import {DomProcessor} from '../src/core/dom-processor';
import type {Rule} from '../src/core/rule';
const plain:Rule={id:'test.context-index',risk:'contextual',apply(input){return {text:input.replaceAll('Nutzer:innen','Nutzer'),replacements:input.includes('Nutzer:innen')?1:0};}};
const contextual:Rule={...plain,leadingContextCandidate:/Nutzer:innen/gu,leadingContextRequiresTrailingWhitespace:true,
 applyWithLeadingContext(input,context){return {text:input.replaceAll('Nutzer:innen',context.endsWith('mit ')?'Nutzern':'Nutzer'),replacements:input.includes('Nutzer:innen')?1:0};}};
let processor:DomProcessor|undefined;
afterEach(()=>{processor?.stop();processor=undefined;document.body.replaceChildren();});
function fixture(){document.body.innerHTML='<p>mit <b>Nutzer:innen</b></p><p>mit <b>Nutzer:innen</b></p>';}
function values(){return [...document.querySelectorAll('p')].map(node=>node.textContent);}
describe('Leading context candidate rule index',()=>{
 it('refreshes context rules when options replace the rule list',()=>{
  fixture();processor=new DomProcessor(document,{rules:[plain],profile:'standard'});processor.start();processor.flush();
  expect(values()).toEqual(['mit Nutzer','mit Nutzer']);
  processor.updateOptions({rules:[contextual],profile:'standard'});processor.flush();
  expect(values()).toEqual(['mit Nutzern','mit Nutzern']);
  processor.updateOptions({rules:[plain],profile:'standard'});processor.flush();
  expect(values()).toEqual(['mit Nutzer','mit Nutzer']);
  processor.stop({restore:true});expect(values()).toEqual(['mit Nutzer:innen','mit Nutzer:innen']);
 });
 it('keeps global candidate regex resets and current disable/profile decisions',()=>{
  fixture();const disabled=new Set<string>();contextual.leadingContextCandidate!.lastIndex=999;
  processor=new DomProcessor(document,{rules:[contextual],profile:'standard',disabledRuleIds:disabled});processor.start();processor.flush();
  expect(values()).toEqual(['mit Nutzern','mit Nutzern']);
  processor.stop({restore:true});disabled.add(contextual.id);processor.start();processor.flush();
  expect(values()).toEqual(['mit Nutzer:innen','mit Nutzer:innen']);
  processor.stop();disabled.clear();processor.start();processor.flush();expect(values()).toEqual(['mit Nutzern','mit Nutzern']);
  processor.updateOptions({rules:[contextual],profile:'conservative'});processor.flush();expect(values()).toEqual(['mit Nutzer:innen','mit Nutzer:innen']);
 });
});
