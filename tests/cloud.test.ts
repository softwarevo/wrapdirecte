import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function cloudTest(client: WrapDirecte) {
  console.log('--- Testing Cloud ---');
  const cloud = await client.cloud?.getCloudFiles();
  console.log('Cloud files fetched:', cloud?.length, 'entries');

  if (cloud) {
    writeFileSync('result/cloud.json', JSON.stringify(cloud, null, 2));
    console.log('Cloud data written to result/cloud.json');
  }
}