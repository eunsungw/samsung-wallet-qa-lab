import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('dist', { recursive: true });
copyFileSync('index.html', 'dist/index.html');
copyFileSync('cloud.html', 'dist/cloud.html');
copyFileSync('src/style.css', 'dist/style.css');
// Only a Supabase publishable key (safe for browsers) is embedded for this sandbox.
// Override with SUPABASE_* variables to use a different project. NEVER embed a service-role/secret key.
const config = {
  url: process.env.SUPABASE_URL || 'https://mvypyjjfqjiuolluyhmj.supabase.co',
  publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oT75MyPyDbcKT510IfokeA_wjZ44Ogv'
};
writeFileSync('dist/cloud-config.js', `window.WALLET_QA_CLOUD = ${JSON.stringify(config).replace(/</g, '\\u003c')};\n`);
