export type PremiumIndex = {
  symbol: string; // 交易對
  markPrice: string; // 標記價格
  indexPrice: string; // 指數價格
  estimatedSettlePrice: string; // 預估結算價，僅在交割開始前最後一小時有意義
  lastFundingRate: string; // 最近更新的資金費率
  nextFundingTime: number; // 下次資金費時間
  interestRate: string; // 標的資產基礎利率
  time: number; // 更新時間
};
