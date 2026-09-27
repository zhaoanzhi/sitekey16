import {readFileSync} from 'node:fs';
import {webcrypto, createHash} from 'node:crypto';
import {runInNewContext, Script} from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const source = html.match(/<script id="sitekey16-core">([\s\S]*?)<\/script>/)[1];
const sandbox = {crypto: webcrypto, TextEncoder, Uint8Array};
runInNewContext(source, sandbox);
const api = sandbox.SiteKey16;
assert.equal(await api.selfTest(), 4);
for (const [i, vector] of api.vectors.entries()) {
  const actual = await api.derive(vector[0], vector[1]);
  assert.equal(actual.normalizedSite, vector[2]); assert.equal(actual.sha256, vector[3]); assert.equal(actual.password, vector[4]);
  console.log(`PASS official vector ${i + 1}: normalization, SHA-256 and all 16 characters`);
}
const normalization = [
  ['Google.com','google.com'], [' Steam ', 'steam'], ['https://www.google.com/path/', 'google.com'],
  ['HTTPS://WWW.Example.COM.../a?b#c', 'example.com'], ['www2.Example.com:8443/', 'www2.example.com:8443'],
  ['sub.example.co.uk', 'sub.example.co.uk'], ['https://例子.中国/', '例子.中国'],
  ['www.www.example.com', 'www.example.com'], ['ftp://EXAMPLE.com/a', 'ftp:'],
  ['\uFEFF Steam \u00A0', 'steam'], ['https://www.Example.com?...', 'example.com'],
  ['İ.Example', 'i\u0307.example'], ['...', ''], ['', '']
];
for (const [input, expected] of normalization) assert.equal(api.normalizeSite(input), expected);
// Independent digest reference: literal backslash + ASCII zero, not U+0000.
for (const master of ['', ' leading ', 'é', 'e\u0301', '密码🔐', 'A\u0000B', '\ud800', 'line\nbreak']) {
  const actual = await api.derive(master, 'Example.COM');
  const input = ['sitekey16:v1', 'example.com', master].join(String.fromCharCode(92,48));
  assert.equal(actual.sha256, createHash('sha256').update(input, 'utf8').digest('hex'));
  assert.equal(actual.password.length, 16);
  for (const pattern of [/[ABCDEFGHJKLMNPQRSTUVWXYZ]/, /[abcdefghijkmnopqrstuvwxyz]/, /[23456789]/, /[!@#$%^&*_+\-=]/]) assert.match(actual.password, pattern);
}
assert.notEqual((await api.derive(' abc ', 'google.com')).password, (await api.derive('abc', 'google.com')).password);
assert.notEqual((await api.derive('é', 'google.com')).password, (await api.derive('e\u0301', 'google.com')).password);
const nulDigest = createHash('sha256').update('sitekey16:v1\0google.com\0MasterPass!Long123').digest('hex');
assert.notEqual(nulDigest, api.vectors[0][3]);
for (const [, script] of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) new Script(script);
assert.match(html, /connect-src 'none'/);
assert.doesNotMatch(html, /\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest)\b|document\.cookie|console\./);
assert.doesNotMatch(html, /<script[^>]*\bsrc=|<link[^>]*\bhref=/);
console.log(`PASS ${normalization.length} normalization edge cases, UTF-8 / separator / whitespace checks and static privacy checks`);
