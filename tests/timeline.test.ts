import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function timelineTest(client: WrapDirecte) {
  console.log('--- Testing Timeline ---');
  const timeline = await client.timeline?.getStudentTimeline();
  console.log('Timeline fetched:', timeline?.length, 'entries');

  if (timeline) {
    writeFileSync('result/timeline.json', JSON.stringify(timeline, null, 2));
    console.log('Timeline written to result/timeline.json');
  }
}