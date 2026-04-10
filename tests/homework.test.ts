import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function homeworkTest(client: WrapDirecte) {
  console.log('--- Testing Homework ---');
  const homework = await client.homework?.getHomework('2026-04-08');
  console.log('Homework fetched:', homework?.length, 'items');

  if (homework) {
    writeFileSync('result/homework.json', JSON.stringify(homework, null, 2));
    console.log('Homework written to result/homework.json');
  }

  if (homework && homework.length > 0) {
    // Test mark as done if there's homework
    const firstHomework = homework[0];
    await client.homework?.markAsDone(firstHomework.id, false); // Mark as not done first
    console.log('Marked homework as not done.');

    await client.homework?.markAsDone(firstHomework.id, true); // Then as done
    console.log('Marked homework as done.');

    // Test add comment
    const commentId = await client.homework?.addComment(firstHomework.id, 'Test comment from wrapdirecte');
    console.log('Added comment with ID:', commentId);
  }
}