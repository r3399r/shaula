export type ChatConfig = {
  srcLine?: {
    groupId: string;
    userIds: string[];
  };
  srcTelegramChat?: {
    id: number;
    threadId?: number;
  };
  dstLineGroupIds?: string[];
  dstDiscordChannelIds?: string[];
  dstTelegramChats?: {
    id: number;
    threadId?: number;
  }[];
};

export type TwitterConfig = {
  usernames: string[];
  dstTelegramChats: {
    id: number;
    threadId?: number;
  }[];
};
