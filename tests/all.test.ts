import 'dotenv/config';
import { loginTest } from './login.test';
import { timetableTest } from './timetable.test';
import { absencesTest } from './absences.test';
import { timelineTest } from './timeline.test';
import { documentsTest } from './documents.test';
import { cloudTest } from './cloud.test';
import { settingsTest } from './settings.test';
import { gradesTest } from './grades.test';
import { messagingTest } from './messaging.test';

async function run() {
  const client = await loginTest();

  // Uncomment the tests you want to run
  // await reloginTest(client);
  // await selectAccountTest(client);
  // await homeworkTest(client);
  await gradesTest(client);
  await messagingTest(client);
  await timetableTest(client);
  await absencesTest(client);
  await timelineTest(client);
  await documentsTest(client);
  await cloudTest(client);
  await settingsTest(client);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});