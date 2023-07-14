import { bindings } from 'src/bindings';
import { BinanceService } from 'src/logic/BinanceService';

export async function binance(_event: unknown, _context: unknown) {
  const service = bindings.get(BinanceService);
  await service.cron();
}
