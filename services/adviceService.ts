import { SLIME_QUOTES } from '../constants/quotes';

export async function getSlimeLordAdvice(levelName: string, gameState: any): Promise<string> {
    const randomIndex = Math.floor(Math.random() * SLIME_QUOTES.length);
    return SLIME_QUOTES[randomIndex];
}
