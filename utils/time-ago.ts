import { useEffect, useState } from 'react';

// Formats the date into "5m", "1h", "3d" etc.
const format = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "now";
};

// Custom hook to update the timestamp in real-time
export const useTimeAgo = (isoDate: string) => {
    const [timeAgo, setTimeAgo] = useState(() => format(new Date(isoDate)));

    useEffect(() => {
        const date = new Date(isoDate);
        const interval = setInterval(() => {
            setTimeAgo(format(date));
        }, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [isoDate]);

    return timeAgo;
};