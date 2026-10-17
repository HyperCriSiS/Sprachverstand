// Synthetic fixture control only; deliberately no product code, rules or APIs.
export function installSubtitleLiteralControl(){
  const stats={installed:true,normalWrites:0,cueWrites:0,staticWrites:0};
  function apply(node){
    if(!node||node.nodeType!==1||node.closest('code,pre,input,textarea,[contenteditable]'))return;
    const text=node.textContent;
    let kind;
    if(node.id==='static-target'&&text==='Nutzer:innen')kind='staticWrites';
    else if(node.id==='subtitle-target'&&/^Nutzer:innen im Untertitel \d+$/.test(text))kind='cueWrites';
    else if(node.tagName==='SPAN'&&node.parentElement?.id==='subtitle-load-control-root'&&/^Nutzer:innen \d+ \/ \d+$/.test(text))kind='normalWrites';
    if(kind){node.textContent='Nutzer'+text.slice('Nutzer:innen'.length);stats[kind]++;}
  }
  const observer=new MutationObserver(records=>{for(const record of records)apply(record.target.nodeType===3?record.target.parentElement:record.target);});
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
  apply(document.getElementById('static-target'));apply(document.getElementById('subtitle-target'));
  window.__subtitleLiteralStats=stats;
  window.__stopSubtitleLiteralControl=()=>observer.disconnect();
  return {installed:true};
}

export function subtitleLiteralInstallationScript(){
  return 'return ('+installSubtitleLiteralControl.toString()+')();';
}
