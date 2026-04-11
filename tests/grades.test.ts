import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function gradesTest(client: WrapDirecte) {
  console.log('--- Testing Grades ---');
  const grades = await client.grades?.getGrades();
  console.log(
    'Grades fetched:',
    grades?.grades.length,
    'grades,',
    grades?.periods.length,
    'periods,',
    grades?.competencies?.length ?? 0,
    'competencies'
  );

  if (grades) {
    writeFileSync('result/grades.json', JSON.stringify(grades, null, 2));
    console.log('Grades written to result/grades.json');
  }
}