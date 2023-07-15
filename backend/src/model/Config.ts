export type Config = {
  srcLine?: {
    groupId: string;
    userIds: string[];
  };
  srcTelegramChat?: {
    id: number;
    threadId?: number;
  };
  srcTwitterUsernames?: string[];
  fundingRateLimit?: {
    BTCUSDT: [number, number];
    ETHUSDT: [number, number];
  };
  dstLineGroupIds?: string[];
  dstDiscordChannelIds?: string[];
  dstTelegramChats?: {
    id: number;
    threadId?: number;
  }[];
};
