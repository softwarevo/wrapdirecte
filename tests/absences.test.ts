import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function absencesTest(client: WrapDirecte) {
  console.log('--- Testing Absences ---');
  const absences = await client.absences?.getAbsences();
  console.log('Absences fetched:', absences?.length, 'entries');

  if (absences) {
    writeFileSync('result/absences.json', JSON.stringify(absences, null, 2));
    console.log('Absences written to result/absences.json');
  }
}