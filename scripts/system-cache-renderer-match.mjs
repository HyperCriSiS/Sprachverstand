export function matchesOwnedRenderer(command,comm){
 return {argumentMatch:typeof command==='string'&&/(?:^|[\0\s])--type=renderer(?:[\0\s]|$)/u.test(command),
  commMatch:comm==='CrRendererMain'};
}
