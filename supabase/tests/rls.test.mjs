// RLS / security tests. Runs every migration + seed against an embedded Postgres
// (PGlite) with Supabase's auth/storage schemas stubbed, then exercises the
// policies as real `anon` / `authenticated` roles.
//
//   npm run test:db

import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sqlFiles = (dir) =>
  readdirSync(join(root, dir))
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(root, dir, f), "utf8"));

const ALICE = "00000000-0000-4000-8000-00000000000a";
const BOB = "00000000-0000-4000-8000-00000000000b";
const CAROL = "00000000-0000-4000-8000-00000000000c"; // private profile

/** @type {PGlite} */
let db;
let tableMountain;
let sneeuberg;

/** Run `fn` inside a transaction as the given user (or anon when userId is null). */
async function as(userId, fn) {
  return db.transaction(async (tx) => {
    await tx.query(`set local role ${userId ? "authenticated" : "anon"}`);
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify(userId ? { sub: userId, role: "authenticated" } : { role: "anon" }),
    ]);
    return fn(tx);
  });
}

async function rejects(promise, pattern = /row-level security|permission denied|violates/i) {
  await assert.rejects(promise, pattern);
}

async function logHike(userId, mountainId, extra = {}) {
  const h = { completed: true, completion_date: "2026-09-01", distance_km: 12, elevation_gain_m: 800, ...extra };
  return as(userId, async (tx) => {
    const r = await tx.query(
      `insert into public.user_hikes (mountain_id, completed, completion_date, distance_km, elevation_gain_m)
       values ($1, $2, $3, $4, $5) returning id, user_id`,
      [mountainId, h.completed, h.completion_date, h.distance_km, h.elevation_gain_m],
    );
    return r.rows[0];
  });
}

before(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(root, "tests", "supabase-stub.sql"), "utf8"));
  for (const sql of sqlFiles("migrations")) await db.exec(sql);
  for (const sql of sqlFiles("seed")) await db.exec(sql);

  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values
       ($1, 'alice@example.com', '{"username":"alice","display_name":"Alice"}'),
       ($2, 'bob@example.com',   '{"username":"bob"}'),
       ($3, 'carol@example.com', '{"username":"carol"}')`,
    [ALICE, BOB, CAROL],
  );
  await db.query(`update public.profiles set is_public = false where id = $1`, [CAROL]);

  const m = await db.query(`select id, slug from public.mountains`);
  tableMountain = m.rows.find((r) => r.slug === "table-mountain").id;
  sneeuberg = m.rows.find((r) => r.slug === "sneeuberg").id;
});

test("seed: 20 mountains, one final goal, 14 achievements", async () => {
  const m = await db.query(`select count(*)::int n, count(*) filter (where is_final_goal)::int f from public.mountains`);
  assert.deepEqual(m.rows[0], { n: 20, f: 1 });
  const a = await db.query(`select count(*)::int n from public.achievements`);
  assert.equal(a.rows[0].n, 14);
});

test("signup trigger creates a profile and de-duplicates usernames", async () => {
  const id = "00000000-0000-4000-8000-0000000000dd";
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'x@example.com', '{"username":"Alice!"}')`,
    [id],
  );
  const r = await db.query(`select username from public.profiles where id = $1`, [id]);
  assert.equal(r.rows[0].username, "alice1");
});

test("anon can read mountains and achievements but not write them", async () => {
  await as(null, async (tx) => {
    const r = await tx.query(`select count(*)::int n from public.mountains`);
    assert.equal(r.rows[0].n, 20);
  });
  await rejects(as(null, (tx) => tx.query(`insert into public.mountains (name, slug) values ('x', 'x')`)));
  await rejects(as(ALICE, (tx) => tx.query(`insert into public.mountains (name, slug) values ('x', 'x')`)));
  const r = await as(ALICE, (tx) => tx.query(`update public.mountains set elevation = 1 where slug = 'table-mountain'`));
  assert.equal(r.affectedRows, 0);
});

test("users log hikes only as themselves", async () => {
  const hike = await logHike(ALICE, tableMountain);
  assert.equal(hike.user_id, ALICE, "user_id defaults to auth.uid()");

  await rejects(
    as(BOB, (tx) =>
      tx.query(`insert into public.user_hikes (user_id, mountain_id, completed) values ($1, $2, true)`, [ALICE, tableMountain]),
    ),
  );
  await rejects(as(null, (tx) => tx.query(`insert into public.user_hikes (mountain_id) values ($1)`, [tableMountain])));
});

test("a user can never modify or delete another user's hike", async () => {
  const hike = await logHike(ALICE, tableMountain, { distance_km: 9 });

  const upd = await as(BOB, (tx) => tx.query(`update public.user_hikes set notes = 'hacked' where id = $1`, [hike.id]));
  assert.equal(upd.affectedRows, 0);
  const del = await as(BOB, (tx) => tx.query(`delete from public.user_hikes where id = $1`, [hike.id]));
  assert.equal(del.affectedRows, 0);

  // Alice cannot hand her hike to Bob either.
  await rejects(as(ALICE, (tx) => tx.query(`update public.user_hikes set user_id = $1 where id = $2`, [BOB, hike.id])));

  const r = await db.query(`select notes, user_id from public.user_hikes where id = $1`, [hike.id]);
  assert.deepEqual(r.rows[0], { notes: null, user_id: ALICE });

  const own = await as(ALICE, (tx) => tx.query(`delete from public.user_hikes where id = $1`, [hike.id]));
  assert.equal(own.affectedRows, 1);
});

test("hike triggers write activity and award achievements automatically", async () => {
  await logHike(BOB, tableMountain, { distance_km: 11, elevation_gain_m: 700 });
  await logHike(BOB, tableMountain, { distance_km: 8, elevation_gain_m: 400 });

  const act = await db.query(
    `select activity_type from public.activity where user_id = $1 and hike_id is not null order by created_at, activity_type`,
    [BOB],
  );
  const types = act.rows.map((r) => r.activity_type).sort();
  assert.deepEqual(types, ["hike_completed", "mountain_conquered"]);

  const ach = await db.query(
    `select a.slug from public.user_achievements ua join public.achievements a on a.id = ua.achievement_id
     where ua.user_id = $1 order by a.slug`,
    [BOB],
  );
  assert.deepEqual(ach.rows.map((r) => r.slug), ["10-km", "1k-vertical", "first-summit"]);
});

test("deleting hikes revokes achievements that are no longer met", async () => {
  const hike = await logHike(CAROL, sneeuberg, { distance_km: 25, elevation_gain_m: 1500 });
  let r = await db.query(
    `select a.slug from public.user_achievements ua join public.achievements a on a.id = ua.achievement_id where ua.user_id = $1`,
    [CAROL],
  );
  assert.ok(r.rows.some((x) => x.slug === "2k-club"));
  assert.ok(r.rows.some((x) => x.slug === "long-day"));

  await as(CAROL, (tx) => tx.query(`delete from public.user_hikes where id = $1`, [hike.id]));
  r = await db.query(`select count(*)::int n from public.user_achievements where user_id = $1`, [CAROL]);
  assert.equal(r.rows[0].n, 0);
});

test("clients cannot write activity, achievements or call internal functions", async () => {
  await rejects(as(ALICE, (tx) => tx.query(`insert into public.activity (user_id, activity_type) values ($1, 'hike_completed')`, [ALICE])));
  const ach = await db.query(`select id from public.achievements where slug = 'final-objective'`);
  await rejects(
    as(ALICE, (tx) => tx.query(`insert into public.user_achievements (user_id, achievement_id) values ($1, $2)`, [ALICE, ach.rows[0].id])),
  );
  await rejects(as(ALICE, (tx) => tx.query(`select public.sync_user_achievements($1)`, [BOB])), /permission denied/);
});

test("private profiles and their data are hidden from others", async () => {
  await logHike(CAROL, tableMountain);

  await as(BOB, async (tx) => {
    assert.equal((await tx.query(`select 1 from public.profiles where id = $1`, [CAROL])).rows.length, 0);
    assert.equal((await tx.query(`select 1 from public.user_hikes where user_id = $1`, [CAROL])).rows.length, 0);
    assert.equal((await tx.query(`select 1 from public.activity where user_id = $1`, [CAROL])).rows.length, 0);
    assert.equal((await tx.query(`select 1 from public.user_achievements where user_id = $1`, [CAROL])).rows.length, 0);
    // Public profiles are visible.
    assert.equal((await tx.query(`select 1 from public.profiles where id = $1`, [ALICE])).rows.length, 1);
    // The limited card still works so a private profile page can render.
    const card = await tx.query(`select username, is_public from public.get_profile_card('carol')`);
    assert.deepEqual(card.rows[0], { username: "carol", is_public: false });
  });

  await as(null, async (tx) => {
    assert.equal((await tx.query(`select 1 from public.user_hikes where user_id = $1`, [CAROL])).rows.length, 0);
    assert.equal((await tx.query(`select * from public.search_profiles('car')`).catch(() => ({ rows: [] }))).rows.length, 0);
  });

  await as(CAROL, async (tx) => {
    assert.ok((await tx.query(`select 1 from public.user_hikes where user_id = $1`, [CAROL])).rows.length > 0);
  });
});

test("profiles can only be updated by their owner", async () => {
  const r = await as(BOB, (tx) => tx.query(`update public.profiles set bio = 'pwned' where id = $1`, [ALICE]));
  assert.equal(r.affectedRows, 0);
  const own = await as(ALICE, (tx) => tx.query(`update public.profiles set bio = 'Chasing mountains.' where id = $1`, [ALICE]));
  assert.equal(own.affectedRows, 1);
  await rejects(as(ALICE, (tx) => tx.query(`update public.profiles set id = $1 where id = $2`, [BOB, ALICE])));
});

test("follows: only as yourself, never yourself", async () => {
  await as(ALICE, (tx) => tx.query(`insert into public.follows (following_id) values ($1)`, [BOB]));
  await rejects(as(ALICE, (tx) => tx.query(`insert into public.follows (following_id) values ($1)`, [ALICE])));
  await rejects(as(ALICE, (tx) => tx.query(`insert into public.follows (follower_id, following_id) values ($1, $2)`, [BOB, CAROL])));

  const del = await as(BOB, (tx) => tx.query(`delete from public.follows where follower_id = $1`, [ALICE]));
  assert.equal(del.affectedRows, 0, "Bob cannot remove Alice's follow");

  const card = await as(null, (tx) => tx.query(`select follower_count::int f from public.get_profile_card('bob')`));
  assert.equal(card.rows[0].f, 1);
});

test("hike photo rows: only on your own hike, only under your own path", async () => {
  const hike = await logHike(ALICE, tableMountain);
  const good = `${ALICE}/${hike.id}/a.jpg`;

  await as(ALICE, (tx) => tx.query(`insert into public.hike_photos (hike_id, storage_path) values ($1, $2)`, [hike.id, good]));
  await rejects(
    as(BOB, (tx) => tx.query(`insert into public.hike_photos (hike_id, storage_path) values ($1, $2)`, [hike.id, `${BOB}/${hike.id}/b.jpg`])),
  );
  await rejects(
    as(ALICE, (tx) => tx.query(`insert into public.hike_photos (hike_id, storage_path) values ($1, $2)`, [hike.id, `${BOB}/${hike.id}/c.jpg`])),
  );
});

test("storage: hike photos can only be uploaded into your own hikes", async () => {
  const aliceHike = await logHike(ALICE, tableMountain);
  const bobHike = await logHike(BOB, tableMountain);
  const carolHike = await logHike(CAROL, tableMountain);
  const put = (tx, name) =>
    tx.query(`insert into storage.objects (bucket_id, name) values ('hike-photos', $1)`, [name]);

  await as(ALICE, (tx) => put(tx, `${ALICE}/${aliceHike.id}/ok.jpg`));
  await rejects(as(BOB, (tx) => put(tx, `${ALICE}/${aliceHike.id}/evil.jpg`)));
  await rejects(as(ALICE, (tx) => put(tx, `${ALICE}/${bobHike.id}/evil.jpg`)));
  await rejects(as(null, (tx) => put(tx, `${ALICE}/${aliceHike.id}/anon.jpg`)));
  await as(CAROL, (tx) => put(tx, `${CAROL}/${carolHike.id}/private.jpg`));

  await as(BOB, async (tx) => {
    const pub = await tx.query(`select 1 from storage.objects where name like $1`, [`${ALICE}/%`]);
    assert.ok(pub.rows.length > 0, "public user's photos are readable");
    const priv = await tx.query(`select 1 from storage.objects where name like $1`, [`${CAROL}/%`]);
    assert.equal(priv.rows.length, 0, "private user's photos are not");
    const del = await tx.query(`delete from storage.objects where name like $1`, [`${ALICE}/%`]);
    assert.equal(del.affectedRows, 0);
  });
});

test("storage: avatars only in your own folder", async () => {
  await as(ALICE, (tx) => tx.query(`insert into storage.objects (bucket_id, name) values ('avatars', $1)`, [`${ALICE}/me.jpg`]));
  await rejects(
    as(BOB, (tx) => tx.query(`insert into storage.objects (bucket_id, name) values ('avatars', $1)`, [`${ALICE}/evil.jpg`])),
  );
});

test("ensure_profile heals accounts created before the database was set up", async () => {
  const id = "00000000-0000-4000-8000-0000000000ee";
  await db.exec(`alter table auth.users disable trigger on_auth_user_created`);
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values ($1, 'early@example.com', '{"username":"early_bird"}')`,
    [id],
  );
  await db.exec(`alter table auth.users enable trigger on_auth_user_created`);
  assert.equal((await db.query(`select 1 from public.profiles where id = $1`, [id])).rows.length, 0);

  // Anonymous callers and other users can't create it for them.
  await as(null, (tx) => tx.query(`select public.ensure_profile()`)).catch(() => {});
  await as(BOB, (tx) => tx.query(`select public.ensure_profile()`));
  assert.equal((await db.query(`select 1 from public.profiles where id = $1`, [id])).rows.length, 0);

  await as(id, (tx) => tx.query(`select public.ensure_profile()`));
  const r = await db.query(`select username from public.profiles where id = $1`, [id]);
  assert.equal(r.rows[0].username, "early_bird");
});

test("new hikers start with an empty list; the catalogue keeps the 20-mountain progression", async () => {
  const r = await db.query(`select count(*)::int n from public.user_mountains where user_id = $1`, [ALICE]);
  assert.equal(r.rows[0].n, 0);
  // Everything is still available to add, in the suggested order.
  const cat = await as(ALICE, (tx) =>
    tx.query(`select slug from public.mountains where is_starter order by sort_order limit 3`),
  );
  assert.deepEqual(cat.rows.map((x) => x.slug), ["leeukop", "paarlberg", "table-mountain"]);
  // Hikers add catalogue mountains to their own list.
  await as(ALICE, (tx) => tx.query(`insert into public.user_mountains (mountain_id, sort_order, stage) values ($1, 1, 'start')`, [tableMountain]));
  const after = await db.query(`select count(*)::int n from public.user_mountains where user_id = $1`, [ALICE]);
  assert.equal(after.rows[0].n, 1);
});

test("hikers edit only their own list", async () => {
  await as(BOB, async (tx) => {
    await tx.query(`insert into public.user_mountains (mountain_id, sort_order) values ($1, 1)`, [sneeuberg]);
    await tx.query(`insert into public.user_mountains (mountain_id, sort_order, is_final_goal) values ($1, 2, true)`, [tableMountain]);
  });
  const del = await as(BOB, (tx) => tx.query(`delete from public.user_mountains where user_id = $1`, [ALICE]));
  assert.equal(del.affectedRows, 0);
  await rejects(
    as(BOB, (tx) => tx.query(`insert into public.user_mountains (user_id, mountain_id) values ($1, $2)`, [ALICE, sneeuberg])),
  );
  const own = await as(BOB, (tx) => tx.query(`delete from public.user_mountains where user_id = $1 and mountain_id = $2`, [BOB, sneeuberg]));
  assert.equal(own.affectedRows, 1);
  await as(BOB, (tx) => tx.query(`insert into public.user_mountains (mountain_id, sort_order) values ($1, 99)`, [sneeuberg]));
  // Only one final objective per hiker.
  await rejects(
    as(BOB, (tx) => tx.query(`update public.user_mountains set is_final_goal = true where user_id = $1 and mountain_id = $2`, [BOB, sneeuberg])),
    /duplicate key|unique/i,
  );
});

test("catalogue: hikers add mountains as themselves and can't touch the starter list", async () => {
  const m = await as(ALICE, (tx) =>
    tx.query(
      `insert into public.mountains (name, slug, created_by, is_starter, is_final_goal, sort_order)
       values ('Lion''s Head', 'lions-head', $1, true, true, 1) returning *`,
      [BOB],
    ),
  );
  const row = m.rows[0];
  assert.equal(row.created_by, ALICE, "created_by forced to the caller");
  assert.equal(row.is_starter, false);
  assert.equal(row.is_final_goal, false);

  // Bob can't edit Alice's mountain; nobody can edit a seeded one through the API.
  assert.equal((await as(BOB, (tx) => tx.query(`update public.mountains set name = 'x' where id = $1`, [row.id]))).affectedRows, 0);
  assert.equal((await as(ALICE, (tx) => tx.query(`update public.mountains set name = 'x' where id = $1`, [tableMountain]))).affectedRows, 0);

  // Alice can edit hers, but can't flip it into the starter list.
  await as(ALICE, (tx) => tx.query(`update public.mountains set elevation = 669, is_starter = true where id = $1`, [row.id]));
  const after = await db.query(`select elevation, is_starter from public.mountains where id = $1`, [row.id]);
  assert.deepEqual(after.rows[0], { elevation: 669, is_starter: false });

  // Once Bob lists it, Alice can no longer delete it.
  await as(BOB, (tx) => tx.query(`insert into public.user_mountains (mountain_id) values ($1)`, [row.id]));
  assert.equal((await as(ALICE, (tx) => tx.query(`delete from public.mountains where id = $1`, [row.id]))).affectedRows, 0);
  await as(BOB, (tx) => tx.query(`delete from public.user_mountains where mountain_id = $1`, [row.id]));
  assert.equal((await as(ALICE, (tx) => tx.query(`delete from public.mountains where id = $1`, [row.id]))).affectedRows, 1);
});

test("set_mountain_image: creator, or anyone when there's no cover; only own storage folder", async () => {
  const base = "https://x.supabase.co/storage/v1/object/public/mountain-images";
  const { rows } = await as(ALICE, (tx) =>
    tx.query(`insert into public.mountains (name, slug) values ('Kasteelberg', 'kasteelberg') returning id`),
  );
  const id = rows[0].id;
  const set = (uid, url) => as(uid, (tx) => tx.query(`select public.set_mountain_image($1, $2) ok`, [id, url]));

  assert.equal((await set(BOB, `${base}/${ALICE}/a.jpg`)).rows[0].ok, false, "not Bob's folder");
  assert.equal((await set(BOB, `${base}/${BOB}/b.jpg`)).rows[0].ok, true, "no cover yet → anyone");
  assert.equal((await set(BOB, `${base}/${BOB}/c.jpg`)).rows[0].ok, false, "cover exists → only creator");
  assert.equal((await set(ALICE, `${base}/${ALICE}/d.jpg`)).rows[0].ok, true, "creator can replace");
  assert.equal((await set(ALICE, `https://evil.example/${ALICE}/e.jpg`)).rows[0].ok, false);
  // Seeded mountains already have covers, so nobody can replace them.
  const seeded = await as(BOB, (tx) => tx.query(`select public.set_mountain_image($1, $2) ok`, [tableMountain, `${base}/${BOB}/f.jpg`]));
  assert.equal(seeded.rows[0].ok, false);
});

test("Final Objective follows each hiker's own final goal", async () => {
  const id = "00000000-0000-4000-8000-0000000000f1";
  await db.query(`insert into auth.users (id, email, raw_user_meta_data) values ($1, 'f@example.com', '{"username":"finaltest"}')`, [id]);
  // Add Table Mountain as their final objective, then summit it.
  await as(id, (tx) => tx.query(`insert into public.user_mountains (mountain_id, is_final_goal) values ($1, true)`, [tableMountain]));
  await logHike(id, tableMountain);
  const earned = async () =>
    (await db.query(
      `select 1 from public.user_achievements ua join public.achievements a on a.id = ua.achievement_id
       where ua.user_id = $1 and a.slug = 'final-objective'`,
      [id],
    )).rows.length;
  assert.equal(await earned(), 1);
  // Unsetting the final goal revokes it.
  await as(id, (tx) => tx.query(`update public.user_mountains set is_final_goal = false where user_id = $1`, [id]));
  assert.equal(await earned(), 0);
});

test("stages: catalogue carries the suggested stages; list stages are validated and protected", async () => {
  const r = await db.query(
    `select slug, starter_stage from public.mountains
     where slug in ('leeukop', 'saaltjie', 'virgin-peak', 'sneeukop', 'towerkop') order by sort_order`,
  );
  assert.deepEqual(
    r.rows.map((x) => `${x.slug}:${x.starter_stage}`),
    ["leeukop:start", "saaltjie:build", "virgin-peak:advanced", "sneeukop:high", "towerkop:extreme"],
  );
  // Only the five stage keys are allowed on a list entry.
  await rejects(
    as(ALICE, (tx) => tx.query(`update public.user_mountains set stage = 'expert' where user_id = $1`, [ALICE])),
    /check constraint|violates/i,
  );
  // Hikers can move their own mountains between stages…
  const moved = await as(ALICE, (tx) =>
    tx.query(`update public.user_mountains set stage = 'build' where user_id = $1 and mountain_id = $2`, [ALICE, tableMountain]),
  );
  assert.equal(moved.affectedRows, 1);
  // …but not change a catalogue mountain's starter stage.
  const { rows } = await as(BOB, (tx) =>
    tx.query(`insert into public.mountains (name, slug, starter_stage) values ('Kanonkop', 'kanonkop', 'extreme') returning starter_stage`),
  );
  assert.equal(rows[0].starter_stage, null);
});

test("profile banners: only you can set yours", async () => {
  const url = "https://x.supabase.co/storage/v1/object/public/avatars/" + BOB + "/banner-x.jpg";
  const r = await as(BOB, (tx) => tx.query(`update public.profiles set banner_url = $1 where id = $2`, [url, ALICE]));
  assert.equal(r.affectedRows, 0);
  const own = await as(BOB, (tx) => tx.query(`update public.profiles set banner_url = $1 where id = $2`, [url, BOB]));
  assert.equal(own.affectedRows, 1);
  // Banner files go in your own avatars folder only.
  await rejects(
    as(BOB, (tx) => tx.query(`insert into storage.objects (bucket_id, name) values ('avatars', $1)`, [`${ALICE}/banner-evil.jpg`])),
  );
});

test("coordinates: every seeded mountain has coordinates + accuracy; conflicting names are flagged", async () => {
  const r = await db.query(
    `select slug, latitude, longitude, coordinate_accuracy, verification_note, google_maps_url
     from public.mountains where is_starter order by sort_order`,
  );
  assert.equal(r.rows.length, 20);
  for (const m of r.rows) {
    assert.ok(m.latitude != null && m.longitude != null, `${m.slug} has coordinates`);
    assert.ok(["verified", "approximate"].includes(m.coordinate_accuracy), `${m.slug} has an accuracy`);
    assert.ok(
      m.google_maps_url.endsWith(`query=${Number(m.latitude)},${Number(m.longitude)}`) ||
        m.google_maps_url.endsWith(`query=${m.latitude},${m.longitude}`),
      `${m.slug} maps link opens at its coordinates`,
    );
  }
  const flagged = r.rows.filter((m) => m.verification_note).map((m) => m.slug).sort();
  assert.deepEqual(flagged, ["guardian-peak", "sterrekykerskop"]);
  // The accuracy field only accepts the two values.
  await rejects(
    db.transaction(async (tx) => {
      await tx.query(`select set_config('request.jwt.claims', '{}', true)`);
      await tx.query(`update public.mountains set coordinate_accuracy = 'exact' where slug = 'leeukop'`);
    }),
    /check constraint|violates/i,
  );
});
