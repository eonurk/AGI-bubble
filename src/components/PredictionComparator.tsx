import { useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator, Trophy, Clock, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface PredictionComparatorProps {
	years: number[];
}

export function PredictionComparator({ years }: PredictionComparatorProps) {
	const [userYear, setUserYear] = useState<string>("");
	const [result, setResult] = useState<{
		percentile: number;
		isOptimist: boolean;
		message: string;
	} | null>(null);
	const currentYear = new Date().getFullYear();

	const calculatePosition = () => {
		const year = parseInt(userYear);
		if (isNaN(year) || year < currentYear || year > 2100) return;

		// Calculate percentile: How many people predicted LATER than this user?
		const slowerPredictions = years.filter((y) => y > year).length;
		const total = years.length;

		// Percentile of people the user is "faster than"
		const percentile = Math.round((slowerPredictions / total) * 100);

		let message = "";
		let isOptimist = percentile > 50;

		if (year < 2027)
			message = "You're an Accelerationist! Very few expect it this soon.";
		else if (year < 2032)
			message = "You're with the majority. This is the consensus decade.";
		else if (year < 2040)
			message = "You're a Skeptic. You think the current hype will hit a wall.";
		else
			message = "You're a Long-termist. You believe we have a long road ahead.";

		setResult({ percentile, isOptimist, message });
	};

	const shareResult = async () => {
		if (!result) return;
		const text = `I predict AGI in ${userYear}. That makes me an ${
			result.isOptimist ? "Accelerationist" : "Skeptic"
		} (faster than ${
			result.percentile
		}% of the community). Where do you stand? #AGIBubble ${
			window.location.href
		}`;
		try {
			await navigator.clipboard.writeText(text);
			alert("Result copied to clipboard!");
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<Card className="bg-card/50 backdrop-blur border-primary/10">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-xl">
					<Calculator className="w-5 h-5 text-primary" /> Where do you stand?
				</CardTitle>
				<CardDescription>
					Enter your prediction year to see how you compare to the community.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex gap-4 items-end">
					<div className="flex-1 space-y-2">
						<label className="text-sm font-medium text-muted-foreground">
							Your Prediction (Year)
						</label>
						<div className="flex gap-2">
							<input
								type="number"
								placeholder={`e.g. ${currentYear + 5}`}
								min={currentYear}
								max={2100}
								value={userYear}
								onChange={(e) => setUserYear(e.target.value)}
								className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								onKeyDown={(e) => e.key === "Enter" && calculatePosition()}
							/>
							<Button onClick={calculatePosition}>
								Compare <ArrowRight className="w-4 h-4 ml-2" />
							</Button>
						</div>
					</div>
				</div>

				{result && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						className="mt-6 p-4 rounded-lg bg-background/50 border border-primary/10 shadow-sm space-y-3"
					>
						<div className="flex items-start gap-4">
							<div
								className={`p-2 rounded-full ${
									result.isOptimist
										? "bg-emerald-500/10 text-emerald-600"
										: "bg-amber-500/10 text-amber-600"
								}`}
							>
								{result.isOptimist ? (
									<Trophy className="w-5 h-5" />
								) : (
									<Clock className="w-5 h-5" />
								)}
							</div>
							<div className="flex-1">
								<h4 className="font-bold text-lg">
									Faster than {result.percentile}% of people
								</h4>
								<p className="text-muted-foreground text-sm mt-1">
									{result.message}
								</p>
							</div>
						</div>

						{/* Visual Bar */}
						<div className="relative h-2 bg-secondary rounded-full mt-2 overflow-hidden">
							<motion.div
								initial={{ width: 0 }}
								animate={{ width: `${result.percentile}%` }}
								transition={{ duration: 0.8, ease: "circOut" }}
								className="absolute top-0 left-0 h-full bg-primary"
							/>
						</div>

						<div className="flex justify-between items-center pt-2">
							<div className="flex gap-4 text-[10px] text-muted-foreground uppercase tracking-wider">
								<span>Skeptics</span>
								<span>Optimists</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 text-xs gap-2 hover:text-primary hover:bg-primary/10"
								onClick={shareResult}
							>
								<Share2 className="w-3 h-3" /> Share Result
							</Button>
						</div>
					</motion.div>
				)}
			</CardContent>
		</Card>
	);
}
