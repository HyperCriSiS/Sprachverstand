import json,time,subprocess,os,socket,threading,sys
from http.server import HTTPServer,BaseHTTPRequestHandler
reports=[]
class Handler(BaseHTTPRequestHandler):
 def do_POST(self):
  reports.append(json.loads(self.rfile.read(int(self.headers["Content-Length"]))))
  self.send_response(200);self.end_headers()
 def log_message(self,*args):pass
server=HTTPServer(("127.0.0.1",8765),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
from pathlib import Path
from marionette_driver.marionette import Marionette
p=Path('/tmp/tb-profile');p.mkdir(exist_ok=True)
prefs={'marionette.port':2828,'mail.provider.enabled':False,'mail.shell.checkDefaultClient':False,'mail.startup.enabledMailCheckOnce':False,'mailnews.start_page.enabled':False,'app.update.enabled':False,'datareporting.policy.dataSubmissionEnabled':False,'toolkit.telemetry.enabled':False,'browser.tabs.remote.autostart':False}
(p/'user.js').write_text('\n'.join('user_pref('+json.dumps(k)+','+json.dumps(v)+');' for k,v in prefs.items()))
log=open('/qa/tb.log','w')
process=subprocess.Popen(['thunderbird','--no-remote','--profile',str(p),'--marionette','--remote-allow-system-access'],stdout=log,stderr=log,env={**os.environ,'MOZ_DISABLE_CONTENT_SANDBOX':'1'})
try:
 for _ in range(120):
  try:
   socket.create_connection(('localhost',2828),1).close();break
  except OSError:time.sleep(.5)
 m=Marionette('localhost',port=2828);m.start_session();m.set_context('chrome')
 print('VERSION',m.execute_script('return Services.appinfo.version'),flush=True)
 print('WINDOWS',m.execute_script('return Array.from(Services.wm.getEnumerator(null)).map(w=>({url:w.location.href,type:w.document.documentElement.getAttribute("windowtype")}))'),flush=True)
 print('INSTALL',m.execute_async_script('''const done=arguments[arguments.length-1];const {AddonManager}=ChromeUtils.importESModule("resource://gre/modules/AddonManager.sys.mjs");const f=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);f.initWithPath("/qa/extension");AddonManager.installTemporaryAddon(f).then(a=>done(a.id),e=>done(String(e)));'''),flush=True)
 time.sleep(2)
 for index in range(6):
  fixture=Path('/qa/test.eml').read_bytes()
  Path(f'/qa/mail{index}.eml').write_bytes(fixture)
  m.execute_script('''const {MailUtils}=ChromeUtils.importESModule("resource:///modules/MailUtils.sys.mjs");const f=Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);f.initWithPath(arguments[0]);MailUtils.openEMLFile(Services.wm.getMostRecentWindow("mail:3pane"),f,Services.io.newFileURI(f));''',script_args=[f'/qa/mail{index}.eml'])
  deadline=time.monotonic()+10
  while len(reports)<=index and time.monotonic()<deadline:time.sleep(.05)
  if len(reports)<=index:raise RuntimeError('No diagnostic report: '+Path('/qa/tb.log').read_text()[-1500:])
  assert reports[index]['done'] is not None and reports[index]['corrected']==reports[index]['paragraphs'], reports[index]
  print('REPORT',json.dumps(reports[index]),flush=True)
 Path('/qa/results-'+os.environ.get('VARIANT','baseline')+'.json').write_text(json.dumps(reports,indent=2))
finally:
 process.terminate()
 server.shutdown()
