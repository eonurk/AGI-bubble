import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

interface ConsensusMeterProps {
    yesCount: number;
    noCount: number;
    title: string;
}

export function ConsensusMeter({ yesCount, noCount, title }: ConsensusMeterProps) {
    const total = yesCount + noCount;
    const yesPercentage = total > 0 ? (yesCount / total) * 100 : 0;
    const consensusScore = Math.abs(yesPercentage - 50) * 2; // 0 = 50/50 split, 100 = 100% agreement

    return (
        <Card className="bg-card/50 backdrop-blur border-primary/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> {title} Consensus
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div className="text-3xl font-bold">{Math.round(consensusScore)}%</div>
                        <div className="text-sm text-muted-foreground mb-1">Agreement Score</div>
                    </div>

                    <div className="relative h-4 w-full bg-secondary rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${consensusScore}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`absolute top-0 left-0 h-full rounded-full ${consensusScore > 70 ? "bg-green-500" :
                                    consensusScore > 40 ? "bg-yellow-500" : "bg-red-500"
                                }`}
                        />
                    </div>

                    <CardDescription className="text-xs">
                        {consensusScore > 80 ? "High Consensus" :
                            consensusScore > 40 ? "Moderate Disagreement" : "High Controversy"}
                    </CardDescription>
                </div>
            </CardContent>
        </Card>
    );
}
