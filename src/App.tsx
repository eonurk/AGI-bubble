import { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
} from "recharts";
import * as d3 from "d3";
import cloud from "d3-cloud";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConsensusMeter } from "@/components/ConsensusMeter";
import { PredictionSpread } from "@/components/PredictionSpread";
import { Oracle } from "@/components/Oracle";
import { Countdown } from "@/components/Countdown";
import { NewsTicker } from "@/components/NewsTicker";
import { CallToAction } from "@/components/CallToAction";
import { ErdosContributionsSnapshot } from "@/components/ErdosContributionsSnapshot";
import {
	Loader2,
	Share2,
	ExternalLink,
	TrendingUp,
	Calendar,
	MessageSquare,
	X,
} from "lucide-react";

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
	const [allRemarks, setAllRemarks] = useState<string[]>([]);
	const [selectedWord, setSelectedWord] = useState<string | null>(null);
	const [prophecies, setProphecies] = useState<
		{ year: number; remark: string }[]
	>([]);
	const [medianDateStr, setMedianDateStr] = useState<string>("");

	// New state for analysis components
	const [predictionStats, setPredictionStats] = useState({
		earliest: 0,
		latest: 0,
		median: 0,
	});

	// Advanced Analysis State
	const [advancedStats, setAdvancedStats] = useState({
		goldenYear: 0,
		confidenceScore: 0,
		decadeData: [] as { name: string; value: number }[],
	});

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const response = await fetch(
					"https://docs.google.com/spreadsheets/d/e/2PACX-1vS7Zdo-njYucXO4WdaTWfoYMBreq6FcmSAW63JC81yaTfSdSMknODd-oFBzR0lCtTxOGns_utWI-5J0/pub?gid=24394597&single=true&output=csv",
				);

				if (!response.ok)
					throw new Error(`HTTP error! status: ${response.status}`);

				const csvText = await response.text();
				const rows = csvText.split("\n").map((row) => row.split(","));

				setTotalResponses(parseInt(rows[1][1]) || 0);

				const bubbleYes = parseInt(rows[2][1]) || 0;
				const bubbleNo = parseInt(rows[3][1]) || 0;
				const achievableYes = parseInt(rows[4][1]) || 0;
				const achievableNo = parseInt(rows[5][1]) || 0;

				const getYear = (row: string[]) =>
					row && row[1] ? row[1].trim().match(/\d{4}/)?.[0] || "N/A" : "N/A";
				const earliestYear = parseInt(getYear(rows[6]));
				const latestYear = parseInt(getYear(rows[7]));
				const medianYear = parseInt(getYear(rows[8]));

				// Capture exact median date string (Row 8, Column 1)
				// Assuming format is present, otherwise fallback to standard year logic
				if (rows[8] && rows[8][1]) {
					setMedianDateStr(rows[8][1]);
				}

				setDateData([
					{
						name: "Earliest",
						date: isNaN(earliestYear) ? "N/A" : earliestYear.toString(),
					},
					{
						name: "Median",
						date: isNaN(medianYear) ? "N/A" : medianYear.toString(),
					},
					{
						name: "Latest",
						date: isNaN(latestYear) ? "N/A" : latestYear.toString(),
					},
				]);

				setPredictionStats({
					earliest: isNaN(earliestYear)
						? new Date().getFullYear()
						: earliestYear,
					latest: isNaN(latestYear)
						? new Date().getFullYear() + 10
						: latestYear,
					median: isNaN(medianYear) ? new Date().getFullYear() + 5 : medianYear,
				});

				setAllRemarks(
					rows[12].slice(1).filter((r) => r && r.trim().length > 0),
				);

				const remarks = rows[12].slice(1).join(" ");
				const words = remarks
					.toLowerCase()
					.split(/\W+/)
					.filter(
						(w) =>
							w.length > 3 &&
							![
								"and",
								"the",
								"this",
								"that",
								"with",
								"will",
								"have",
								"from",
								"some",
								"more",
								"much",
								"they",
								"just",
								"about",
								"what",
								"like",
								"which",
								"there",
								"their",
							].includes(w),
					);

				const wordCount: { [key: string]: number } = {};
				words.forEach((w) => (wordCount[w] = (wordCount[w] || 0) + 1));

				setWordCloudData(
					Object.entries(wordCount)
						.map(([text, count]) => ({ text, size: 10 + count * 10 }))
						.sort((a, b) => b.size - a.size)
						.slice(0, 20),
				);

				setBubbleData([
					{ name: "Yes", value: bubbleYes },
					{ name: "No", value: bubbleNo },
				]);

				setAchievableData([
					{ name: "Yes", value: achievableYes },
					{ name: "No", value: achievableNo },
				]);

				const years = rows[11]
					.slice(1)
					.map((y) => parseInt(y.trim()))
					.filter((y) => !isNaN(y))
					.sort((a, b) => a - b);

				// Prepare Oracle Data (Paired Years & Remarks)
				const rawYearList = rows[11].slice(1);
				const rawRemarkList = rows[12].slice(1);
				const validProphecies = rawYearList
					.map((y, i) => ({
						year: parseInt(y.trim()),
						remark: rawRemarkList[i],
					}))
					.filter(
						(p) => !isNaN(p.year) && p.remark && p.remark.trim().length > 5,
					); // Filter for valid years and non-empty remarks
				setProphecies(validProphecies);

				const yearCounts: { [key: number]: number } = {};
				years.forEach((y) => (yearCounts[y] = (yearCounts[y] || 0) + 1));

				setTimelineData(
					Object.entries(yearCounts).map(([year, count]) => ({
						year: parseInt(year),
						count,
					})),
				);

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
					const variance =
						years.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / years.length;
					const stdDev = Math.sqrt(variance);
					// Map StdDev to 0-100. Assuming StdDev > 20 is 0 confidence.
					const confidence = Math.max(
						0,
						Math.min(100, Math.round(100 - stdDev * 4)),
					);

					// 3. Decade Horizon
					const decades: { [key: string]: number } = {};
					years.forEach((y) => {
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
						decadeData,
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

		const container = document.getElementById("word-cloud");
		if (!container) return;

		const isMobile = window.innerWidth < 768;
		const containerWidth = Math.max(260, Math.floor(container.clientWidth || 320));
		const width = isMobile
			? Math.min(containerWidth - 10, 360)
			: Math.min(containerWidth - 12, 620);
		const height = isMobile ? 220 : 300;

		cloud()
			.size([width, height])
			.words(wordCloudData)
			.padding(5)
			.rotate(() => (isMobile ? 0 : (Math.random() < 0.2 ? 90 : 0)))
			.font("Space Grotesk")
			.fontSize((d: any) => (isMobile ? Math.min(d.size, 28) : Math.min(d.size, 42)))
			.on("end", draw)
			.start();

		function draw(words: WordData[]) {
			const svg = d3
				.select("#word-cloud")
				.append("svg")
				.attr("width", "100%")
				.attr("height", height)
				.attr("viewBox", `0 0 ${width} ${height}`)
				.append("g")
				.attr("transform", `translate(${width / 2},${height / 2})`);

			const colors = [
				"#bae6fd",
				"#a7f3d0",
				"#bfdbfe",
				"#ddd6fe",
				"#fecdd3",
				"#fbcfe8",
				"#fde68a",
				"#fed7aa",
				"#cbd5e1",
			];

			svg
				.selectAll("text")
				.data(words)
				.enter()
				.append("text")
				.style("font-size", (d) => `${d.size}px`)
				.style("font-family", "'Space Grotesk', 'Sora', 'Avenir Next', 'Segoe UI', sans-serif")
				.style("fill", () => colors[Math.floor(Math.random() * colors.length)])
				.style("font-weight", "500")
				.attr("text-anchor", "middle")
				.attr(
					"transform",
					(d: any) => `translate(${d.x},${d.y})rotate(${d.rotate})`,
				)
				.text((d) => d.text)
				.style("cursor", "pointer")
				.on("click", (_event: any, d: any) => {
					setSelectedWord(d.text);
				})
				.on("mouseover", (event: any) => {
					d3.select(event.currentTarget).style("opacity", 0.7);
				})
				.on("mouseout", (event: any) => {
					d3.select(event.currentTarget).style("opacity", 1);
				});
		}
	}, [wordCloudData]);

	const COLORS = ["#3b82f6", "#1e293b"]; // Primary Blue & Dark Slate
	const COLORS_ACHIEVABLE = ["#10b981", "#1e293b"]; // Emerald & Dark Slate

	const handleFormClick = () =>
		window.open("https://forms.gle/Y2L2mpNV78Xtax9h6", "_blank");

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: { y: 0, opacity: 1 },
	};

	return (
		<div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/20">
			<Header />

			<main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-7xl">
				<motion.div
					initial="hidden"
					animate="visible"
					variants={containerVariants}
					className="space-y-12"
				>
					{/* 1) Erdős Snapshot */}
					<motion.div variants={itemVariants}>
						<ErdosContributionsSnapshot />
					</motion.div>

					{/* 2) AGI Intro */}
					<motion.div
						variants={itemVariants}
						className="text-center space-y-6 max-w-3xl mx-auto"
					></motion.div>

					{/* 3) Live AGI Pulse */}
					<motion.section variants={itemVariants} className="space-y-5">
						<div className="space-y-1">
							<h2 className="text-2xl md:text-3xl font-bold tracking-tight">
								Live AGI Pulse
							</h2>
							<p className="text-muted-foreground">
								Current community expectations and countdown to the median
								prediction.
							</p>
						</div>
						<Countdown targetDate={medianDateStr} />
						{isLoading ? (
							<div className="flex flex-col items-center justify-center h-[180px] space-y-3">
								<Loader2 className="w-8 h-8 animate-spin text-primary" />
								<p className="text-muted-foreground">Loading pulse data...</p>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
								{dateData.map((entry) => (
									<Card
										key={entry.name}
										className="bg-card/50 backdrop-blur border-primary/10"
									>
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
												<Calendar className="w-4 h-4" /> {entry.name} Prediction
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-3xl font-bold text-primary">
												{entry.date}
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}

						<p className="text-xl text-muted-foreground leading-relaxed text-center pt-6">
							Will we achieve human-level artificial intelligence in our
							lifetime?
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
							<Button
								onClick={handleFormClick}
								size="lg"
								className="text-lg px-8 h-14 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
							>
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
									} catch (e) {
										console.error(e);
									}
								}}
							>
								Share Insights <Share2 className="ml-2 w-5 h-5" />
							</Button>
						</div>
					</motion.section>

					{isLoading ? (
						<div className="flex flex-col items-center justify-center h-[240px] space-y-4">
							<Loader2 className="w-10 h-10 animate-spin text-primary" />
							<p className="text-muted-foreground">
								Loading insight sections...
							</p>
						</div>
					) : (
						<>
							{/* 4) Core Questions */}
							<motion.section variants={itemVariants} className="space-y-5">
								<div className="space-y-1">
									<h2 className="text-2xl md:text-3xl font-bold tracking-tight">
										Core Questions
									</h2>
									<p className="text-muted-foreground">
										How the community answers the two central AGI questions.
									</p>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
																<Cell
																	key={`cell-${index}`}
																	fill={COLORS[index % COLORS.length]}
																/>
															))}
														</Pie>
														<Tooltip
															contentStyle={{
																backgroundColor: "hsl(var(--card))",
																borderColor: "hsl(var(--border))",
																borderRadius: "8px",
															}}
															itemStyle={{ color: "hsl(var(--foreground))" }}
														/>
													</PieChart>
												</ResponsiveContainer>
												<div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
													<span className="text-3xl font-bold">
														{Math.round(
															((bubbleData.find((d) => d.name === "Yes")
																?.value || 0) /
																((bubbleData.find((d) => d.name === "Yes")
																	?.value || 0) +
																	(bubbleData.find((d) => d.name === "No")
																		?.value || 0) || 1)) *
																100,
														)}
														%
													</span>
													<span className="text-xs text-muted-foreground uppercase tracking-wider">
														Yes
													</span>
												</div>
											</div>
											<div className="flex gap-6 mt-4">
												{bubbleData.map((entry, index) => (
													<div
														key={entry.name}
														className="flex items-center gap-2"
													>
														<div
															className="w-3 h-3 rounded-full"
															style={{
																backgroundColor: COLORS[index % COLORS.length],
															}}
														/>
														<span className="text-sm font-medium text-muted-foreground">
															{entry.name}
														</span>
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
																<Cell
																	key={`cell-${index}`}
																	fill={
																		COLORS_ACHIEVABLE[
																			index % COLORS_ACHIEVABLE.length
																		]
																	}
																/>
															))}
														</Pie>
														<Tooltip
															contentStyle={{
																backgroundColor: "hsl(var(--card))",
																borderColor: "hsl(var(--border))",
																borderRadius: "8px",
															}}
															itemStyle={{ color: "hsl(var(--foreground))" }}
														/>
													</PieChart>
												</ResponsiveContainer>
												<div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
													<span className="text-3xl font-bold">
														{Math.round(
															((achievableData.find((d) => d.name === "Yes")
																?.value || 0) /
																((achievableData.find((d) => d.name === "Yes")
																	?.value || 0) +
																	(achievableData.find((d) => d.name === "No")
																		?.value || 0) || 1)) *
																100,
														)}
														%
													</span>
													<span className="text-xs text-muted-foreground uppercase tracking-wider">
														Yes
													</span>
												</div>
											</div>
											<div className="flex gap-6 mt-4">
												{achievableData.map((entry, index) => (
													<div
														key={entry.name}
														className="flex items-center gap-2"
													>
														<div
															className="w-3 h-3 rounded-full"
															style={{
																backgroundColor:
																	COLORS_ACHIEVABLE[
																		index % COLORS_ACHIEVABLE.length
																	],
															}}
														/>
														<span className="text-sm font-medium text-muted-foreground">
															{entry.name}
														</span>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<ConsensusMeter
										title="AGI Bubble"
										yesCount={
											bubbleData.find((d) => d.name === "Yes")?.value || 0
										}
										noCount={
											bubbleData.find((d) => d.name === "No")?.value || 0
										}
									/>
									<ConsensusMeter
										title="Achievability"
										yesCount={
											achievableData.find((d) => d.name === "Yes")?.value || 0
										}
										noCount={
											achievableData.find((d) => d.name === "No")?.value || 0
										}
									/>
									<PredictionSpread
										earliest={predictionStats.earliest}
										latest={predictionStats.latest}
										median={predictionStats.median}
									/>
								</div>
							</motion.section>

							{/* 5) Forecast Intelligence */}
							<motion.section variants={itemVariants} className="space-y-5">
								<div className="space-y-1">
									<h2 className="text-2xl md:text-3xl font-bold tracking-tight">
										Forecast Intelligence
									</h2>
									<p className="text-muted-foreground">
										Distribution and interactive tools for comparing future AGI
										timelines.
									</p>
								</div>
								<Card className="bg-card/50 backdrop-blur border-primary/10">
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<TrendingUp className="w-5 h-5" /> AGI Timeline
											Distribution
										</CardTitle>
										<CardDescription>
											When does the community predict AGI will arrive?
										</CardDescription>
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
														cursor={{ fill: "hsl(var(--muted)/0.2)" }}
														contentStyle={{
															backgroundColor: "hsl(var(--card))",
															borderColor: "hsl(var(--border))",
															borderRadius: "8px",
														}}
														itemStyle={{ color: "hsl(var(--foreground))" }}
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

								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<Card className="bg-card/50 backdrop-blur border-primary/10">
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium text-muted-foreground">
												The Golden Year
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-3xl font-bold text-primary">
												{advancedStats.goldenYear || "..."}
											</div>
											<p className="text-xs text-muted-foreground mt-1">
												Most predicted year
											</p>
										</CardContent>
									</Card>
									<Card className="bg-card/50 backdrop-blur border-primary/10">
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium text-muted-foreground">
												Confidence Score
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="text-3xl font-bold text-primary">
												{advancedStats.confidenceScore}%
											</div>
											<div className="w-full bg-secondary h-1.5 mt-2 rounded-full overflow-hidden">
												<div
													className="bg-primary h-full rounded-full"
													style={{ width: `${advancedStats.confidenceScore}%` }}
												/>
											</div>
											<p className="text-xs text-muted-foreground mt-1">
												Based on prediction spread
											</p>
										</CardContent>
									</Card>
									<Card className="bg-card/50 backdrop-blur border-primary/10">
										<CardHeader className="pb-2">
											<CardTitle className="text-sm font-medium text-muted-foreground">
												Decade Horizon
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
												{advancedStats.decadeData.slice(0, 3).map((d) => (
													<div
														key={d.name}
														className="flex items-center justify-between text-sm"
													>
														<span className="text-muted-foreground">
															{d.name}
														</span>
														<div className="flex items-center gap-2 flex-1 mx-3">
															<div className="h-1.5 bg-secondary rounded-full flex-1 overflow-hidden">
																<div
																	className="h-full bg-primary/70 rounded-full"
																	style={{
																		width: `${(d.value / totalResponses) * 100}%`,
																	}}
																/>
															</div>
														</div>
														<span className="font-medium">{d.value}</span>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								</div>
							</motion.section>

							{/* 6) Community Reasoning */}
							<motion.section variants={itemVariants} className="space-y-5">
								<div className="space-y-1">
									<h2 className="text-2xl md:text-3xl font-bold tracking-tight">
										Community Reasoning
									</h2>
									<p className="text-muted-foreground">
										Narratives, comments, and model-generated reasoning from
										participants.
									</p>
								</div>
								<NewsTicker prophecies={prophecies} />
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<Oracle prophecies={prophecies} />
									<Card className="bg-card/50 backdrop-blur border-primary/10 h-full">
										<CardHeader>
											<CardTitle>Community Thoughts</CardTitle>
											<CardDescription>
												Most frequently mentioned words in comments
											</CardDescription>
										</CardHeader>
										<CardContent>
											<div
												id="word-cloud"
												className="w-full h-[220px] md:h-[300px] flex items-center justify-center overflow-hidden rounded-lg border border-primary/10 bg-background/40 px-1 md:px-2"
											/>
										</CardContent>
									</Card>
								</div>
							</motion.section>
						</>
					)}
				</motion.div>
			</main>

			<CallToAction />

			<Footer />

			{/* Word Context Modal */}
			{selectedWord && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center p-4"
					onClick={() => setSelectedWord(null)}
				>
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						className="bg-card border border-border w-full max-w-2xl max-h-[80vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
							<h3 className="font-bold text-lg">
								Mentions of{" "}
								<span className="text-primary">"{selectedWord}"</span>
							</h3>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setSelectedWord(null)}
							>
								<X className="w-5 h-5" />
							</Button>
						</div>
						<div className="p-4 overflow-y-auto space-y-3">
							{allRemarks
								.filter((r) =>
									r.toLowerCase().includes(selectedWord.toLowerCase()),
								)
								.map((remark, i) => (
									<div
										key={i}
										className="p-3 rounded-lg bg-secondary/30 border border-border/50 text-sm leading-relaxed"
									>
										{remark
											.split(new RegExp(`(${selectedWord})`, "gi"))
											.map((part, j) =>
												part.toLowerCase() === selectedWord.toLowerCase() ? (
													<span
														key={j}
														className="bg-primary/20 text-primary font-bold px-1 rounded"
													>
														{part}
													</span>
												) : (
													part
												),
											)}
									</div>
								))}
							{allRemarks.filter((r) =>
								r.toLowerCase().includes(selectedWord.toLowerCase()),
							).length === 0 && (
								<p className="text-muted-foreground text-center py-8">
									No specific comments found.
								</p>
							)}
						</div>
					</motion.div>
				</div>
			)}
		</div>
	);
}

export default App;
