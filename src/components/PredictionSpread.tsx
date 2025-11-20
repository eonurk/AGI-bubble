import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCommitHorizontal } from "lucide-react";

interface PredictionSpreadProps {
    earliest: number;
    latest: number;
    median: number;
}

export function PredictionSpread({ earliest, latest, median }: PredictionSpreadProps) {
    const spread = latest - earliest;
    // Calculate position percentages
    const medianPos = spread > 0 ? ((median - earliest) / spread) * 100 : 50;

    return (
        <Card className="bg-card/50 backdrop-blur border-primary/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <GitCommitHorizontal className="w-4 h-4" /> Prediction Uncertainty
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6 pt-4">
                    <div className="relative h-12 w-full mt-4 flex items-center">
                        {/* Track */}
                        <div className="absolute top-1/2 left-0 w-full h-2 bg-secondary/50 rounded-full -translate-y-1/2" />

                        {/* Uncertainty Range Bar */}
                        <div
                            className="absolute top-1/2 left-0 w-full h-2 rounded-full -translate-y-1/2 overflow-hidden"
                        >
                            <div className="w-full h-full bg-primary/10"
                                style={{
                                    backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, hsl(var(--primary) / 0.1) 5px, hsl(var(--primary) / 0.1) 10px)"
                                }}
                            />
                        </div>

                        {/* Earliest Marker */}
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 flex flex-col items-center group cursor-help">
                            <div className="w-4 h-4 rounded-full bg-background border-2 border-muted-foreground/50 group-hover:border-primary transition-colors z-10" />
                            <div className="absolute top-6 flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Earliest</span>
                                <span className="text-xs font-bold">{earliest}</span>
                            </div>
                        </div>

                        {/* Latest Marker */}
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 flex flex-col items-center group cursor-help">
                            <div className="w-4 h-4 rounded-full bg-background border-2 border-muted-foreground/50 group-hover:border-primary transition-colors z-10" />
                            <div className="absolute top-6 flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Latest</span>
                                <span className="text-xs font-bold">{latest}</span>
                            </div>
                        </div>

                        {/* Median Marker */}
                        <motion.div
                            initial={{ left: "50%" }}
                            animate={{ left: `${medianPos}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-20"
                        >
                            <div className="relative">
                                <div className="w-5 h-5 rounded-full bg-primary shadow-lg shadow-primary/30 ring-4 ring-background" />
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-primary/50" />
                            </div>
                            <div className="absolute -top-8 flex flex-col items-center bg-card border px-2 py-1 rounded shadow-sm whitespace-nowrap">
                                <span className="text-xs font-bold text-primary">{median}</span>
                                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Median</span>
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                        <div>Uncertainty Gap: <span className="font-medium text-foreground">{spread} years</span></div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
