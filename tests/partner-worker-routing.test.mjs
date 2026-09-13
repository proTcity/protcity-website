import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSync } from 'esbuild';
const built = buildSync({entryPoints:['src/worker.ts'],bundle:true,format:'esm',platform:'browser',write:false});
const {default:worker} = await import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
const env = {ASSETS:{fetch:async request=>new Response(new URL(request.url).pathname)}};
const context = {waitUntil:()=>{}};
test('public intake cannot fall through to assets or redirect POST to apex',async()=>{
  for(const origin of ['https://www.protcity.com','https://protcity.com']) {
    const response=await worker.fetch(new Request(origin+'/api/partner-applications'),env,context);
    assert.equal(response.status,405); assert.equal(response.headers.get('location'),null);
  }
});
test('ordinary assets and canonical redirect keep existing routing',async()=>{
  assert.equal(await (await worker.fetch(new Request('https://www.protcity.com/partner'),env,context)).text(),'/partner');
  const redirect=await worker.fetch(new Request('https://protcity.com/partner'),env,context);
  assert.equal(redirect.status,301);assert.equal(redirect.headers.get('location'),'https://www.protcity.com/partner');
});
test('GuestSafe landing and app association routes remain available without upstream calls',async()=>{
  const guest=await worker.fetch(new Request('https://www.protcity.com/guestsafe/demo-property'),env,context);
  assert.equal(await guest.text(),'/guestsafe-hotel');assert.equal(guest.headers.get('x-robots-tag'),'noindex, follow');
  const app=await worker.fetch(new Request('https://www.protcity.com/.well-known/apple-app-site-association'),env,context);
  assert.equal(app.status,200);assert.ok((await app.json()).applinks);
});

test('scheduled retention completes and emits only a stable event', async()=>{
  const messages=[]; const old=console.info;
  console.info=message=>messages.push(message);
  try {
    await worker.scheduled({cron:"17 3 * * *"}, {PARTNER_APPLICATIONS_DB:{
      prepare:()=>({bind:()=>({})}),
      batch:async()=>[0,1,2,3].map(()=>({success:true,results:[]}))
    }});
    assert.deepEqual(messages,[JSON.stringify({event:'partner_retention_completed'})]);
  } finally {console.info=old;}
});
test('scheduled retention failure hides provider details and fails the event',async()=>{
  const messages=[];const old=console.error;console.error=message=>messages.push(message);
  try {
    await assert.rejects(worker.scheduled({cron:"17 3 * * *"}, {PARTNER_APPLICATIONS_DB:{
      prepare:()=>({bind:()=>({})}),
      batch:async()=>{throw new Error('sensitive-provider-detail');}
    }}),/^Error: partner_retention_failed$/);
    assert.deepEqual(messages,[JSON.stringify({event:'partner_retention_failed'})]);
  } finally {console.error=old;}
});

test('unknown cron does nothing and email cron cannot purge retention',async()=>{
 const db={prepare:()=>{throw new Error('unexpected database access');}};
 await worker.scheduled({cron:'unknown'},{PARTNER_APPLICATIONS_DB:db});
 await worker.scheduled({cron:'*/5 * * * *'},{PARTNER_APPLICATIONS_DB:db,PARTNER_EMAIL_ENABLED:'false'});
});
