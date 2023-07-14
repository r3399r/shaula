import { bindings } from 'src/bindings';
import { TwitterService } from 'src/logic/TwitterService';
import { BindingsHelper } from 'src/util/BindingsHelper';

export async function twitter(_event: unknown, _context: unknown) {
  BindingsHelper.bindTelegramConfig(String(process.env.TOKEN_TELEGRAM));
  const service = bindings.get(TwitterService);
  await service.cron();
}
