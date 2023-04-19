import { Article, topArticles, topComments } from "@app/Reddit";
import { Content, ContentProvider, replaceLinks, trimToTime } from ".";
import { readFile, writeFile } from "fs/promises";
import { Configuration, OpenAIApi } from "openai";

export class RedditProvider implements ContentProvider {
    
    subreddit : string;
    blacklistFileName : string;
    
    constructor(subreddit : string, blacklistFileName : string) {
        this.subreddit = subreddit;
        this.blacklistFileName = blacklistFileName;
    }

    async find() : Promise<Content> {
        const article = await this.findArticle();
        const allComments   = (await topComments(article))
                                .filter(comment => !comment.collapsed && comment.body)
                                .map(comment => replaceLinks(comment.body));

        return {
            id:         article.id,
            comments:   trimToTime([article.title, ...allComments], 50, 10)
        }
    }

    async findArticle() : Promise<Article|null> {
        let content = '';
        
        if (this.blacklistFileName) {
            try { 
                content = (await readFile(this.blacklistFileName)).toString() 
            } catch(e) { console.warn(e); }
        }

        const records = content.split('\n');
        const articles = (await topArticles(this.subreddit, 'day', 100))
            .filter(article => !article.collapsed && !article.over_18);
    
        for(const article of articles) {
            if (!records.includes(article.id)) {
                records.push(article.id);
                
                if (this.blacklistFileName)
                    await writeFile(this.blacklistFileName, records.join('\n'));

                return article;
            }
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

    async findArticle(): Promise<Article|null> {
        for (let i = 0; i < this.maxVetAttempts; i++) {
            const article = await super.findArticle();
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