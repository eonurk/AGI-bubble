import { useState, useEffect } from "react";
import { Timer } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface CountdownProps {
	targetDate: string; // Format: DD.MM.YYYY
}

function TimeBox({ value, label }: { value: number; label: string }) {
	const formatted = String(Math.max(0, value)).padStart(2, "0");

	return (
		<div className="flex flex-col items-center rounded-lg border border-border/80 bg-background/80 p-2 md:p-3">
			<div className="h-9 md:h-10 flex items-center justify-center overflow-hidden">
				<div className="inline-flex items-center gap-0.5 text-2xl md:text-3xl font-bold tabular-nums text-foreground">
					{formatted.split("").map((digit, index) => (
						<div
							key={`${label}-slot-${index}`}
							className="relative w-[0.72em] h-[1.05em] overflow-hidden"
						>
							<motion.div
								initial={false}
								animate={{ y: `-${Number(digit) * 100}%` }}
								transition={{
									type: "spring",
									stiffness: 220,
									damping: 24,
									mass: 0.5,
								}}
								className="absolute inset-0"
							>
								{Array.from({ length: 10 }, (_, n) => (
									<div
										key={`${label}-${index}-digit-${n}`}
										className="h-[1.05em] flex items-center justify-center"
									>
										{n}
									</div>
								))}
							</motion.div>
						</div>
					))}
				</div>
			</div>

			<span className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground mt-1 font-medium">
				{label}
			</span>
		</div>
	);
}

export function Countdown({ targetDate }: CountdownProps) {
	const [timeLeft, setTimeLeft] = useState<{
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
	} | null>(null);

	useEffect(() => {
		if (!targetDate || targetDate === "...") return;

		// Parse DD.MM.YYYY
		const parts = targetDate.split(".");
		if (parts.length !== 3) return;

		// Month is 0-indexed in JS Date
		const target = new Date(
			parseInt(parts[2]),
			parseInt(parts[1]) - 1,
			parseInt(parts[0]),
		);

		const calculateTimeLeft = () => {
			const now = new Date();
			if (target <= now) {
				return { days: 0, hours: 0, minutes: 0, seconds: 0 };
			}
			const remainder = target.getTime() - now.getTime();

			return {
				days: Math.floor(remainder / (1000 * 60 * 60 * 24)),
				hours: Math.floor((remainder / (1000 * 60 * 60)) % 24),
				minutes: Math.floor((remainder / (1000 * 60)) % 60),
				seconds: Math.floor((remainder / 1000) % 60),
			};
		};

		setTimeLeft(calculateTimeLeft());

		const timer = setInterval(() => {
			setTimeLeft(calculateTimeLeft());
		}, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	if (!timeLeft) return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className="w-full"
		>
			<Card className="bg-card/50 backdrop-blur border-primary/10">
				<CardContent className="p-4 md:p-6">
					<div className="flex flex-col items-center gap-4">
						<div className="flex items-center gap-2 text-muted-foreground uppercase tracking-[0.14em] text-[11px] font-semibold">
							<Timer className="w-4 h-4 text-primary" />
							Consensus Countdown
						</div>

						<div className="w-full max-w-2xl grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
							<TimeBox value={timeLeft.days} label="Days" />
							<TimeBox value={timeLeft.hours} label="Hours" />
							<TimeBox value={timeLeft.minutes} label="Minutes" />
							<TimeBox value={timeLeft.seconds} label="Seconds" />
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
