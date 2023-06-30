import { Client, ClientConfig } from '@line/bot-sdk';
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
}
