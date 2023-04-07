import { Readable } from 'stream';
import { Client, MessageEvent } from '@line/bot-sdk';
import { S3 } from 'aws-sdk';
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import { inject, injectable } from 'inversify';
import TelegramBot from 'node-telegram-bot-api';

/**
 * Service class for chat
 */
@injectable()
export class ChatService {
  @inject(Client)
  private readonly client!: Client;

  @inject(S3)
  private readonly s3!: S3;

  public async receiveTextMessage(event: MessageEvent) {
    const tokenDiscord = String(process.env.TOKEN_DISCORD);
    const tokenTelegram = String(process.env.TOKEN_TELEGRAM);

    const srcLineGroupId = String(process.env.SRC_LINE_GROUP_ID);
    const srcLineUserId = String(process.env.SRC_LINE_USER_ID);

    const dstLineGroupId = String(process.env.DST_LINE_GROUP_ID);
    const dstDiscordChannelId = String(process.env.DST_DISCORD_CHANNEL_ID);
    const dstTelegramChatId = String(process.env.DST_TELEGRAM_CHAT_ID);

    if (
      event.source.userId !== srcLineUserId ||
      event.source.type !== 'group' ||
      event.source.groupId !== srcLineGroupId
    )
      return;

    if (event.message.type === 'text') {
      // discord
      for (const discordChannelId of dstDiscordChannelId.split(','))
        await axios.request({
          method: 'post',
          url: `https://discord.com/api/channels/${discordChannelId}/messages`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${tokenDiscord}`,
          },
          data: {
            content: event.message.text,
          },
        });

      // telegram
      const bot = new TelegramBot(tokenTelegram, { polling: true });
      for (const telegramChatId of dstTelegramChatId.split(','))
        await bot.sendMessage(telegramChatId, event.message.text);

      // line
      for (const lineGroupId of dstLineGroupId.split(','))
        await this.client.pushMessage(lineGroupId, [
          {
            type: 'text',
            text: event.message.text,
          },
        ]);
    } else if (event.message.type === 'image') {
      // save image
      const bucket = `${process.env.PROJECT}-${process.env.ENVR}`;
      const contentStream: Readable = await this.client.getMessageContent(
        event.message.id
      );
      const chunks = [];
      for await (const chunk of contentStream) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);

      const fileType = await fileTypeFromBuffer(buffer);
      const filename = `${event.message.id}.${fileType?.ext}`;
      const readableStream = new Readable({
        read() {
          this.push(buffer);
          this.push(null);
        },
      });

      await this.s3
        .upload({
          Body: readableStream,
          Bucket: bucket,
          Key: filename,
        })
        .promise();

      const url = this.s3.getSignedUrl('getObject', {
        Bucket: bucket,
        Key: filename,
        Expires: 86400,
      });

      // discord
      for (const discordChannelId of dstDiscordChannelId.split(','))
        await axios.request({
          method: 'post',
          url: `https://discord.com/api/channels/${discordChannelId}/messages`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bot ${tokenDiscord}`,
          },
          data: {
            embeds: [
              {
                image: {
                  url,
                },
              },
            ],
          },
        });

      // telegram
      const bot = new TelegramBot(tokenTelegram, { polling: true });
      for (const telegramChatId of dstTelegramChatId.split(','))
        await bot.sendPhoto(telegramChatId, url);

      // line
      for (const lineGroupId of dstLineGroupId.split(','))
        await this.client.pushMessage(lineGroupId, [
          {
            type: 'image',
            originalContentUrl: url,
            previewImageUrl: url,
          },
        ]);
    }
  }
}
