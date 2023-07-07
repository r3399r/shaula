import { WebhookRequestBody } from '@line/bot-sdk';
import { LambdaContext } from 'src/model/Lambda';

export async function srcTelegram(
  event: WebhookRequestBody,
  _context?: LambdaContext
) {
  console.log(JSON.stringify(event));
  // let service: ChatService | null = null;
  // try {
  //   BindingsHelper.bindClientConfig({
  //     channelAccessToken: String(process.env.TOKEN_LINE),
  //   });

  //   service = bindings.get(ChatService);

  //   for (const ev of event.events)
  //     if (ev.type === 'message') await service.receiveTextMessage(ev);
  // } catch (e) {
  //   console.error(e);
  // }
}
