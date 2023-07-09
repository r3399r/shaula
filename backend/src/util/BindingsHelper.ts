import { Client, ClientConfig } from '@line/bot-sdk';
import TelegramBot from 'node-telegram-bot-api';
import { bindings } from 'src/bindings';

/**
 * Bindings util class.
 */
export class BindingsHelper {
  public static bindClientConfig(config: ClientConfig) {
    if (bindings.isBound(Client) === false)
      bindings.bind<Client>(Client).toDynamicValue(() => new Client(config));
    else
      bindings.rebind<Client>(Client).toDynamicValue(() => new Client(config));
  }
  public static bindTelegramConfig(token: string) {
    if (bindings.isBound(TelegramBot) === false)
      bindings
        .bind<TelegramBot>(TelegramBot)
        .toDynamicValue(() => new TelegramBot(token, { polling: false }));
    else
      bindings
        .rebind<TelegramBot>(TelegramBot)
        .toDynamicValue(() => new TelegramBot(token, { polling: false }));
  }
}
