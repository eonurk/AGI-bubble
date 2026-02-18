import { motion } from "framer-motion";

interface NewsTickerProps {
	prophecies: { year: number; remark: string }[];
}

export function NewsTicker({ prophecies }: NewsTickerProps) {
	if (prophecies.length === 0) return null;

	// Duplicate list for seamless loop
	const headlines = [...prophecies, ...prophecies, ...prophecies].slice(0, 30);

	return (
		<div className="w-full rounded-lg border border-primary/10 bg-card/50 backdrop-blur overflow-hidden py-2 relative flex items-center">
			<div className="absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r from-card to-transparent z-10" />
			<div className="absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l from-card to-transparent z-10" />

			<motion.div
				className="flex items-center gap-10 whitespace-nowrap"
				animate={{ x: ["0%", "-50%"] }}
				transition={{
					repeat: Infinity,
					ease: "linear",
					duration: 60,
				}}
			>
				{headlines.map((item, i) => (
					<div
						key={`${item.year}-${i}`}
						className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground/85"
					>
						<span className="font-bold text-primary/80">[{item.year}]</span>
						<span>
							{item.remark.length > 72
								? item.remark.substring(0, 72) + "..."
								: item.remark}
						</span>
						<span className="w-1 h-1 rounded-full bg-primary/30 ml-6" />
					</div>
				))}
			</motion.div>
		</div>
	);
}
