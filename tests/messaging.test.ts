import { WrapDirecte } from '../src/index';
import { writeFileSync } from 'fs';

export async function messagingTest(client: WrapDirecte) {
  console.log('--- Testing Messaging ---');
  const messagesResult = await client.messaging?.getMessages('2025-2026');
  console.log('Messages fetched:', Object.keys(messagesResult?.messages || {}).length, 'types');
  console.log('Folders fetched:', messagesResult?.folders?.length, 'folders');

  const folderMessages = await client.messaging?.getMessagesByFolder(0);
  console.log('Folder messages fetched:', folderMessages?.length, 'messages');

  const data = {
    messagesResult,
    folderMessages
  };

  writeFileSync('result/messaging.json', JSON.stringify(data, null, 2));
  console.log('Messaging data written to result/messaging.json');
}