export function formatRelativeTime(date: Date | string): string {
    const targetDate = new Date(date);
    const now = new Date();

    const diffMs = now.getTime() - targetDate.getTime();

    // Future date
    if (diffMs < 0) {
        return "Just now";
    }

    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
        return "Just now";
    }

    if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    }

    if (hours < 24) {
        return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    }

    if (days === 1) {
        return "Yesterday";
    }

    if (days < 7) {
        return `${days} days ago`;
    }

    if (weeks < 5) {
        return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }

    if (months < 12) {
        return `${months} ${months === 1 ? "month" : "months"} ago`;
    }

    return `${years} ${years === 1 ? "year" : "years"} ago`;
}