import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
const port=process.env.PORT||'3010';
let validOrigin=false;
try {const u=new URL(process.env.APP_URL||`http://localhost:${port}`);validOrigin=['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&u.pathname==='/'&&!u.search&&!u.hash;}catch{}
const production=process.env.NODE_ENV==='production';
const checks=[
 ['Node.js 24+',Number(process.versions.node.split('.')[0])>=24],
 ['App origin valid',validOrigin],
 ['Persistent encryption key',/^[a-f0-9]{64}$/i.test(process.env.TOKEN_KEY||'')],
 ['Frontend production bundle',existsSync('dist/index.html')],
 ['Twitch client ID configured',!!process.env.TWITCH_CLIENT_ID?.trim()],
 ['Twitch client secret configured',!!process.env.TWITCH_CLIENT_SECRET?.trim()],
 ['OpenAI key configured',!!process.env.OPENAI_API_KEY?.trim()],
 ['Model interpretation enabled',process.env.ENABLE_MODEL==='1'&&!!process.env.OPENAI_API_KEY],
];
console.log('Mythweave setup check — credential values are never printed.');
for(const [name,ok]of checks)console.log(`${ok?'YES':'NO '}  ${name}`);
console.log('Twitch credentials are optional for Demo mode. Live connectivity still requires an authorized channel test.');
if(production&&(!process.env.APP_URL?.startsWith('https://')||!checks[2][1])){console.log('Production requires an HTTPS APP_URL and a persistent TOKEN_KEY.');process.exitCode=1;}
if(!checks[0][1]||!validOrigin)process.exitCode=1;
