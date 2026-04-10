import 'dotenv/config';
import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function reloginTest(client: WrapDirecte) {
  const username = process.env.ED_USERNAME;
  const password = process.env.ED_PASSWORD;

  if (!username || !password) {
    throw new Error('Please set ED_USERNAME and ED_PASSWORD in your .env file. Do not rely on the Windows USERNAME env var.');
  }

  console.log('--- Testing Relogin ---');
  const reloginResult = await client.relogin(username, password, 'some-uuid');

  console.log('Relogin result:', reloginResult.status);
  if (reloginResult.status === 'SUCCESS') {
    console.log('Token renewed successfully.');
  } else {
    throw new Error('Relogin failed.');
  }

  writeFileSync('result/relogin.json', JSON.stringify(reloginResult, null, 2));
  console.log('Relogin result written to result/relogin.json');
}