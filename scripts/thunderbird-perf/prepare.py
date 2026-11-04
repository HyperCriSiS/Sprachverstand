"""Create an instrumented test copy; never change the distributable build."""
import argparse,json,shutil
from pathlib import Path

parser=argparse.ArgumentParser()
parser.add_argument('--source',default='dist/thunderbird')
parser.add_argument('--output',default='artifacts/thunderbird-perf-run')
parser.add_argument('--paragraphs',type=int,default=100)
parser.add_argument('--format',choices=['html','plain'],default='html')
parser.add_argument('--unique',action='store_true',help='Prefix each paragraph with a distinct number.')
args=parser.parse_args()
root=Path.cwd()
output=(root/args.output).resolve()
if not output.is_relative_to(root/'artifacts') or not 1<=args.paragraphs<=500:
    raise SystemExit('Use an artifacts/ output directory and 1–500 paragraphs.')
output.mkdir(parents=True,exist_ok=True)
shutil.copytree(root/args.source,output/'extension',dirs_exist_ok=True)
scripts=Path(__file__).parent
for name in ['probe.py','instrument.js']:
    shutil.copyfile(scripts/name,output/name)
manifest=output/'extension/manifest.json'
data=json.loads(manifest.read_text(encoding='utf-8'))
data['host_permissions']=['http://127.0.0.1:8765/*']
manifest.write_text(json.dumps(data),encoding='utf-8')
content=output/'extension/content.js'
content.write_text((scripts/'instrument.js').read_text(encoding='utf-8')+content.read_text(encoding='utf-8'),encoding='utf-8')
background=output/'extension/background.js'
background.write_text(background.read_text(encoding='utf-8')+'''
browser.runtime.onMessage.addListener(m=>{
 if(m?.type==='sv-qa-report')return fetch('http://127.0.0.1:8765/report',{
   method:'POST',body:JSON.stringify(m)
 }).then(()=>undefined);
});
''',encoding='utf-8')
paragraphs=[(f'{index+1}. ' if args.unique else '')+'Die Nutzer:innen und Mitarbeiter*innen lesen.' for index in range(args.paragraphs)]
body='<html><body>'+''.join('<p>'+text+'</p>' for text in paragraphs)+'</body></html>' if args.format=='html' else '\n\n'.join(paragraphs)
(output/'test.eml').write_text('From: qa@example.invalid\nTo: qa@example.invalid\nSubject: Performance fixture\nMIME-Version: 1.0\nContent-Type: text/'+args.format+'; charset=UTF-8\n\n'+body,encoding='utf-8')
print('Diagnostic copy prepared:',output)
