import { WrapDirecte } from './src/index';

async function exampleUsage() {
  const client = new WrapDirecte();

  try {
    // Login (this will require real credentials and may need 2FA)
    const loginResult = await client.login('USERNAME', 'PASSWORD');

    if (loginResult.status === '2FA_REQUIRED') {
      console.log('2FA Required:', loginResult.challenge?.question);
      console.log('Proposals:', loginResult.challenge?.proposals);
      // In a real scenario, get user input for answer
      // const answer = '...';
      // await client.submit2FA(answer);
      console.log('Skipping 2FA for demo purposes');
      return;
    }

    // Get account info
    const account = client.getAccount();
    console.log('Logged in as:', account?.firstName, account?.lastName);

    // Example: Get homework for a date
    if (client.homework) {
      const homework = await client.homework.getHomework('2026-04-08');
      console.log('Homework:', homework);
    }

    // Example: Get grades
    if (client.grades) {
      const { grades, periods } = await client.grades.getGrades('2025-2026');
      console.log('Grades:', grades.length, 'items');
      console.log('Periods:', periods.length, 'periods');
    }

    // Example: Get timetable
    if (client.timetable) {
      const timetable = await client.timetable.getTimetable('2026-04-01', '2026-04-07');
      console.log('Timetable:', timetable.length, 'courses');
    }

    // Example: Get absences
    if (client.absences) {
      const absences = await client.absences.getAbsences();
      console.log('Absences:', absences.length, 'items');
    }

    // Logout
    await client.logout();
    console.log('Logged out');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
exampleUsage();