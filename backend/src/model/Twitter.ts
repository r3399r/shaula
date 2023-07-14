export type User = {
  data: {
    id: string;
    name: string;
    username: string;
  };
};

export type Tweets = {
  data: {
    id: string;
    edit_history_tweet_ids: string[];
    text: string;
  }[];
  meta: {
    oldest_id: string;
    newest_id: string;
    result_count: number;
    next_token: string;
  };
};
