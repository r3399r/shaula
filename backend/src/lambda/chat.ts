import { WebhookRequestBody } from '@line/bot-sdk';
import { Update } from 'node-telegram-bot-api';
import { bindings } from 'src/bindings';
import { ChatService } from 'src/logic/ChatService';
import { LambdaContext } from 'src/model/Lambda';
import { BindingsHelper } from 'src/util/BindingsHelper';

export async function chat(
  event: WebhookRequestBody | Update,
  _context?: LambdaContext
) {
  let service: ChatService | null = null;
  try {
    BindingsHelper.bindClientConfig({
      channelAccessToken: String(process.env.TOKEN_LINE),
    });
    BindingsHelper.bindTelegramConfig(String(process.env.TOKEN_TELEGRAM));

    service = bindings.get(ChatService);

    if ('update_id' in event) await service.receiveTelegramUpdate(event);
    else
      for (const ev of event.events)
        if (ev.type === 'message') await service.receiveLineMessage(ev);

    return {
      statusCode: 200,
    };
  } catch (e) {
    console.error(e);

    return {
      statusCode: 500,
    };
  }
}
