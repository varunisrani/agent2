import express from 'express';
import logger from '../utils/logger';
import db from '../db/index';
import { eq } from 'drizzle-orm';
import { chats, messages } from '../db/schema';

const router = express.Router();

router.get('/', async (_, res) => {
  try {
    let chats = await db.query.chats.findMany();
    chats = chats.reverse();
    return res.status(200).json({ chats: chats });
  } catch (err) {
    logger.error(`Error in getting chats: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const chatExists = await db.query.chats.findFirst({
      where: eq(chats.id, req.params.id),
    });

    if (!chatExists) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, req.params.id),
    });

    return res.status(200).json({ chat: chatExists, messages: chatMessages });
  } catch (err) {
    logger.error(`Error in getting chat: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

router.delete(`/:id`, async (req, res) => {
  try {
    const chatExists = await db.query.chats.findFirst({
      where: eq(chats.id, req.params.id),
    });

    if (!chatExists) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    await db.delete(chats).where(eq(chats.id, req.params.id)).execute();
    await db
      .delete(messages)
      .where(eq(messages.chatId, req.params.id))
      .execute();

    return res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (err) {
    logger.error(`Error in deleting chat: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

router.post('/', async (req, res) => {
  try {
    const chatId = await db
      .insert(chats)
      .values({
        id: req.body.chatId,
        title: req.body.title,
        createdAt: new Date().toISOString(),
        focusMode: req.body.focusMode ?? 'default',
        files: req.body.files ?? [],
      })
      .execute();

    return res.status(201).json({ chatId });
  } catch (err) {
    logger.error(`Error in creating chat: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

export default router;
