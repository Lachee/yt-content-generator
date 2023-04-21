import { Article, topArticles, topComments } from "@app/Reddit";
import { Content, ContentProvider, replaceLinks, trimToTime } from ".";
import { readFile, writeFile } from "fs/promises";
import { Configuration, OpenAIApi } from "openai";

export class RedditProvider implements ContentProvider {
    
    subreddit : string;
    blacklistFileName : string;

    maxSearchAttempts = 10;
    averageChacatersPerSecond = 17.19;
    maxCommentLength = 230;

    constructor(subreddit : string, blacklistFileName : string) {
        this.subreddit = subreddit;
        this.blacklistFileName = blacklistFileName;
    }

    async find() : Promise<Content> {
        // Load the initial blacklist
        let blacklist : string[] = [];
        if (this.blacklistFileName) {
            try { 
                let content = (await readFile(this.blacklistFileName)).toString() 
                blacklist = content.split('\n');
            } catch(e) { console.warn(e); }
        }
        
        try 
        {
            // Find the best article
            for (let i = 0; i < this.maxSearchAttempts; i++) {
                const article = await this.findArticle(blacklist);
                const allComments   = (await topComments(article))
                                        .filter(comment => !comment.collapsed && comment.body && comment.body.length <= this.maxCommentLength)
                                        .map(comment => replaceLinks(comment.body));
                
                const comments = trimToTime([article.title, ...allComments], 50, this.averageChacatersPerSecond);
                if (comments.length <= 2) {
                    blacklist.push(article.id);
                    continue;
                }

                return {
                    id:         article.id,
                    comments:   comments
                }
            }
        } 
        finally 
        {
            // Finally write the blacklist back
            if (this.blacklistFileName)
                await writeFile(this.blacklistFileName, blacklist.join('\n'));
        }

        throw Error('No articles managed to fit criteria');
    }

    protected async findArticle(blacklist : string[]) : Promise<Article|null> {        
        const articles = (await topArticles(this.subreddit, 'day', 100))
            .filter(article => !article.collapsed && !article.over_18);
    
        for(const article of articles) {
            if (!blacklist.includes(article.id))  
                return article;
        }
        return null;
    }
}

export class VettedRedditProvider extends RedditProvider {

    private chatgpt : OpenAIApi;

    maxVetAttempts = 10;

    weights = {
        'hate': 0.02,
        'hate/threatening': 0.004,
        'self-harm': 0.001,
        'sexual': 0.2,
        'sexual/minors': 0.02,
        'violence': 0.05,
        'violence/graphic': 0.05,
    };

    constructor(subreddit : string, blacklistFileName : string, key : string) {
        super(subreddit, blacklistFileName);
        this.chatgpt = new OpenAIApi( new Configuration({
            apiKey: key
        }));
    }

    protected async findArticle(blacklist : string[]): Promise<Article|null> {
        for (let i = 0; i < this.maxVetAttempts; i++) {
            const article = await super.findArticle(blacklist);
            const response = await this.chatgpt.createModeration({
                input: article.title,
                model: 'text-moderation-stable'
            });

            let flagged = false;
            const results = response.data.results[0];

            if (results.flagged) {
                console.warn('vetted (flagged by chatgpt)', results.categories);
                flagged = true;
            }

            for(const key in this.weights) {
                const score = results.category_scores[key] || 1;
                if (score >= this.weights[key]) {
                    console.warn(`vetted (score exceeded) (${key} = ${score} > ${this.weights[key]})`);
                    flagged = true;
                }
            }
            if (flagged) {
                console.error('bad article. See previous logs for reason.', article.title)
                continue;
            }

            return article;
        }

        throw Error('No articles managed to get vetted');
    }
}