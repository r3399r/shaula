import { PremiumIndex } from 'src/model/Binance';
import http from 'src/util/http';

export const load = async () => {
  const [res1, res2] = await Promise.all([
    http.get<PremiumIndex>('/fapi/v1/premiumIndex?symbol=BTCUSDT'),
    http.get<PremiumIndex>('/fapi/v1/premiumIndex?symbol=ETHUSDT'),
  ]);

  return [res1.data, res2.data];
};
