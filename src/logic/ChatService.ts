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
    if (
      event.source.type === 'group' &&
      event.source.groupId === 'C714e154a8d1b6a00ce2389a9f41dae38'
    )
      if (event.message.type === 'text') {
        // line
        await this.client.pushMessage('Ccca6c0d6ed49e51eb3cb6e52a04ef6ea', [
          {
            type: 'text',
            text: event.message.text,
          },
        ]);

        // discord
        await axios.request({
          method: 'post',
          url: 'https://discord.com/api/webhooks/1091170560001716314/5kU6C4_y2gmIVKA32dt6X31wb1H8CglcxG8u3ekGrC0fIu1fGkupX5E3YNsEJvC4W7AX',
          headers: { 'Content-Type': 'application/json' },
          data: {
            content: event.message.text,
          },
        });

        // telegram
        const bot = new TelegramBot(
          '5686867514:AAHPvyxZXozInmz4UZhg__UnPPtwo_19l5Q',
          { polling: true }
        );
        await bot.sendMessage(-785187941, event.message.text);
      } else if (event.message.type === 'image') {
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
        });

        // line
        await this.client.pushMessage('Ccca6c0d6ed49e51eb3cb6e52a04ef6ea', [
          {
            type: 'image',
            originalContentUrl: url,
            previewImageUrl: url,
          },
        ]);
        console.log(url);
        // discord
        await axios.request({
          method: 'post',
          url: 'https://discord.com/api/webhooks/1091170560001716314/5kU6C4_y2gmIVKA32dt6X31wb1H8CglcxG8u3ekGrC0fIu1fGkupX5E3YNsEJvC4W7AX',
          headers: { 'Content-Type': 'application/json' },
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
        const bot = new TelegramBot(
          '5686867514:AAHPvyxZXozInmz4UZhg__UnPPtwo_19l5Q',
          { polling: true }
        );
        await bot.sendPhoto(-785187941, url);
      }
  }
}
