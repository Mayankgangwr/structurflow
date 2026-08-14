export const parseDurationToMs = (duration: string | number): number => {
    if(typeof duration === 'number') return duration;

    const match = duration.match(/^(\d+)(s|m|h|d)$/);
    if(!match) return 60 * 60 * 1000 // default to 1 hour

    const value = parseInt(match[1], 0);
    const unit = match[2];

    switch(unit){
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return  60 * 60 * 1000;
    }
}