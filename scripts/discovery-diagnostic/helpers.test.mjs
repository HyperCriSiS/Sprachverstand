import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeUrl,scoreLink,parseRobots,robotsAllows} from './helpers.mjs';
test('Only real HTTPS links within the same registrable domain are eligible',()=>{
 assert.equal(normalizeUrl('/news/a#text','https://www.example.de/','example.de'),'https://www.example.de/news/a');
 assert.equal(normalizeUrl('https://jobs.example.de/team','https://example.de/','example.de'),'https://jobs.example.de/team');
 for(const s of ['http://example.de/a','https://other.de/news','javascript:alert(1)','https://example.de/login','https://example.de/search','https://example.de/file.pdf','https://user:pass@example.de/a','https://example.de/a?search=x'])assert.equal(normalizeUrl(s,'https://example.de/','example.de'),null,s);
 assert.equal(normalizeUrl('/news/a?utm_source=x&id=42','https://example.de/','example.de'),'https://example.de/news/a?id=42');
});
test('Content pages rank above legal/cookie pages and invalid escapes cannot crash discovery',()=>{
 assert.ok(scoreLink({url:'https://example.de/team',text:'Team'})>0);
 assert.ok(scoreLink({url:'https://example.de/privacy',text:'Datenschutz'})<0);
 assert.doesNotThrow(()=>scoreLink({url:'https://example.de/news/%broken'}));
});
test('Robots longest match, Allow ties, wildcard and terminal anchor',()=>{
 const r=parseRobots('User-agent: *\nDisallow: /private\nAllow: /private/public\nDisallow: /*.pdf$\nCrawl-delay: 3');
 assert.equal(robotsAllows(r,'https://example.de/private/a'),false);
 assert.equal(robotsAllows(r,'https://example.de/private/public/a'),true);
 assert.equal(robotsAllows(r,'https://example.de/a.pdf'),false);
 assert.equal(robotsAllows(r,'https://example.de/a.pdf/news'),true);
 assert.equal(r.delay,3);
 const t=parseRobots('User-agent: *\nDisallow: /x\nAllow: /x');assert.equal(robotsAllows(t,'https://example.de/x'),true);
});
test('Other agents do not block us; named group overrides wildcard; empty disallow allows',()=>{
 assert.equal(robotsAllows(parseRobots('User-agent: OtherBot\nDisallow: /'),'https://example.de/'),true);
 const r=parseRobots('User-agent: *\nDisallow: /\nUser-agent: SprachverstandResearch\nAllow: /news');
 assert.equal(robotsAllows(r,'https://example.de/news'),true);
 assert.equal(robotsAllows(parseRobots('User-agent: *\nDisallow:'),'https://example.de/a'),true);
});
