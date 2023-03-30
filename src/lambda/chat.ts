import { WebhookRequestBody } from '@line/bot-sdk';
import { bindings } from 'src/bindings';
import { ChatService } from 'src/logic/ChatService';
import { LambdaContext } from 'src/model/Lambda';
import { BindingsHelper } from 'src/util/BindingsHelper';

export async function chat(
  event: WebhookRequestBody,
  _context?: LambdaContext
) {
  console.log(JSON.stringify(event.events));
  let service: ChatService | null = null;
  try {
    BindingsHelper.bindClientConfig({
      channelAccessToken: String(process.env.CHANNEL_TOKEN),
    });

    service = bindings.get(ChatService);

    if (event.events[0].type === 'message')
      if (event.events[0].message.type === 'text')
        await service.receiveTextMessage(event.events[0]);
  } catch (e) {
    console.error(e);
  }
}
