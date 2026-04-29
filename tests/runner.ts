import 'dotenv/config';
import { loginTest } from './login.test';
import { selectAccountTest } from './selectAccount.test';
import { homeworkTest } from './homework.test';
import { gradesTest } from './grades.test';
import { messagingTest } from './messaging.test';
import { timetableTest } from './timetable.test';
import { absencesTest } from './absences.test';
import { timelineTest } from './timeline.test';
import { documentsTest } from './documents.test';
import { cloudTest } from './cloud.test';
import { settingsTest } from './settings.test';

const availableTests: Record<string, (client?: any) => Promise<void>> = {
  login: async () => { await loginTest(); },
  selectAccount: async () => { const client = await loginTest(); await selectAccountTest(client); },
  homework: async () => { const client = await loginTest(); await homeworkTest(client); },
  grades: async () => { const client = await loginTest(); await gradesTest(client); },
  messaging: async () => { const client = await loginTest(); await messagingTest(client); },
  timetable: async () => { const client = await loginTest(); await timetableTest(client); },
  absences: async () => { const client = await loginTest(); await absencesTest(client); },
  timeline: async () => { const client = await loginTest(); await timelineTest(client); },
  documents: async () => { const client = await loginTest(); await documentsTest(client); },
  cloud: async () => { const client = await loginTest(); await cloudTest(client); },
  settings: async () => { const client = await loginTest(); await settingsTest(client); },
};

async function run() {
  const testName = process.argv[2];

  if (!testName || !availableTests[testName]) {
    console.error('Usage: ts-node tests/runner.ts <test-name>');
    console.error('Available tests:', Object.keys(availableTests).join(', '));
    process.exit(1);
  }

  await availableTests[testName]();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});