(() => {
  const injected = performance.now();
  const reads = [];
  for (const area of ['local','sync']) {
    const get = browser.storage[area].get.bind(browser.storage[area]);
    browser.storage[area].get = (...args) => {
      const start=performance.now();
      return get(...args).then(value=>{reads.push({area,start,end:performance.now()});return value;});
    };
  }
  let done = null, rawFrames = 0;
  const check = () => {
    const text = document.body?.textContent || '';
    if (text.includes('Die Nutzer und Mitarbeiter lesen.') && !text.includes('Nutzer:innen') && !text.includes('Mitarbeiter*innen')) done ??= performance.now();
  };
  const observer = new MutationObserver(check);
  observer.observe(document, {childList:true,subtree:true,characterData:true});
  const frame = () => {check();if(done === null) {rawFrames++;requestAnimationFrame(frame);}};
  requestAnimationFrame(frame);
  setTimeout(() => {
    check();observer.disconnect();
    browser.runtime.sendMessage({type:'sv-qa-report',injected,done,rawFrames,reads,
      paints:performance.getEntriesByType('paint').map(p=>({name:p.name,start:p.startTime})),
      paragraphs:document.querySelectorAll('p').length,
      corrected:(document.body?.textContent.match(/Die Nutzer und Mitarbeiter lesen\./g)||[]).length});
  }, 4000);
})();
