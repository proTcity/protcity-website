import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {buildSync} from 'esbuild';
import {createHmac} from 'node:crypto';
const load = async path => {const built=buildSync({entryPoints:[path],bundle:true,format:'esm',platform:'browser',write:false});return import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);};
const {handlePartnerAdmin:handle,processPartnerNotifications:processMail}=await load('src/server/partner-admin.ts');
const {handlePartnerApplication:intake,purgeExpiredPartnerApplications:purge}=await load('src/server/partner-applications.ts');
const schema='PRAGMA foreign_keys=ON;'+readFileSync('migrations/0001_partner_applications.sql','utf8')+readFileSync('migrations/0002_partner_admin_notifications.sql','utf8');
const PATH='/api/internal/partner-applications', origin='https://www.protcity.com';
const secret='synthetic-admin-secret-with-at-least-32-characters';
function harness(){
 const sql=new DatabaseSync(':memory:');sql.exec(schema);
 const db={prepare(query){return{bind(...values){return{query,values};}};},async batch(statements){sql.exec('BEGIN');try{const rows=statements.map(({query,values})=>({success:true,results:sql.prepare(query).all(...values)}));sql.exec('COMMIT');return rows;}catch(e){sql.exec('ROLLBACK');throw e;}}};
 const env={PARTNER_APPLICATIONS_DB:db,PARTNER_ADMIN_SECRET:secret,PARTNER_EMAIL_ENABLED:'true',PARTNER_INTAKE_ENABLED:'true',PARTNER_FORM_SECRET:secret,PARTNER_RATE_LIMITER:{limit:async()=>({success:true})}};
 function add(id=crypto.randomUUID(),createdAt=Math.floor(Date.now()/1000),expiresAt=createdAt+86400){sql.prepare(`INSERT INTO partner_applications(id,payload_hash,created_at,expires_at,language,source_path,name,email,company,market,profile_url,collaboration,approach,privacy_notice_version) VALUES(?,?,?,?,'en','/en/partner-network','Synthetic applicant','example@example.test','Synthetic company','Example','','explore','Synthetic proposal long enough for validation.','test')`).run(id,id,createdAt,expiresAt);return id;}
 function enqueue(id){sql.prepare('INSERT INTO partner_notification_outbox(application_id,next_attempt_at) VALUES(?,0)').run(id);}
 return{sql,env,db,add,enqueue};
}
const list=(extra={})=>({action:'list',operatorUid:'synthetic-admin',status:null,limit:20,cursor:null,...extra});
const update=(id,extra={})=>({action:'update',operatorUid:'synthetic-admin',id,targetStatus:'reviewing',expectedVersion:0,operationId:crypto.randomUUID(),...extra});
function signed(data,options={}){
 const body=typeof data==='string'?data:JSON.stringify(data), stamp=String(options.stamp??Math.floor(Date.now()/1000));
 const signature=createHmac('sha256',options.secret??secret).update(`${stamp}.${PATH}.${body}`).digest('hex');
 return new Request((options.origin??origin)+PATH+(options.query??''),{method:'POST',headers:{'Content-Type':'application/json','x-partner-timestamp':stamp,'x-partner-signature':signature,...options.headers},body});
}
const row=(h,id)=>h.sql.prepare('SELECT * FROM partner_applications WHERE id=?').get(id);
const notification=(h,id)=>h.sql.prepare('SELECT * FROM partner_notification_outbox WHERE application_id=?').get(id);
test('Admin rejects absent, forged, stale and future signatures and fails closed without secret',async()=>{
 const h=harness();h.add();
 for(const options of [{headers:{'x-partner-signature':''}},{secret:'wrong'},{stamp:Math.floor(Date.now()/1000)-61},{stamp:Math.floor(Date.now()/1000)+61}])assert.equal((await handle(signed(list(),options),h.env)).status,401);
 delete h.env.PARTNER_ADMIN_SECRET;assert.equal((await handle(signed(list()),h.env)).status,503);
});
test('Admin rejects unexpected method, path query, wrong origin and unsupported media',async()=>{
 const h=harness();
 assert.equal((await handle(new Request(origin+PATH),h.env)).status,405);
 assert.equal((await handle(signed(list(),{query:'?id=private'}),h.env)).status,403);
 assert.equal((await handle(signed(list(),{origin:'https://protcity.com'}),h.env)).status,403);
 assert.equal((await handle(signed(list(),{headers:{'Content-Type':'text/plain'}}),h.env)).status,415);
 h.env.PARTNER_INTAKE_LOCAL_ONLY='true';assert.equal((await handle(signed(list()),h.env)).status,403);
});
test('Admin validates signed input and bounds streaming body',async()=>{
 const h=harness();
 for(const payload of ['{',list({limit:51}),list({limit:0}),list({limit:1.5}),list({status:'owner'}),list({cursor:'not valid'}),list({cursor:btoa('[1,"invalid-id"]')}),list({operatorUid:'bad\nuid'}),list({role:'superadmin'}),update('bad'),update(crypto.randomUUID(),{expectedVersion:-1}),update(crypto.randomUUID(),{operationId:'invalid'})])assert.equal((await handle(signed(payload),h.env)).status,400);
 assert.equal((await handle(signed('x'.repeat(4097)),h.env)).status,413);
 assert.equal(h.sql.prepare('SELECT count(*) n FROM partner_application_audit').get().n,0);
});
test('Admin list keyset pagination covers equal timestamps, filters status and excludes expired rows',async()=>{
 const h=harness(),now=Math.floor(Date.now()/1000);const ids=Array.from({length:5},()=>h.add(undefined,now));h.add(undefined,0,0);
 h.sql.prepare("UPDATE partner_applications SET status='qualified' WHERE id=?").run(ids[0]);
 const found=[];let cursor=null;
 do{const response=await handle(signed(list({limit:2,cursor})),h.env);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const body=await response.json();found.push(...body.items.map(i=>i.id));cursor=body.nextCursor;}while(cursor);
 assert.deepEqual(found,[...ids].sort().reverse());
 const body=await(await handle(signed(list({status:'qualified'})),h.env)).json();assert.deepEqual(body.items.map(i=>i.id),[ids[0]]);
 const i=body.items[0];assert.equal(i.version,0);assert.deepEqual(i.notification,{status:'not_scheduled',attempts:0,lastAttemptAt:null});assert.equal('payload_hash'in i,false);
});
test('optimistic update commits one audit and version, stale mutation conflicts, exact retry returns current row',async()=>{
 const h=harness(),id=h.add(),action=update(id);
 let res=await handle(signed(action),h.env);assert.equal(res.status,200);assert.equal((await res.json()).item.version,1);
 res=await handle(signed(action),h.env);assert.equal(res.status,200);assert.equal(row(h,id).version,1);
 assert.equal((await handle(signed(update(id)),h.env)).status,409);
 assert.equal((await handle(signed({...action,targetStatus:'rejected'}),h.env)).status,409);
 assert.equal((await handle(signed(update(id,{expectedVersion:1,targetStatus:'qualified'})),h.env)).status,200);
 const retried=await(await handle(signed(action),h.env)).json();assert.equal(retried.item.version,2);assert.equal(retried.item.status,'qualified');
 assert.equal(h.sql.prepare('SELECT count(*) n FROM partner_application_audit').get().n,2);
});
test('same-status update increments version; concurrent different operations cannot both win',async()=>{
 const h=harness(),id=h.add();assert.equal((await handle(signed(update(id,{targetStatus:'new'})),h.env)).status,200);assert.equal(row(h,id).version,1);
 const outcomes=await Promise.all([handle(signed(update(id,{expectedVersion:1,targetStatus:'approved'})),h.env),handle(signed(update(id,{expectedVersion:1,targetStatus:'rejected'})),h.env)]);
 assert.deepEqual(outcomes.map(r=>r.status).sort(),[200,409]);assert.equal(row(h,id).version,2);
});
test('expired or missing application cannot be read or changed even on exact retry',async()=>{
 const h=harness(),id=h.add(),action=update(id);assert.equal((await handle(signed(action),h.env)).status,200);
 h.sql.prepare('UPDATE partner_applications SET expires_at=0 WHERE id=?').run(id);
 assert.equal((await handle(signed(action),h.env)).status,404);
 assert.equal((await handle(signed(update(crypto.randomUUID())),h.env)).status,404);
 assert.equal((await(await handle(signed(list()),h.env)).json()).items.length,0);
});
test('audit insert and mutation roll back together on SQL error; no provider errors escape',async()=>{
 const h=harness(),id=h.add();h.sql.exec("CREATE TRIGGER reject_update BEFORE UPDATE ON partner_applications BEGIN SELECT RAISE(ABORT,'private error'); END;");
 const res=await handle(signed(update(id)),h.env);assert.equal(res.status,503);assert.deepEqual(await res.json(),{error:'temporarily_unavailable'});
 assert.equal(row(h,id).version,0);assert.equal(h.sql.prepare('SELECT count(*) n FROM partner_application_audit').get().n,0);
});
test('new intake atomically enqueues once while historical and retried applications do not receive backfill',async()=>{
 const h=harness(),historic=h.add(),key=crypto.randomUUID();
 const payload={name:'Synthetic Applicant',email:'applicant@example.test',company:'Synthetic company',market:'Example market',profileUrl:'',collaboration:'explore',approach:'A synthetic proposal for validation and local testing.',language:'en',privacyAcknowledged:true,website:''};
 const req=()=>new Request(origin+'/api/partner-applications',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1','Idempotency-Key':key},body:JSON.stringify(payload)});
 for(let i=0;i<3;i++)assert.equal((await intake(req(),h.env)).status,202);
 assert.equal(h.sql.prepare('SELECT count(*) n FROM partner_notification_outbox').get().n,1);assert.equal(notification(h,historic),undefined);
 const send=[];const result=await processMail(h.env,async n=>send.push(n));assert.deepEqual(result,{sent:1,failed:0});assert.equal(send.length,1);assert.deepEqual(Object.keys(send[0]).sort(),['applicationId','messageId']);
 await processMail(h.env,async n=>send.push(n));assert.equal(send.length,1);
});
test('outbox insert error rolls back public application and receipt without false success',async()=>{
 const h=harness();h.sql.exec("CREATE TRIGGER reject_outbox BEFORE INSERT ON partner_notification_outbox BEGIN SELECT RAISE(ABORT,'private'); END;");
 const payload={name:'Synthetic Applicant',email:'applicant@example.test',company:'Synthetic company',market:'Example market',profileUrl:'',collaboration:'explore',approach:'A synthetic proposal for validation and local testing.',language:'en',privacyAcknowledged:true,website:''};
 const res=await intake(new Request(origin+'/api/partner-applications',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(payload)}),h.env);
 assert.equal(res.status,503);assert.equal(h.sql.prepare('SELECT count(*) n FROM partner_applications').get().n,0);assert.equal(h.sql.prepare('SELECT count(*) n FROM partner_application_receipts').get().n,0);
});
test('outbox racing processors claim once and expose sending then accepted state',async()=>{
 const h=harness(),id=h.add();h.enqueue(id);let calls=0,release;const gate=new Promise(r=>release=r);
 const first=processMail(h.env,async()=>{calls++;await gate;});
 while(!calls)await new Promise(r=>setImmediate(r));
 const detail=await(await handle(signed(list()),h.env)).json();assert.equal(detail.items[0].notification.status,'sending');
 await processMail(h.env,async()=>{calls++;});assert.equal(calls,1);release();await first;
 assert.equal(notification(h,id).status,'sent');assert.equal(notification(h,id).attempts,1);
});
test('outbox provider failure backs off, max attempts stop and errors contain no candidate data',async()=>{
 const h=harness(),id=h.add();h.enqueue(id);let calls=0;
 for(let i=1;i<=6;i++){const result=await processMail(h.env,async()=>{calls++;throw Error('private provider detail');});assert.equal(result.failed,1);const n=notification(h,id);assert.equal(n.attempts,i);assert.equal(n.status,i===6?'failed':'pending');assert.ok(n.next_attempt_at>Math.floor(Date.now()/1000));await processMail(h.env,async()=>calls++);assert.equal(calls,i);h.sql.exec('UPDATE partner_notification_outbox SET next_attempt_at=0');}
 await processMail(h.env,async()=>calls++);assert.equal(calls,6);
});
test('expired lease recovers; exhausted lease becomes failed; disabled email makes no changes',async()=>{
 const h=harness(),id=h.add();h.enqueue(id);h.sql.exec("UPDATE partner_notification_outbox SET status='sending',attempts=1,lease_expires_at=0,lease_token='expired'");
 h.env.PARTNER_EMAIL_ENABLED='false';await processMail(h.env,async()=>assert.fail());assert.equal(notification(h,id).attempts,1);
 h.env.PARTNER_EMAIL_ENABLED='true';await processMail(h.env,async()=>{});assert.equal(notification(h,id).attempts,2);assert.equal(notification(h,id).status,'sent');
 h.sql.exec("UPDATE partner_notification_outbox SET status='sending',attempts=6,lease_expires_at=0,lease_token='expired'");await processMail(h.env,async()=>assert.fail());assert.equal(notification(h,id).status,'failed');
});
test('bounded outbox processing and retention cascade remove related audit and mail rows',async()=>{
 const h=harness();for(let i=0;i<12;i++)h.enqueue(h.add());let calls=0;await processMail(h.env,async()=>calls++);assert.equal(calls,10);
 const id=h.add();h.enqueue(id);await handle(signed(update(id)),h.env);h.sql.prepare('UPDATE partner_applications SET expires_at=0 WHERE id=?').run(id);
 await processMail(h.env,async n=>assert.notEqual(n.applicationId,id));await purge(h.env);assert.equal(row(h,id),undefined);assert.equal(notification(h,id),undefined);assert.equal(h.sql.prepare('SELECT count(*) n FROM partner_application_audit WHERE application_id=?').get(id).n,0);
});
