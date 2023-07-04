export type Config = {
  tokenDiscord: string;
  tokenTelegram: string;
  srcLineGroupId: string;
  srcLineUserIds: string[];
  dstLineGroupIds: string[];
  dstDiscordChannelIds: string[];
  dstTelegramChatIds: string[];
};
