import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Quote, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Prophecy {
    year: number;
    remark: string;
    archetype: string;
}

interface OracleProps {
    prophecies: { year: number; remark: string }[];
}

export function Oracle({ prophecies }: OracleProps) {
    const [currentProphecy, setCurrentProphecy] = useState<Prophecy | null>(null);
    const [isThinking, setIsThinking] = useState(false);

    const archetypes = [
        { max: 2027, name: "The Accelerationist", color: "text-red-600", bg: "bg-red-500/10" },
        { max: 2032, name: "The Realist", color: "text-blue-600", bg: "bg-blue-500/10" },
        { max: 2040, name: "The Skeptic", color: "text-amber-600", bg: "bg-amber-500/10" },
        { max: 9999, name: "The Long-Termist", color: "text-emerald-600", bg: "bg-emerald-500/10" },
    ];

    const consultOracle = () => {
        if (prophecies.length === 0) return;
        
        setIsThinking(true);
        setCurrentProphecy(null);

        // Simulate "divining" time
        setTimeout(() => {
            const randomPick = prophecies[Math.floor(Math.random() * prophecies.length)];
            const type = archetypes.find(a => randomPick.year <= a.max) || archetypes[3];
            
            setCurrentProphecy({
                ...randomPick,
                archetype: type.name
            });
            setIsThinking(false);
        }, 800);
    };

    return (
        <Card className="bg-card/50 backdrop-blur border-primary/10 overflow-hidden min-h-[300px] flex flex-col justify-center">
            <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold text-foreground">
                    <Sparkles className="w-5 h-5 text-primary" /> The AGI Oracle
                </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col items-center justify-center flex-1 p-6">
                <AnimatePresence mode="wait">
                    {!currentProphecy && !isThinking && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="text-center space-y-6"
                        >
                            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                                Tap into the collective consciousness. Reveal a random prophecy from the community data.
                            </p>
                            <Button 
                                onClick={consultOracle}
                                size="lg"
                            >
                                Consult the Oracle
                            </Button>
                        </motion.div>
                    )}

                    {isThinking && (
                        <motion.div
                            key="thinking"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="relative">
                                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium animate-pulse">Divining the future...</p>
                        </motion.div>
                    )}

                    {currentProphecy && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, rotateX: 90 }}
                            animate={{ opacity: 1, rotateX: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                            className="w-full max-w-md space-y-6"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                    archetypes.find(a => a.name === currentProphecy.archetype)?.bg || "bg-secondary"
                                } ${
                                    archetypes.find(a => a.name === currentProphecy.archetype)?.color || "text-foreground"
                                }`}>
                                    {currentProphecy.archetype}
                                </span>
                                <h3 className="text-4xl font-black text-foreground flex items-center gap-2">
                                    <Calendar className="w-6 h-6 text-muted-foreground" />
                                    {currentProphecy.year}
                                </h3>
                            </div>

                            <div className="relative p-6 rounded-xl bg-background/50 border border-border/50 shadow-inner">
                                <Quote className="absolute top-3 left-3 w-6 h-6 text-primary/20 rotate-180" />
                                <p className="text-center italic text-foreground/90 font-medium leading-relaxed px-4">
                                    "{currentProphecy.remark}"
                                </p>
                                <Quote className="absolute bottom-3 right-3 w-6 h-6 text-primary/20" />
                            </div>

                            <div className="flex justify-center">
                                <Button 
                                    variant="outline" 
                                    onClick={consultOracle}
                                    className="hover:bg-primary/5 hover:text-primary hover:border-primary/20"
                                >
                                    Reveal Another
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
