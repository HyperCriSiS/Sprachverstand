export function classifyNativeFailure(stderr,status){
 if(status===0)return 'none';
 const line=String(stderr).split(/\r?\n/).find(line=>/^\w*Error(?: \[[A-Z_]+\])?:/.test(line))??'';
 if(line.includes('Source-control wall budget')||line.includes('Source-control CPU budget'))return 'setup-timing';
 if(line.startsWith('VideoFrameRatioError:'))return 'frame-ratio';
 if(line.includes('Zu viele verworfene Videoframes'))return 'frame-drops';
 if(line.includes('Frame-Lücke')||line.includes('Frame-Lücken'))return 'frame-gap';
 if(line.includes('P95-Frameabstand'))return 'frame-p95';
 if(line.includes('Dynamische Endtexte'))return 'end-texts';
 if(line.includes('Textkorrektur'))return 'static-text';
 if(String(stderr).includes('prepareSourceControl'))return 'setup-binding';
 return 'unexpected';
}
