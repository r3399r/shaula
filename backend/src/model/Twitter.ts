export type User = {
  data: {
    id: string;
    name: string;
    username: string;
  };
};

export type Tweets = {
  data?: {
    id: string;
    edit_history_tweet_ids: string[];
    text: string;
    attachments?: {
      media_keys: string[];
    };
  }[];
  meta: {
    oldest_id: string;
    newest_id: string;
    result_count: number;
    next_token: string;
  };
};

export type TweetDetail = {
  data: {
    attachments: {
      media_keys: string[];
    };
    text: string;
    id: string;
    edit_history_tweet_ids: string[];
  };
  includes: {
    media: {
      height: number;
      width: number;
      url: string;
      media_key: string;
      type: 'animated_gif' | 'photo' | 'video';
    }[];
  };
};
