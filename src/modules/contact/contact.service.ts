import TelegramBot from 'node-telegram-bot-api';
import { Contact } from './contact.model';
import { CreateContactDto } from './contact.types';
import { settingsService } from '../settings/settings.service';

let bot: TelegramBot | null = null;
let cachedToken: string | null = null;

function getTelegramBot(token: string): TelegramBot {
  if (!bot || cachedToken !== token) {
    bot = new TelegramBot(token);
    cachedToken = token;
  }
  return bot;
}

async function sendTelegramNotification(contact: Contact): Promise<void> {
  const config = await settingsService.getActiveTelegram();
  if (!config) {
    console.warn('[Contact] Telegram not configured or disabled, skipping notification');
    return;
  }

  const message = [
    `📬 *New Contact Message*`,
    ``,
    `*From:* ${contact.name} (${contact.email})`,
    contact.subject ? `*Subject:* ${contact.subject}` : '',
    ``,
    `*Message:*`,
    contact.message,
    ``,
    `_Received at ${new Date(contact.createdAt).toLocaleString('vi-VN')}_`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  await getTelegramBot(config.botToken).sendMessage(config.chatId, message, {
    parse_mode: 'Markdown',
  });
}

export const contactService = {
  async create(dto: CreateContactDto): Promise<Contact> {
    const contact = await Contact.create(dto);

    sendTelegramNotification(contact).catch((err) =>
      console.error('[Contact] Telegram notification failed:', err)
    );

    return contact;
  },

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Contact.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    return { rows, total: count, page, limit };
  },

  async markRead(id: number): Promise<void> {
    await Contact.update({ isRead: true }, { where: { id } });
  },

  async delete(id: number): Promise<void> {
    await Contact.destroy({ where: { id } });
  },
};
