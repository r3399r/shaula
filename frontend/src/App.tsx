import { Button, Card } from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import Loader from './component/Loader';
import { PremiumIndex } from './model/Binance';
import { load } from './service/appService';

const App = () => {
  const [premiumIndex, setPremiumIndex] = useState<PremiumIndex[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refresh, setRefresh] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    load()
      .then((res) => setPremiumIndex(res))
      .finally(() => {
        setIsLoading(false);
      });
  }, [refresh]);

  return (
    <div className="m-5">
      <Button variant="contained" onClick={() => setRefresh(!refresh)}>
        重新整理
      </Button>
      <div className="flex gap-x-4 flex-wrap">
        {premiumIndex?.map((v) => (
          <Card key={v.symbol} classes={{ root: 'p-4 mt-4 !w-full md:!w-[calc(50%-8px)]' }}>
            <div className="text-2xl">{v.symbol}</div>
            <div className="flex gap-2">
              <div className="font-bold w-1/4">標記價格</div>
              <div className="w-3/4">{v.markPrice}</div>
            </div>
            <div className="flex gap-2">
              <div className="font-bold w-1/4">指數價格</div>
              <div className="w-3/4">{v.indexPrice}</div>
            </div>
            <div className="flex gap-2">
              <div className="font-bold w-1/4">預估結算價</div>
              <div className="w-3/4">{v.estimatedSettlePrice}</div>
            </div>
            <div className="flex gap-2">
              <div className="font-bold w-1/4">最近更新的資金費率</div>
              <div className="w-3/4">{v.lastFundingRate}</div>
            </div>
            <div className="flex gap-2">
              <div className="font-bold w-1/4">下次資金費時間</div>
              <div className="w-3/4">
                {format(new Date(v.nextFundingTime), 'yyyy-MM-dd HH:mm:ss')}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="font-bold w-1/4">標的資產基礎利率</div>
              <div className="w-3/4">{v.interestRate}</div>
            </div>
            <div className="flex gap-2">
              <div className="font-bold w-1/4">更新時間</div>
              <div className="w-3/4">{format(new Date(v.time), 'yyyy-MM-dd HH:mm:ss')}</div>
            </div>
          </Card>
        ))}
      </div>
      <div />
      <Loader open={isLoading} />
    </div>
  );
};

export default App;
