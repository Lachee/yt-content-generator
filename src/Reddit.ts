import axios from 'axios';

export type TimeFrame = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

// === Articles
/** Fetches all articles */
export async function articles(subreddit : string, time : TimeFrame, limit : number = 25) : Promise<Article[]> {
    const response = await axios.get(`https://www.reddit.com/${subreddit}/.json?t=${time}&count=${limit}`);
    const { data } = response.data;
    const posts : Article[] = data.children.map(child => child.data as Article);
    return posts;
}
/** Gets the top posts of a subreddit */
export async function topArticles(subreddit : string, time : TimeFrame, limit : number = 25) : Promise<Article[]> {
    const response = await axios.get(`https://www.reddit.com/${subreddit}/top/.json?t=${time}&count=${limit}`);
    const { data } = response.data;
    const posts : Article[] = data.children.map(child => child.data as Article);
    return posts;
}
/** Gets the most controversial posts */
export async function controversialArticles(subreddit : string, time : TimeFrame, limit : number = 25) : Promise<Article[]> {
    const response = await axios.get(`https://www.reddit.com/${subreddit}/controversial/.json?t=${time}&count=${limit}`);
    const { data } = response.data;
    const posts : Article[] = data.children.map(child => child.data as Article);
    return posts;
}

// === Comments
/** Fetches all comments */
export async function comments(post : Post) : Promise<Comment[]> {
    const endpoint = `${post.subreddit}/comments/${post.id}/.json`;
    const response = await axios.get(`https://www.reddit.com/r/${endpoint}`);
    const { data } = response.data[1];
    return data.children.map(child => child.data as Comment);
}
/** Fetches top comments */
export async function topComments(post : Post) : Promise<Comment[]> {
    const endpoint = `${post.subreddit}/comments/${post.id}/top/.json`;
    const response = await axios.get(`https://www.reddit.com/r/${endpoint}`);
    const { data } = response.data[1];
    return data.children.map(child => child.data as Comment);
}

// === Types
interface Post {
    id:                 string;
    subreddit:          string;
    subreddit_id:       string;
    author:             string;
    author_fullname:    string;
    name:               string;
    permalink:          string;
    url:                string;
    upvote_ratio:       number;
    downs:              number;
    ups:                number;
    score:              number;
    created:            number;
    created_utc:        number;
    awarders:           any[];
    collapsed:          boolean;
}

export interface Comment extends Post {
    body : string;
    body_html : string;
    
    parent_id   : string;
    replies     : { data : { children : Comment[] }};
}

export interface Article extends Post {  
    title:                         string;
    link_flair_text_color:         string;
    num_comments:                  number;
    total_awards_received:         number;
    media_embed:                   unknown;
    is_original_content:           boolean;
    is_meta:                       boolean;
    category:                      string|null;
    selftext_html:                 string;
    likes:                         number;
    view_count:                    number;
    archived:                      boolean;
    pinned:                        boolean;
    over_18:                       boolean;
    media_only:                    boolean;
    spoiler:                       boolean;
    locked:                        boolean;
    stickied:                      boolean;
    num_crossposts:                number;
    media:                         null;
    is_video:                      boolean;
}