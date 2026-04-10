import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function settingsTest(client: WrapDirecte) {
  console.log('--- Testing Settings ---');
  await client.settings?.updateIndividualParam('1');
  console.log('updateIndividualParam set to 1.');

  const data = {};
  writeFileSync('result/settings.json', JSON.stringify(data, null, 2));
  console.log('Settings data written to result/settings.json');
}