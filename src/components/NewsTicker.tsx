import { motion } from "framer-motion";
import { Radio } from "lucide-react";

interface NewsTickerProps {
    prophecies: { year: number; remark: string }[];
}

export function NewsTicker({ prophecies }: NewsTickerProps) {
    if (prophecies.length === 0) return null;

    // Duplicate list for seamless loop
    const headlines = [...prophecies, ...prophecies, ...prophecies].slice(0, 30); 

    return (
        <div className="w-full bg-primary/5 border-y border-primary/10 overflow-hidden py-2 relative flex items-center">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
            
            <div className="flex items-center gap-2 px-4 z-20 shrink-0 border-r border-primary/10 mr-4">
                <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">Live Feed</span>
            </div>

            <motion.div 
                className="flex items-center gap-12 whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ 
                    repeat: Infinity, 
                    ease: "linear", 
                    duration: 60 // Adjust speed here
                }}
            >
                {headlines.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground/80">
                        <span className="font-bold text-primary/70">[{item.year}]</span>
                        <span>{item.remark.length > 80 ? item.remark.substring(0, 80) + "..." : item.remark}</span>
                        <span className="w-1 h-1 rounded-full bg-primary/30 ml-8" />
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
