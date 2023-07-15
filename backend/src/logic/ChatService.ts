import { Readable } from 'stream';
import { Client, MessageEvent } from '@line/bot-sdk';
import { S3 } from 'aws-sdk';
import axios from 'axios';
import { addMinutes } from 'date-fns';
import { fileTypeFromBuffer } from 'file-type';
import { inject, injectable } from 'inversify';
import TelegramBot, { Update } from 'node-telegram-bot-api';
import { v4 as uuidv4 } from 'uuid';
import { PremiumIndex } from 'src/model/Binance';
import { Config } from 'src/model/Config';
import { TweetDetail, Tweets, User } from 'src/model/Twitter';
import { bn } from 'src/util/bignumber';
import http from 'src/util/http';

type Message = { type: 'text' | 'image'; content: string };

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

  private async sendToDiscord(channelIds: string[], data: Message[]) {
    const tokenDiscord = String(process.env.TOKEN_DISCORD);
    for (const channelId of channelIds)
      for (const d of data) {
        if (d.type === 'text')
          await axios.request({
            method: 'post',
            url: `https://discord.com/api/channels/${channelId}/messages`,
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bot ${tokenDiscord}`,
            },
            data: {
              content: d.content,
            },
          });
        if (d.type === 'image')
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
                    url: d.content,
                  },
                },
              ],
            },
          });
      }
  }

  private async sendToTelegram(
    chats: {
      id: number;
      threadId?: number;
    }[],
    data: Message[]
  ) {
    for (const chat of chats)
      for (const d of data) {
        if (d.type === 'text')
          await this.telegramBot.sendMessage(chat.id, d.content, {
            message_thread_id: chat.threadId,
          });
        if (d.type === 'image')
          await this.telegramBot.sendPhoto(chat.id, d.content, {
            message_thread_id: chat.threadId,
          });
      }
  }

  private async sendToLine(groupIds: string[], data: Message[]) {
    for (const groupId of groupIds)
      await this.client.pushMessage(
        groupId,
        data.map((v) => {
          if (v.type === 'text')
            return {
              type: 'text',
              text: v.content,
            };
          else
            return {
              type: 'image',
              originalContentUrl: v.content,
              previewImageUrl: v.content,
            };
        })
      );
  }

  private async send(
    data: Message[],
    dst: {
      discordChannelIds?: string[];
      telegramChats?: { id: number; threadId?: number }[];
      lineGropuIds?: string[];
    }
  ) {
    if (dst.discordChannelIds)
      await this.sendToDiscord(dst.discordChannelIds, data);
    if (dst.telegramChats) await this.sendToTelegram(dst.telegramChats, data);
    if (dst.lineGropuIds) await this.sendToLine(dst.lineGropuIds, data);
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

  private async runBinanceCron(config: Config) {
    const {
      fundingRateLimit,
      dstDiscordChannelIds,
      dstTelegramChats,
      dstLineGroupIds,
    } = config;
    if (!fundingRateLimit) return;
    const [res1, res2] = await Promise.all([
      http.get<PremiumIndex>(
        'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT'
      ),
      http.get<PremiumIndex>(
        'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=ETHUSDT'
      ),
    ]);

    const dst = {
      discordChannelIds: dstDiscordChannelIds,
      telegramChats: dstTelegramChats,
      lineGropuIds: dstLineGroupIds,
    };

    if (
      bn(res1.data.lastFundingRate).isGreaterThan(fundingRateLimit.BTCUSDT[1])
    )
      await this.send(
        [
          {
            type: 'text',
            content: `BTCUSDT 資金費率超過上限: ${fundingRateLimit.BTCUSDT[1]}\nhttp://shaula-dev-frontend.s3-website-ap-southeast-1.amazonaws.com/`,
          },
        ],
        dst
      );
    if (bn(res1.data.lastFundingRate).isLessThan(fundingRateLimit.BTCUSDT[0]))
      await this.send(
        [
          {
            type: 'text',
            content: `BTCUSDT 資金費率低於下限: ${fundingRateLimit.BTCUSDT[0]}\nhttp://shaula-dev-frontend.s3-website-ap-southeast-1.amazonaws.com/`,
          },
        ],
        dst
      );
    if (
      bn(res2.data.lastFundingRate).isGreaterThan(fundingRateLimit.ETHUSDT[1])
    )
      await this.send(
        [
          {
            type: 'text',
            content: `ETHUSDT 資金費率超過上限: ${fundingRateLimit.ETHUSDT[1]}\nhttp://shaula-dev-frontend.s3-website-ap-southeast-1.amazonaws.com/`,
          },
        ],
        dst
      );
    if (bn(res2.data.lastFundingRate).isLessThan(fundingRateLimit.ETHUSDT[0]))
      await this.send(
        [
          {
            type: 'text',
            content: `ETHUSDT 資金費率低於下限: ${fundingRateLimit.ETHUSDT[0]}\nhttp://shaula-dev-frontend.s3-website-ap-southeast-1.amazonaws.com/`,
          },
        ],
        dst
      );
  }

  private async runTwitterCron(config: Config) {
    const {
      srcTwitterUsernames,
      dstDiscordChannelIds,
      dstTelegramChats,
      dstLineGroupIds,
    } = config;
    if (!srcTwitterUsernames) return;
    for (const username of srcTwitterUsernames) {
      const res1 = await http.get<User>(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: { Authorization: `Bearer ${process.env.TOKEN}` },
        }
      );
      const user = res1.data;

      const res2 = await http.get<Tweets>(
        `https://api.twitter.com/2/users/${user.data.id}/tweets`,
        {
          headers: { Authorization: `Bearer ${process.env.TOKEN}` },
          params: {
            start_time: addMinutes(new Date(), -5).toISOString(),
            exclude: 'retweets,replies',
            expansions: 'attachments.media_keys',
          },
        }
      );
      const tweets = res2.data;

      if (!tweets.data) return;
      for (const tweet of tweets.data) {
        const content: Message[] = [
          {
            type: 'text',
            content: `${username}:\n${tweet.text}`,
          },
        ];
        if (tweet.attachments) {
          const res3 = await http.get<TweetDetail>(
            `https://api.twitter.com/2/tweets/${tweet.id}`,
            {
              headers: { Authorization: `Bearer ${process.env.TOKEN}` },
              params: {
                expansions: 'attachments.media_keys',
                'media.fields':
                  'duration_ms,height,media_key,preview_image_url,public_metrics,type,url,width,alt_text',
              },
            }
          );
          for (const media of res3.data.includes.media)
            content.push({
              type: 'image',
              content: media.url,
            });
        }
        await this.send(content, {
          discordChannelIds: dstDiscordChannelIds,
          telegramChats: dstTelegramChats,
          lineGropuIds: dstLineGroupIds,
        });
        // log
        console.log(
          JSON.stringify({
            source: 'twitter',
            from: username,
            content: content.map((v) => v.content),
            timestamp: Date.now(),
          })
        );
      }
    }
  }

  public async receiveEventBridgeEvent() {
    const configs = JSON.parse(String(process.env.CONFIGURATION)) as Config[];
    for (const config of configs) {
      await this.runBinanceCron(config);
      await this.runTwitterCron(config);
    }
  }

  public async receiveTelegramUpdate(update: Update) {
    const configs = JSON.parse(String(process.env.CONFIGURATION)) as Config[];

    const user = `${update.message?.from?.first_name ?? ''} ${
      update.message?.from?.last_name ?? ''
    }`;
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
          await this.send(
            [
              {
                type: 'text',
                content: `${user}:\n${text}`,
              },
            ],
            {
              discordChannelIds: dstDiscordChannelIds,
              telegramChats: dstTelegramChats,
              lineGropuIds: dstLineGroupIds,
            }
          );
          // log
          console.log(
            JSON.stringify({
              source: 'telegram',
              type: 'text',
              fromUser: user,
              fromGroup: `${chatId}_${threadId}`,
              message: text,
              timestamp: Date.now(),
            })
          );
        } else if (fileId) {
          // get url
          const contentStream = this.telegramBot.getFileStream(fileId);
          const url = await this.getUrlByStream(contentStream);

          await this.send([{ type: 'image', content: url }], {
            discordChannelIds: dstDiscordChannelIds,
            telegramChats: dstTelegramChats,
            lineGropuIds: dstLineGroupIds,
          });
          // log
          console.log(
            JSON.stringify({
              source: 'telegram',
              type: 'image',
              fromUser: user,
              fromGroup: `${chatId}_${threadId}`,
              url,
              timestamp: Date.now(),
            })
          );
        }
    }
  }

  public async receiveLineMessage(event: MessageEvent) {
    console.log(JSON.stringify(event));
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
          await this.send([{ type: 'text', content: event.message.text }], {
            discordChannelIds: dstDiscordChannelIds,
            telegramChats: dstTelegramChats,
            lineGropuIds: dstLineGroupIds,
          });
          // log
          console.log(
            JSON.stringify({
              source: 'line',
              type: 'text',
              fromUser: event.source.userId,
              fromGroup: event.source.groupId,
              message: event.message.text,
              timestamp: Date.now(),
            })
          );
        } else if (event.message.type === 'image') {
          // save image and get url
          const contentStream = await this.client.getMessageContent(
            event.message.id
          );
          const url = await this.getUrlByStream(contentStream);

          await this.send([{ type: 'image', content: url }], {
            discordChannelIds: dstDiscordChannelIds,
            telegramChats: dstTelegramChats,
            lineGropuIds: dstLineGroupIds,
          });
          // log
          console.log(
            JSON.stringify({
              source: 'line',
              type: 'image',
              from: event.source.userId,
              fromGroup: event.source.groupId,
              url,
              timestamp: Date.now(),
            })
          );
        }
    }
  }
}
