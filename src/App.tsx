import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import * as d3 from "d3";
import cloud from "d3-cloud";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConsensusMeter } from "@/components/ConsensusMeter";
import { PredictionSpread } from "@/components/PredictionSpread";
import { Loader2, Share2, ExternalLink, TrendingUp, Calendar, MessageSquare } from "lucide-react";

type TimelineDataPoint = {
	year: number;
	count: number;
};

type WordData = {
	text: string;
	size: number;
	x?: number;
	y?: number;
	rotate?: number;
};

function App() {
	const [bubbleData, setBubbleData] = useState([
		{ name: "Yes", value: 0 },
		{ name: "No", value: 0 },
	]);

	const [achievableData, setAchievableData] = useState([
		{ name: "Yes", value: 0 },
		{ name: "No", value: 0 },
	]);

	const [dateData, setDateData] = useState([
		{ name: "Earliest", date: "..." },
		{ name: "Median", date: "..." },
		{ name: "Latest", date: "..." },
	]);

	const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [totalResponses, setTotalResponses] = useState(0);
	const [wordCloudData, setWordCloudData] = useState<WordData[]>([]);

	// New state for analysis components
	const [predictionStats, setPredictionStats] = useState({ earliest: 0, latest: 0, median: 0 });

	// Advanced Analysis State
	const [advancedStats, setAdvancedStats] = useState({
		goldenYear: 0,
		confidenceScore: 0,
		decadeData: [] as { name: string; value: number }[]
	});

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const response = await fetch(
					"https://docs.google.com/spreadsheets/d/e/2PACX-1vS7Zdo-njYucXO4WdaTWfoYMBreq6FcmSAW63JC81yaTfSdSMknODd-oFBzR0lCtTxOGns_utWI-5J0/pub?gid=24394597&single=true&output=csv"
				);

				if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

				const csvText = await response.text();
				const rows = csvText.split("\n").map((row) => row.split(","));

				setTotalResponses(parseInt(rows[1][1]) || 0);

				const bubbleYes = parseInt(rows[2][1]) || 0;
				const bubbleNo = parseInt(rows[3][1]) || 0;
				const achievableYes = parseInt(rows[4][1]) || 0;
				const achievableNo = parseInt(rows[5][1]) || 0;

				const getYear = (row: string[]) => row && row[1] ? row[1].trim().match(/\d{4}/)?.[0] || "N/A" : "N/A";
				const earliestYear = parseInt(getYear(rows[6]));
				const latestYear = parseInt(getYear(rows[7]));
				const medianYear = parseInt(getYear(rows[8]));

				setDateData([
					{ name: "Earliest", date: isNaN(earliestYear) ? "N/A" : earliestYear.toString() },
					{ name: "Median", date: isNaN(medianYear) ? "N/A" : medianYear.toString() },
					{ name: "Latest", date: isNaN(latestYear) ? "N/A" : latestYear.toString() },
				]);

				setPredictionStats({
					earliest: isNaN(earliestYear) ? new Date().getFullYear() : earliestYear,
					latest: isNaN(latestYear) ? new Date().getFullYear() + 10 : latestYear,
					median: isNaN(medianYear) ? new Date().getFullYear() + 5 : medianYear,
				});

				const remarks = rows[12][1] || "";
				const words = remarks.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !["and", "the", "this", "that", "with", "will", "have", "from"].includes(w));

				const wordCount: { [key: string]: number } = {};
				words.forEach(w => wordCount[w] = (wordCount[w] || 0) + 1);

				setWordCloudData(Object.entries(wordCount)
					.map(([text, count]) => ({ text, size: 10 + count * 10 }))
					.sort((a, b) => b.size - a.size)
					.slice(0, 50));

				setBubbleData([
					{ name: "Yes", value: bubbleYes },
					{ name: "No", value: bubbleNo },
				]);

				setAchievableData([
					{ name: "Yes", value: achievableYes },
					{ name: "No", value: achievableNo },
				]);

				const years = rows[11].slice(1).map(y => parseInt(y.trim())).filter(y => !isNaN(y)).sort((a, b) => a - b);
				const yearCounts: { [key: number]: number } = {};
				years.forEach(y => yearCounts[y] = (yearCounts[y] || 0) + 1);

				setTimelineData(Object.entries(yearCounts).map(([year, count]) => ({ year: parseInt(year), count })));

				// Advanced Analysis Calculations
				if (years.length > 0) {
					// 1. Golden Year (Mode)
					let maxCount = 0;
					let modeYear = years[0];
					for (const year in yearCounts) {
						if (yearCounts[year] > maxCount) {
							maxCount = yearCounts[year];
							modeYear = parseInt(year);
						}
					}

					// 2. Confidence Score (StdDev based)
					const mean = years.reduce((a, b) => a + b, 0) / years.length;
					const variance = years.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / years.length;
					const stdDev = Math.sqrt(variance);
					// Map StdDev to 0-100. Assuming StdDev > 20 is 0 confidence.
					const confidence = Math.max(0, Math.min(100, Math.round(100 - (stdDev * 4))));

					// 3. Decade Horizon
					const decades: { [key: string]: number } = {};
					years.forEach(y => {
						const decade = Math.floor(y / 10) * 10;
						const label = `${decade}s`;
						decades[label] = (decades[label] || 0) + 1;
					});
					const decadeData = Object.entries(decades)
						.map(([name, value]) => ({ name, value }))
						.sort((a, b) => parseInt(a.name) - parseInt(b.name));

					setAdvancedStats({
						goldenYear: modeYear,
						confidenceScore: confidence,
						decadeData
					});
				}

			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
		const interval = setInterval(fetchData, 5 * 60 * 1000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (wordCloudData.length === 0) return;
		d3.select("#word-cloud").selectAll("*").remove();

		const width = window.innerWidth < 768 ? 300 : 600;
		const height = 300;

		cloud().size([width, height])
			.words(wordCloudData)
			.padding(5)
			.rotate(() => (Math.random() < 0.5 ? 0 : 90))
			.font("Inter")
			.fontSize((d: any) => d.size)
			.on("end", draw)
			.start();

		function draw(words: WordData[]) {
			const svg = d3.select("#word-cloud").append("svg")
				.attr("width", "100%")
				.attr("height", height)
				.attr("viewBox", `0 0 ${width} ${height}`)
				.append("g")
				.attr("transform", `translate(${width / 2},${height / 2})`);

			const colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#06b6d4"];

			svg.selectAll("text")
				.data(words)
				.enter().append("text")
				.style("font-size", d => `${d.size}px`)
				.style("font-family", "Inter")
				.style("fill", () => colors[Math.floor(Math.random() * colors.length)])
				.style("font-weight", "600")
				.attr("text-anchor", "middle")
				.attr("transform", (d: any) => `translate(${d.x},${d.y})rotate(${d.rotate})`)
				.text(d => d.text);
		}
	}, [wordCloudData]);

	const COLORS = ["#3b82f6", "#1e293b"]; // Primary Blue & Dark Slate
	const COLORS_ACHIEVABLE = ["#10b981", "#1e293b"]; // Emerald & Dark Slate

	const handleFormClick = () => window.open("https://forms.gle/Y2L2mpNV78Xtax9h6", "_blank");

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: { y: 0, opacity: 1 }
	};

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/20">
			<Header />

			<main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-7xl">
				<motion.div
					initial="hidden"
					animate="visible"
					variants={containerVariants}
					className="space-y-8"
				>
					{/* Hero Section */}
					<motion.div variants={itemVariants} className="text-center space-y-6 max-w-3xl mx-auto mb-12">
						<div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
							<span className="relative flex h-2 w-2 mr-2">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
								<span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
							</span>
							Live Community Data
						</div>
						<h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
							The Future of AGI
						</h1>
						<p className="text-xl text-muted-foreground leading-relaxed">
							Will we achieve human-level artificial intelligence in our lifetime?
							Explore what the community thinks about the timeline and feasibility of AGI.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
							<Button onClick={handleFormClick} size="lg" className="text-lg px-8 h-14 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
								Take the Survey <ExternalLink className="ml-2 w-5 h-5" />
							</Button>
							<Button
								variant="outline"
								size="lg"
								className="text-lg px-8 h-14 rounded-full"
								onClick={async () => {
									try {
										await navigator.clipboard.writeText(window.location.href);
										// You might want to add a toast here
										alert("Link copied!");
									} catch (e) { console.error(e); }
								}}
							>
								Share Insights <Share2 className="ml-2 w-5 h-5" />
							</Button>
						</div>
					</motion.div>



					{isLoading ? (
						<div className="flex flex-col items-center justify-center h-[400px] space-y-4">
							<Loader2 className="w-12 h-12 animate-spin text-primary" />
							<p className="text-muted-foreground">Loading community data...</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">

							{/* Stats Cards */}
							<motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
								<Card className="bg-card/50 backdrop-blur border-primary/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
											<MessageSquare className="w-4 h-4" /> Total Responses
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-4xl font-bold">{totalResponses}</div>
										<p className="text-xs text-muted-foreground mt-1">
											Last updated: {new Date().toLocaleDateString()}
										</p>
									</CardContent>
								</Card>

								<div className="grid grid-cols-1 gap-4">
									{dateData.map((entry) => (
										<Card key={entry.name} className="bg-card/50 backdrop-blur border-primary/10">
											<CardHeader className="pb-2">
												<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
													<Calendar className="w-4 h-4" /> {entry.name} Prediction
												</CardTitle>
											</CardHeader>
											<CardContent>
												<div className="text-3xl font-bold text-primary">{entry.date}</div>
											</CardContent>
										</Card>
									))}
								</div>
							</motion.div>

							{/* Main Charts */}
							<motion.div variants={itemVariants} className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
								<Card className="bg-card/50 backdrop-blur border-primary/10">
									<CardHeader>
										<CardTitle>Are we in an AGI bubble?</CardTitle>
									</CardHeader>
									<CardContent className="flex flex-col items-center">
										<div className="w-[200px] h-[200px] relative">
											<ResponsiveContainer width="100%" height="100%">
												<PieChart>
													<Pie
														data={bubbleData}
														innerRadius={60}
														outerRadius={80}
														paddingAngle={5}
														dataKey="value"
														stroke="none"
													>
														{bubbleData.map((_, index) => (
															<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
														))}
													</Pie>
													<Tooltip
														contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
														itemStyle={{ color: 'hsl(var(--foreground))' }}
													/>
												</PieChart>
											</ResponsiveContainer>
											<div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
												<span className="text-3xl font-bold">
													{Math.round((bubbleData.find(d => d.name === "Yes")?.value || 0) / ((bubbleData.find(d => d.name === "Yes")?.value || 0) + (bubbleData.find(d => d.name === "No")?.value || 0) || 1) * 100)}%
												</span>
												<span className="text-xs text-muted-foreground uppercase tracking-wider">Yes</span>
											</div>
										</div>
										<div className="flex gap-6 mt-4">
											{bubbleData.map((entry, index) => (
												<div key={entry.name} className="flex items-center gap-2">
													<div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
													<span className="text-sm font-medium text-muted-foreground">{entry.name}</span>
												</div>
											))}
										</div>
									</CardContent>
								</Card>

								<Card className="bg-card/50 backdrop-blur border-primary/10">
									<CardHeader>
										<CardTitle>Is AGI achievable?</CardTitle>
									</CardHeader>
									<CardContent className="flex flex-col items-center">
										<div className="w-[200px] h-[200px] relative">
											<ResponsiveContainer width="100%" height="100%">
												<PieChart>
													<Pie
														data={achievableData}
														innerRadius={60}
														outerRadius={80}
														paddingAngle={5}
														dataKey="value"
														stroke="none"
													>
														{achievableData.map((_, index) => (
															<Cell key={`cell-${index}`} fill={COLORS_ACHIEVABLE[index % COLORS_ACHIEVABLE.length]} />
														))}
													</Pie>
													<Tooltip
														contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
														itemStyle={{ color: 'hsl(var(--foreground))' }}
													/>
												</PieChart>
											</ResponsiveContainer>
											<div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
												<span className="text-3xl font-bold">
													{Math.round((achievableData.find(d => d.name === "Yes")?.value || 0) / ((achievableData.find(d => d.name === "Yes")?.value || 0) + (achievableData.find(d => d.name === "No")?.value || 0) || 1) * 100)}%
												</span>
												<span className="text-xs text-muted-foreground uppercase tracking-wider">Yes</span>
											</div>
										</div>
										<div className="flex gap-6 mt-4">
											{achievableData.map((entry, index) => (
												<div key={entry.name} className="flex items-center gap-2">
													<div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS_ACHIEVABLE[index % COLORS_ACHIEVABLE.length] }} />
													<span className="text-sm font-medium text-muted-foreground">{entry.name}</span>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</motion.div>

							{/* Analysis Section */}
							<motion.div variants={itemVariants} className="lg:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-6">
								<ConsensusMeter
									title="AGI Bubble"
									yesCount={bubbleData.find(d => d.name === "Yes")?.value || 0}
									noCount={bubbleData.find(d => d.name === "No")?.value || 0}
								/>
								<ConsensusMeter
									title="Achievability"
									yesCount={achievableData.find(d => d.name === "Yes")?.value || 0}
									noCount={achievableData.find(d => d.name === "No")?.value || 0}
								/>
								<PredictionSpread
									earliest={predictionStats.earliest}
									latest={predictionStats.latest}
									median={predictionStats.median}
								/>
							</motion.div>

							{/* Advanced Analysis Section */}
							<motion.div variants={itemVariants} className="lg:col-span-6 grid grid-cols-1 md:grid-cols-3 gap-6">
								<Card className="bg-card/50 backdrop-blur border-primary/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground">The Golden Year</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-3xl font-bold text-primary">{advancedStats.goldenYear || "..."}</div>
										<p className="text-xs text-muted-foreground mt-1">Most predicted year</p>
									</CardContent>
								</Card>
								<Card className="bg-card/50 backdrop-blur border-primary/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground">Confidence Score</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="text-3xl font-bold text-primary">{advancedStats.confidenceScore}%</div>
										<div className="w-full bg-secondary h-1.5 mt-2 rounded-full overflow-hidden">
											<div className="bg-primary h-full rounded-full" style={{ width: `${advancedStats.confidenceScore}%` }} />
										</div>
										<p className="text-xs text-muted-foreground mt-1">Based on prediction spread</p>
									</CardContent>
								</Card>
								<Card className="bg-card/50 backdrop-blur border-primary/10">
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-muted-foreground">Decade Horizon</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											{advancedStats.decadeData.slice(0, 3).map((d) => (
												<div key={d.name} className="flex items-center justify-between text-sm">
													<span className="text-muted-foreground">{d.name}</span>
													<div className="flex items-center gap-2 flex-1 mx-3">
														<div className="h-1.5 bg-secondary rounded-full flex-1 overflow-hidden">
															<div className="h-full bg-primary/70 rounded-full" style={{ width: `${(d.value / totalResponses) * 100}%` }} />
														</div>
													</div>
													<span className="font-medium">{d.value}</span>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							</motion.div>

							{/* Timeline Chart */}
							<motion.div variants={itemVariants} className="lg:col-span-6">
								<Card className="bg-card/50 backdrop-blur border-primary/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<TrendingUp className="w-5 h-5" /> AGI Timeline Distribution
										</CardTitle>
										<CardDescription>When does the community predict AGI will arrive?</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="h-[300px] w-full">
											<ResponsiveContainer width="100%" height="100%">
												<BarChart data={timelineData}>
													<XAxis
														dataKey="year"
														stroke="hsl(var(--muted-foreground))"
														fontSize={12}
														tickLine={false}
														axisLine={false}
													/>
													<YAxis
														stroke="hsl(var(--muted-foreground))"
														fontSize={12}
														tickLine={false}
														axisLine={false}
													/>
													<Tooltip
														cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
														contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
														itemStyle={{ color: 'hsl(var(--foreground))' }}
													/>
													<Bar
														dataKey="count"
														fill="hsl(var(--primary))"
														radius={[4, 4, 0, 0]}
													/>
												</BarChart>
											</ResponsiveContainer>
										</div>
									</CardContent>
								</Card>
							</motion.div>

							{/* Word Cloud */}
							<motion.div variants={itemVariants} className="lg:col-span-6">
								<Card className="bg-card/50 backdrop-blur border-primary/10">
									<CardHeader>
										<CardTitle>Community Thoughts</CardTitle>
										<CardDescription>Most frequently mentioned words in comments</CardDescription>
									</CardHeader>
									<CardContent>
										<div id="word-cloud" className="w-full flex justify-center overflow-hidden" />
									</CardContent>
								</Card>
							</motion.div>
						</div>
					)}
				</motion.div>
			</main>
			<Footer />
		</div>
	);
}

export default App;
