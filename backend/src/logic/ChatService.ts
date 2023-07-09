import { Readable } from 'stream';
import { Client, MessageEvent } from '@line/bot-sdk';
import { S3 } from 'aws-sdk';
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import { inject, injectable } from 'inversify';
import TelegramBot, { Update } from 'node-telegram-bot-api';
import { v4 as uuidv4 } from 'uuid';
import { Config } from 'src/model/Config';

/**
 * Service class for broadcast
 */
@injectable()
export class ChatService {
  @inject(Client)
  private readonly client!: Client;

  @inject(TelegramBot)
  private readonly telegramBot!: TelegramBot;

  @inject(S3)
  private readonly s3!: S3;

  private async sendTextToDiscord(channelIds: string[], text: string) {
    const tokenDiscord = String(process.env.TOKEN_DISCORD);
    for (const channelId of channelIds)
      await axios.request({
        method: 'post',
        url: `https://discord.com/api/channels/${channelId}/messages`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${tokenDiscord}`,
        },
        data: {
          content: text,
        },
      });
  }

  private async sendImageToDiscord(channelIds: string[], url: string) {
    const tokenDiscord = String(process.env.TOKEN_DISCORD);
    for (const channelId of channelIds)
      await axios.request({
        method: 'post',
        url: `https://discord.com/api/channels/${channelId}/messages`,
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
  }

  private async sendTextToTelegram(
    chats: {
      id: number;
      threadId?: number;
    }[],
    text: string
  ) {
    for (const chat of chats)
      await this.telegramBot.sendMessage(chat.id, text, {
        message_thread_id: chat.threadId,
      });
  }

  private async sendImageToTelegram(
    chats: {
      id: number;
      threadId?: number;
    }[],
    url: string
  ) {
    for (const chat of chats)
      await this.telegramBot.sendPhoto(chat.id, url, {
        message_thread_id: chat.threadId,
      });
  }

  private async sendTextToLine(groupIds: string[], text: string[]) {
    for (const groupId of groupIds)
      await this.client.pushMessage(
        groupId,
        text.map((v) => ({
          type: 'text',
          text: v,
        }))
      );
  }

  private async sendImageToLine(
    groupIds: string[],
    url: string,
    text?: string
  ) {
    for (const groupId of groupIds)
      await this.client.pushMessage(
        groupId,
        text
          ? [
              { type: 'text', text },
              {
                type: 'image',
                originalContentUrl: url,
                previewImageUrl: url,
              },
            ]
          : {
              type: 'image',
              originalContentUrl: url,
              previewImageUrl: url,
            }
      );
  }

  private async getUrlByStream(stream: Readable) {
    const bucket = `${process.env.PROJECT}-${process.env.ENVR}`;
    const id = uuidv4();
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const fileType = await fileTypeFromBuffer(buffer);
    const filename = `${id}.${fileType?.ext}`;
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

    return this.s3.getSignedUrl('getObject', {
      Bucket: bucket,
      Key: filename,
      Expires: 86400,
    });
  }

  public async receiveTelegramUpdate(update: Update) {
    const configs = JSON.parse(String(process.env.CONFIGURATION)) as Config[];

    const user = `${update.message?.from?.first_name} ${update.message?.from?.last_name}`;
    const chatId = update.message?.chat.id;
    const threadId = update.message?.reply_to_message?.message_thread_id;
    const text = update.message?.text;
    const fileId = update.message?.photo
      ? update.message?.photo[update.message.photo.length - 1].file_id
      : undefined;

    for (const config of configs) {
      const {
        srcTelegramChat,
        dstDiscordChannelIds,
        dstLineGroupIds,
        dstTelegramChats,
      } = config;

      if (
        srcTelegramChat !== undefined &&
        srcTelegramChat.id === chatId &&
        srcTelegramChat.threadId === threadId
      )
        if (text) {
          if (dstDiscordChannelIds) {
            await this.sendTextToDiscord(dstDiscordChannelIds, user);
            await this.sendTextToDiscord(dstDiscordChannelIds, text);
          }
          if (dstTelegramChats) {
            await this.sendTextToTelegram(dstTelegramChats, user);
            await this.sendTextToTelegram(dstTelegramChats, text);
          }
          if (dstLineGroupIds)
            await this.sendTextToLine(dstLineGroupIds, [user, text]);
        } else if (fileId) {
          // get url
          const contentStream = this.telegramBot.getFileStream(fileId);
          const url = await this.getUrlByStream(contentStream);
          console.log(url);
          if (dstDiscordChannelIds) {
            await this.sendTextToDiscord(dstDiscordChannelIds, user);
            await this.sendImageToDiscord(dstDiscordChannelIds, url);
          }
          if (dstTelegramChats) {
            await this.sendTextToTelegram(dstTelegramChats, user);
            await this.sendImageToTelegram(dstTelegramChats, url);
          }
          if (dstLineGroupIds)
            await this.sendImageToLine(dstLineGroupIds, url, user);
        }
    }
  }

  public async receiveLineMessage(event: MessageEvent) {
    const configs = JSON.parse(String(process.env.CONFIGURATION)) as Config[];

    for (const config of configs) {
      const {
        srcLine,
        dstDiscordChannelIds,
        dstLineGroupIds,
        dstTelegramChats,
      } = config;

      if (
        srcLine &&
        event.source.userId &&
        srcLine.userIds.includes(event.source.userId) &&
        event.source.type === 'group' &&
        event.source.groupId === srcLine.groupId
      )
        if (event.message.type === 'text') {
          if (dstDiscordChannelIds)
            await this.sendTextToDiscord(
              dstDiscordChannelIds,
              event.message.text
            );
          if (dstTelegramChats)
            await this.sendTextToTelegram(dstTelegramChats, event.message.text);
          if (dstLineGroupIds)
            await this.sendTextToLine(dstLineGroupIds, [event.message.text]);
        } else if (event.message.type === 'image') {
          // save image and get url
          const contentStream = await this.client.getMessageContent(
            event.message.id
          );
          const url = await this.getUrlByStream(contentStream);

          if (dstDiscordChannelIds)
            await this.sendImageToDiscord(dstDiscordChannelIds, url);
          if (dstTelegramChats)
            await this.sendImageToTelegram(dstTelegramChats, url);
          if (dstLineGroupIds) await this.sendImageToLine(dstLineGroupIds, url);
        }
    }
  }
}
