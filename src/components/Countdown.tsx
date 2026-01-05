import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { motion } from "framer-motion";

interface CountdownProps {
    targetDate: string; // Format: DD.MM.YYYY
}

export function Countdown({ targetDate }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    useEffect(() => {
        if (!targetDate || targetDate === "...") return;

        // Parse DD.MM.YYYY
        const parts = targetDate.split(".");
        if (parts.length !== 3) return;
        
        // Month is 0-indexed in JS Date
        const target = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));

        const calculateTimeLeft = () => {
            const difference = +target - +new Date();
            
            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            } else {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    const TimeBox = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center mx-1 md:mx-4">
            <div className="relative">
                <div className="bg-primary/10 text-primary font-mono text-2xl md:text-4xl font-bold min-w-[4rem] md:min-w-[5rem] px-2 md:px-3 h-16 md:h-20 flex items-center justify-center rounded-lg border border-primary/20 backdrop-blur-sm shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                    {String(value).padStart(2, '0')}
                </div>
                {/* Scanline effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent opacity-50 pointer-events-none" />
            </div>
            <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground mt-2 font-medium">{label}</span>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex justify-center mb-12"
        >
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-muted-foreground mb-4 uppercase tracking-[0.2em] text-xs font-bold">
                    <Timer className="w-4 h-4" /> T-Minus to Consensus
                </div>
                <div className="flex items-start">
                    <TimeBox value={timeLeft.days} label="Days" />
                    <div className="text-2xl md:text-4xl font-bold text-primary/30 mt-4">:</div>
                    <TimeBox value={timeLeft.hours} label="Hours" />
                    <div className="text-2xl md:text-4xl font-bold text-primary/30 mt-4">:</div>
                    <TimeBox value={timeLeft.minutes} label="Minutes" />
                    <div className="text-2xl md:text-4xl font-bold text-primary/30 mt-4">:</div>
                    <TimeBox value={timeLeft.seconds} label="Seconds" />
                </div>
            </div>
        </motion.div>
    );
}
