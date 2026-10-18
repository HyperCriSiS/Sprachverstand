// Minimum reference qualification, not the final #419 quality acceptance.
// Reuse the existing absolute gap ceiling; a slower baseline must not raise it.
export function validateVideoBaselineSafety(baseline){
 const maximum=baseline?.frames?.maximumGapMs;
 if(!Number.isFinite(maximum)||maximum<0)throw new Error('Videobaseline: maximaler Frameabstand fehlt oder ist ungueltig.');
 if(maximum>300)throw new Error(`Videobaseline ungeeignet: maximale Frame-Luecke ${maximum.toFixed(1)} ms ueberschreitet die bestehende absolute Sicherheitsgrenze 300 ms.`);
}
