export function summarizeSyntheticOptOutput(stdout,stderr){
 const count=text=>text.split(/\r?\n/).filter(line=>line.includes('JSFunction svDiagnosticHotLoop')&&/marking|compiling|optimizing/.test(line)).length;
 return {recognizedFunctionLinesStdout:count(stdout),recognizedFunctionLinesStderr:count(stderr)};
}
