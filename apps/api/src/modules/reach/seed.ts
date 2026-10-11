// Port of private.reseed_demo_reach(): idempotent, anchored to now(), so the demo stays fresh.
import { eq, sql } from "drizzle-orm";
import type { DbOrTx } from "../../core/db";
import { appointments, campaigns, leads } from "../../core/schema";

export const DEMO_SLUG = "rimba-ventures-demo";

export async function seedReachDemo(db: DbOrTx, orgId: string) {
  await db.delete(campaigns).where(eq(campaigns.orgId, orgId));
  await db.delete(leads).where(eq(leads.orgId, orgId));
  await db.delete(appointments).where(eq(appointments.orgId, orgId));

  await db.execute(sql`insert into campaigns (org_id, name, channel, status, leads_count, spend_cents, cpl_cents, created_at)
     values
      (${orgId}::uuid,'Ramadan–Raya Promo','facebook','active', 96, 96*1250, 1250, now()-interval '40 days'),
      (${orgId}::uuid,'Lead Magnet — eBook','whatsapp','active', 61, 61*688,  688,  now()-interval '33 days'),
      (${orgId}::uuid,'Retargeting — Cart','instagram','active', 54, 54*1185, 1185, now()-interval '26 days'),
      (${orgId}::uuid,'New Product Launch','tiktok','paused',    70, 70*2640, 2640, now()-interval '19 days'),
      (${orgId}::uuid,'Brand Awareness','facebook','paused',     18, 18*5000, 5000, now()-interval '12 days')`);

  // 342 leads. Channel/stage/week each honor their exact marginals
  // (channel 142/96/68/36, stage 78/106/62/48/48, weekly 30/34/36/42/46/50/50/54), decorrelated by hash order.
  await db.execute(sql`insert into leads (org_id, name, channel, stage, source, created_at)
     select ${orgId}::uuid,
       (array['Aisyah','Faiz','Nurul','Hafiz','Siti','Danial','Farah','Amir',
              'Liyana','Zikri','Balqis','Hakim','Intan','Rizal','Maya','Syafiq'])[1 + (i % 16)]
       || ' ' ||
       (array['Rahim','Hakim','Huda','Ismail','Osman','Tan','Lim','Kaur',
              'Abdullah','Yusof','Chong','Devi','Karim','Noor','Salleh','Wong'])[1 + ((i*7) % 16)],
       case when rc<=142 then 'whatsapp' when rc<=238 then 'facebook'
            when rc<=306 then 'instagram' else 'tiktok' end,
       case when rs<=78 then 'lead' when rs<=184 then 'contacted'
            when rs<=246 then 'qualified' when rs<=294 then 'booked' else 'won' end,
       (array['WhatsApp click ad','Facebook lead form','Instagram DM',
              'TikTok bio link','Website form','Customer referral'])[1 + (i % 6)],
       now() - make_interval(days => wa*7 + (i % 7))
     from (
       select i,
         row_number() over (order by md5(i::text||'ch')) as rc,
         row_number() over (order by md5(i::text||'st')) as rs,
         row_number() over (order by md5(i::text||'wk')) as rw
       from generate_series(1,342) as g(i)
     ) base
     cross join lateral (select case
         when rw<=30 then 7 when rw<=64 then 6 when rw<=100 then 5 when rw<=142 then 4
         when rw<=188 then 3 when rw<=238 then 2 when rw<=288 then 1 else 0 end as wa) wk`);

  await db.execute(sql`insert into appointments (org_id, contact_name, kind, scheduled_at, via, created_at)
     values
      (${orgId}::uuid,'Aisyah Rahim','Discovery call', now()+interval '5 hours','WhatsApp', now()-interval '2 days'),
      (${orgId}::uuid,'Faiz Hakim','Product demo',     now()+interval '26 hours','Zoom',    now()-interval '2 days'),
      (${orgId}::uuid,'Nurul Huda','Follow-up',        now()+interval '72 hours','Call',    now()-interval '2 days')`);
}
