import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function documentsTest(client: WrapDirecte) {
  console.log('--- Testing Documents ---');
  const documents = await client.documents?.getDocuments();
  console.log('Documents fetched:', documents?.length, 'entries');

  if (documents) {
    writeFileSync('result/documents.json', JSON.stringify(documents, null, 2));
    console.log('Documents written to result/documents.json');
  }
}