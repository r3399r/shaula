import { injectable } from 'inversify';
import { PremiumIndex } from 'src/model/Binance';
import { bn } from 'src/util/bignumber';
import http from 'src/util/http';

/**
 * Service class for Binance
 */
@injectable()
export class BinanceService {
  public async cron() {
    const [res1, res2] = await Promise.all([
      http.get<PremiumIndex>(
        'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT'
      ),
      http.get<PremiumIndex>(
        'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=ETHUSDT'
      ),
    ]);

    const btcusdtUpperLimit = String(process.env.BTCUSDT_UPPER_LIMIT);
    const btcusdtLowerLimit = String(process.env.BTCUSDT_LOWER_LIMIT);
    const ethusdtUpperLimit = String(process.env.ETHUSDT_UPPER_LIMIT);
    const ethusdtLowerLimit = String(process.env.ETHUSDT_LOWER_LIMIT);

    if (
      btcusdtUpperLimit === 'TBD' ||
      btcusdtLowerLimit === 'TBD' ||
      ethusdtUpperLimit === 'TBD' ||
      ethusdtLowerLimit === 'TBD'
    )
      return;

    if (bn(res1.data.lastFundingRate).isGreaterThan(btcusdtUpperLimit))
      console.log(`BTCUSDT 資金費率超過上限: ${btcusdtUpperLimit}`);
    if (bn(res1.data.lastFundingRate).isLessThan(btcusdtLowerLimit))
      console.log(`BTCUSDT 資金費率低於下限: ${btcusdtLowerLimit}`);
    if (bn(res2.data.lastFundingRate).isGreaterThan(ethusdtUpperLimit))
      console.log(`ETHUSDT 資金費率超過上限: ${ethusdtUpperLimit}`);
    if (bn(res2.data.lastFundingRate).isLessThan(ethusdtLowerLimit))
      console.log(`ETHUSDT 資金費率低於下限: ${ethusdtLowerLimit}`);
  }
}
