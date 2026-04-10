import 'dotenv/config';
import { WrapDirecte } from '../src/index';
import * as readline from 'readline';
import { writeFileSync } from 'fs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

export async function loginTest() {
  const client = new WrapDirecte();
  const username = process.env.ED_USERNAME;
  const password = process.env.ED_PASSWORD;

  if (!username || !password) {
    throw new Error('Please set ED_USERNAME and ED_PASSWORD in your .env file. Do not rely on the Windows USERNAME env var.');
  }

  console.log('--- Testing Login ---');
  const loginResult = await client.login(username, password);

  if (loginResult.status === '2FA_REQUIRED') {
    console.log('2FA required:', loginResult.challenge?.question);
    console.log('Proposals:', loginResult.challenge?.proposals);

    const answer = await question('Please enter the answer: ');
    await client.submit2FA(answer);
    console.log('2FA submitted.');
  } else {
    console.log('Connected successfully!');
  }

  const account = client.getAccount();
  if (!account) {
    throw new Error('No student account found.');
  }

  console.log(`Welcome ${account.firstName} ${account.lastName}`);
  console.log('Available accounts:', client.accounts.map(a => `${a.id} - ${a.firstName} ${a.lastName}`));
  console.log('Authenticated:', client.isAuthenticated);

  const data = {
    accounts: client.accounts,
    currentAccount: account,
    authenticated: client.isAuthenticated
  };

  writeFileSync('result/login.json', JSON.stringify(data, null, 2));
  console.log('Login data written to result/login.json');

  rl.close();
  return client;
}