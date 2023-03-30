import { Container } from 'inversify';
import 'reflect-metadata';
import { ChatService } from './logic/ChatService';

const container: Container = new Container();

// service
container.bind<ChatService>(ChatService).toSelf();

export { container as bindings };
