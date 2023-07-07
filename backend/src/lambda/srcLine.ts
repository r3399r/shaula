import { WebhookRequestBody } from '@line/bot-sdk';
import { bindings } from 'src/bindings';
import { ChatService } from 'src/logic/ChatService';
import { LambdaContext } from 'src/model/Lambda';
import { BindingsHelper } from 'src/util/BindingsHelper';

export async function srcLine(
  event: WebhookRequestBody,
  _context?: LambdaContext
) {
  console.log(JSON.stringify(event.events));
  let service: ChatService | null = null;
  try {
    BindingsHelper.bindClientConfig({
      channelAccessToken: String(process.env.TOKEN_LINE),
    });

    service = bindings.get(ChatService);

    for (const ev of event.events)
      if (ev.type === 'message') await service.receiveTextMessage(ev);
  } catch (e) {
    console.error(e);
  }
}
