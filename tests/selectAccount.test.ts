import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function selectAccountTest(client: WrapDirecte) {
  console.log('--- Testing Select Account ---');
  if (client.accounts.length < 2) {
    console.log('Only one account available, skipping selectAccount test.');
    return;
  }

  const accountId = client.accounts[1].id; // Select second account if available
  const selected = await client.selectAccount(accountId);
  console.log('Selected account:', selected.firstName, selected.lastName);

  writeFileSync('result/selectAccount.json', JSON.stringify(selected, null, 2));
  console.log('Selected account written to result/selectAccount.json');
}