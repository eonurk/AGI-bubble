import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit } from "lucide-react";
import { useSpring } from "framer-motion";

interface ProbabilitySliderProps {
    years: number[];
}

export function ProbabilitySlider({ years }: ProbabilitySliderProps) {
    const currentYear = new Date().getFullYear();
    const [sliderValue, setSliderValue] = useState(currentYear + 5);
    const [probability, setProbability] = useState(0);

    // Smooth out the probability number changes
    const springConfig = { stiffness: 100, damping: 30 };
    const animatedProbability = useSpring(0, springConfig);

    useEffect(() => {
        if (!years.length) return;
        
        // Calculate cumulative percentage
        const count = years.filter(y => y <= sliderValue).length;
        const percent = Math.round((count / years.length) * 100);
        
        setProbability(percent);
        animatedProbability.set(percent);
    }, [sliderValue, years, animatedProbability]);

    const getPhaseLabel = (prob: number) => {
        if (prob < 10) return "Fringe Theory";
        if (prob < 30) return "Early Adopters";
        if (prob < 50) return "Growing Consensus";
        if (prob < 70) return "Majority View";
        if (prob < 90) return "Highly Probable";
        return "Inevitable";
    };

    const getPhaseColor = (prob: number) => {
        if (prob < 10) return "text-muted-foreground";
        if (prob < 30) return "text-blue-500";
        if (prob < 50) return "text-yellow-500";
        if (prob < 70) return "text-orange-500";
        if (prob < 90) return "text-red-500";
        return "text-purple-500";
    };

    return (
        <Card className="bg-card/50 backdrop-blur border-primary/10 overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <BrainCircuit className="w-5 h-5 text-primary" /> The Probability Slider
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
                
                {/* Main Display */}
                <div className="text-center space-y-2">
                    <p className="text-muted-foreground text-sm uppercase tracking-wider">
                        Chance of AGI by <span className="text-foreground font-bold">{sliderValue}</span>
                    </p>
                    <div className="flex items-center justify-center gap-1">
                        <span className={`text-6xl font-black tabular-nums tracking-tighter transition-colors duration-300 ${getPhaseColor(probability)}`}>
                            {probability}%
                        </span>
                    </div>
                    <div className={`text-sm font-medium uppercase tracking-widest transition-colors duration-300 ${getPhaseColor(probability)}`}>
                        {getPhaseLabel(probability)}
                    </div>
                </div>

                {/* Slider */}
                <div className="relative pt-6 pb-2 px-2">
                    <input
                        type="range"
                        min={currentYear}
                        max={2060} // Cap at 2060 for better usability range
                        step={1}
                        value={sliderValue}
                        onChange={(e) => setSliderValue(parseInt(e.target.value))}
                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    
                    {/* Tick Marks */}
                    <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                        <span>{currentYear}</span>
                        <span>2030</span>
                        <span>2040</span>
                        <span>2050</span>
                        <span>2060</span>
                    </div>
                </div>

                {/* Insight Box */}
                <div className="bg-secondary/30 rounded-lg p-4 text-center text-sm text-muted-foreground">
                    According to the community, it is 
                    <strong className={`mx-1 ${getPhaseColor(probability)}`}>
                        {probability > 50 ? "more likely than not" : "unlikely"}
                    </strong>
                    that AGI will exist by {sliderValue}.
                </div>

            </CardContent>
        </Card>
    );
}
