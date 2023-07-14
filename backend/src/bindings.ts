import { S3 } from 'aws-sdk';
import { Container } from 'inversify';
import 'reflect-metadata';
import { BinanceService } from './logic/BinanceService';
import { ChatService } from './logic/ChatService';
import { TwitterService } from './logic/TwitterService';

const container: Container = new Container();

// service
container.bind<ChatService>(ChatService).toSelf();
container.bind<BinanceService>(BinanceService).toSelf();
container.bind<TwitterService>(TwitterService).toSelf();

// AWS
container.bind<S3>(S3).toDynamicValue(() => new S3());

export { container as bindings };
