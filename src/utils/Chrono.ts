
export const MINUTE = 60;
export const HOUR = MINUTE * 60;
export const DAY = HOUR * 24;
export const WEEK = DAY*7;
export const MONTH = DAY*30;
export const YEAR = DAY*365;

export const epoch = (date: Date) => Math.floor(date.getTime() / 1000);
export const relative = (seconds : number) => {
    const date = new Date();
    date.setSeconds(date.getSeconds() + seconds);
    return date;
}