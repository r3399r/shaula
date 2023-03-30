import { Client, MessageEvent } from '@line/bot-sdk';
import { inject, injectable } from 'inversify';

/**
 * Service class for chat
 */
@injectable()
export class ChatService {
  @inject(Client)
  private readonly client!: Client;

  public async receiveTextMessage(event: MessageEvent) {
    if (
      event.source.type === 'group' &&
      event.source.groupId === 'C714e154a8d1b6a00ce2389a9f41dae38' &&
      event.message.type === 'text'
    )
      await this.client.pushMessage('Ccca6c0d6ed49e51eb3cb6e52a04ef6ea', [
        {
          type: 'text',
          text: event.message.text,
        },
      ]);
  }
}
