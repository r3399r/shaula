import { addMinutes } from 'date-fns';
import { inject, injectable } from 'inversify';
import TelegramBot from 'node-telegram-bot-api';
import { TwitterConfig } from 'src/model/Config';
import { Tweets, User } from 'src/model/Twitter';
import http from 'src/util/http';

/**
 * Service class for Twitter
 */
@injectable()
export class TwitterService {
  @inject(TelegramBot)
  private readonly telegramBot!: TelegramBot;

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

  public async cron() {
    const config = JSON.parse(
      String(process.env.CONFIGURATION)
    ) as TwitterConfig;
    const { usernames, dstTelegramChats } = config;

    for (const username of usernames) {
      const user = (
        await http.get<User>(
          `https://api.twitter.com/2/users/by/username/${username}`,
          {
            headers: { Authorization: `Bearer ${process.env.TOKEN}` },
          }
        )
      ).data;

      const tweets = (
        await http.get<Tweets>(
          `https://api.twitter.com/2/users/${user.data.id}/tweets`,
          {
            headers: { Authorization: `Bearer ${process.env.TOKEN}` },
            params: {
              start_time: addMinutes(new Date(), -5).toISOString(),
              exclude: 'retweets,replies',
            },
          }
        )
      ).data;

      for (const tweet of tweets.data)
        await this.sendTextToTelegram(
          dstTelegramChats,
          `${username}:\n${tweet.text}`
        );
    }
  }
}
