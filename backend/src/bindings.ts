import { S3 } from 'aws-sdk';
import { Container } from 'inversify';
import 'reflect-metadata';
import { ChatService } from './logic/ChatService';

const container: Container = new Container();

// service
container.bind<ChatService>(ChatService).toSelf();

// AWS
container.bind<S3>(S3).toDynamicValue(() => new S3());

export { container as bindings };
