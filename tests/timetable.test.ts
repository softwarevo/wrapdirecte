import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function timetableTest(client: WrapDirecte) {
  console.log('--- Testing Timetable ---');
  const timetable = await client.timetable?.getTimetable('2026-04-06', '2026-04-12');
  console.log('Timetable fetched:', timetable?.length, 'entries');

  if (timetable) {
    writeFileSync('result/timetable.json', JSON.stringify(timetable, null, 2));
    console.log('Timetable written to result/timetable.json');
  }
}