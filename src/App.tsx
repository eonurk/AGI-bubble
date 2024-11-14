import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell } from "recharts";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { ResponsiveContainer } from "recharts";
import * as d3 from "d3";
import cloud from "d3-cloud";

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
		{ name: "Yes", value: 2 },
		{ name: "No", value: 6 },
	]);

	const [achievableData, setAchievableData] = useState([
		{ name: "Yes", value: 8 },
		{ name: "No", value: 0 },
	]);

	const [dateData, setDateData] = useState([
		{ name: "Earliest", date: "1989" },
		{ name: "Median", date: "2034" },
		{ name: "Latest", date: "2074" },
	]);

	const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);

	const [isLoading, setIsLoading] = useState(true);
	const [totalResponses, setTotalResponses] = useState(0);
	const [wordCloudData, setWordCloudData] = useState<WordData[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			try {
				const response = await fetch(
					"https://docs.google.com/spreadsheets/d/e/2PACX-1vS7Zdo-njYucXO4WdaTWfoYMBreq6FcmSAW63JC81yaTfSdSMknODd-oFBzR0lCtTxOGns_utWI-5J0/pub?gid=24394597&single=true&output=csv"
				);

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const csvText = await response.text();
				const rows = csvText.split("\n").map((row) => row.split(","));
				console.log(rows);
				setTotalResponses(parseInt(rows[1][1]) || 0);
				// Parse the summary data
				const bubbleYes = parseInt(rows[2][1]) || 0;
				const bubbleNo = parseInt(rows[3][1]) || 0;
				const achievableYes = parseInt(rows[4][1]) || 0;
				const achievableNo = parseInt(rows[5][1]) || 0;

				// Parse dates with more careful handling
				const earliestDate =
					rows[6] && rows[6][1]
						? rows[6][1].trim().match(/\d{4}/)?.[0] || "N/A"
						: "N/A";
				const latestDate =
					rows[7] && rows[7][1]
						? rows[7][1].trim().match(/\d{4}/)?.[0] || "N/A"
						: "N/A";
				const medianDate =
					rows[8] && rows[8][1]
						? rows[8][1].trim().match(/\d{4}/)?.[0] || "N/A"
						: "N/A";

				const remarks = rows[12][1] || "";
				console.log("remarks:", remarks);
				// Process remarks for word cloud
				const words = remarks
					.toLowerCase()
					.split(/\W+/)
					.filter(
						(word) =>
							word.length > 3 &&
							!["and", "the", "this", "that", "with", "will"].includes(word)
					);

				const wordCount: { [key: string]: number } = {};
				words.forEach((word) => {
					wordCount[word] = (wordCount[word] || 0) + 1;
				});

				// Convert to array and sort by frequency
				const wordData = Object.entries(wordCount)
					.map(([text, count]) => ({
						text,
						size: 10 + count * 10, // Scale the size based on frequency
					}))
					.sort((a, b) => b.size - a.size)
					.slice(0, 50); // Take top 50 words

				setWordCloudData(wordData);

				setBubbleData([
					{ name: "Yes", value: bubbleYes },
					{ name: "No", value: bubbleNo },
				]);

				setAchievableData([
					{ name: "Yes", value: achievableYes },
					{ name: "No", value: achievableNo },
				]);

				setDateData([
					{ name: "Earliest", date: earliestDate },
					{ name: "Median", date: medianDate },
					{ name: "Latest", date: latestDate },
				]);

				// Process timeline data from row 11 (which contains the years)
				const years = rows[11]
					.slice(1) // Skip the "Years" label
					.map((year) => parseInt(year.trim()))
					.filter((year) => !isNaN(year))
					.sort((a, b) => a - b);

				// Create histogram data with year-by-year counts
				const yearCounts: { [key: number]: number } = {};

				// Count occurrences of each year
				years.forEach((year) => {
					yearCounts[year] = (yearCounts[year] || 0) + 1;
				});

				// Convert to timeline data format
				setTimelineData(
					Object.entries(yearCounts).map(([year, count]) => ({
						year: parseInt(year),
						count: count,
					}))
				);
			} catch (error) {
				console.error("Error fetching data:", error);
				// Set default values in case of error
				setBubbleData([
					{ name: "Yes", value: 0 },
					{ name: "No", value: 0 },
				]);
				setAchievableData([
					{ name: "Yes", value: 0 },
					{ name: "No", value: 0 },
				]);
				setDateData([
					{ name: "Earliest", date: "N/A" },
					{ name: "Median", date: "N/A" },
					{ name: "Latest", date: "N/A" },
				]);
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

		// Clear any existing word cloud
		d3.select("#word-cloud").selectAll("*").remove();

		const width = window.innerWidth < 768 ? 300 : 800;
		const height = window.innerWidth < 768 ? 300 : 400;

		const layout = cloud().size([width, height]);

		layout
			.words(wordCloudData)
			.padding(5)
			.rotate(() => (Math.random() < 0.5 ? 0 : 90))
			.font("Impact")
			.fontSize((d: unknown) => (d as WordData).size)
			.on("end", draw);

		layout.start();

		function draw(words: WordData[]) {
			const svg = d3
				.select("#word-cloud")
				.append("svg")
				.attr("width", "100%")
				.attr("height", height)
				.attr("viewBox", `0 0 ${width} ${height}`)
				.append("g")
				.attr("transform", `translate(${width / 2},${height / 2})`);

			// Define a better color palette
			const colors = [
				"#2563eb", // Blue
				"#7c3aed", // Purple
				"#db2777", // Pink
				"#059669", // Emerald
				"#0891b2", // Cyan
				"#4f46e5", // Indigo
				"#6366f1", // Violet
				"#0ea5e9", // Sky
			];

			svg
				.selectAll("text")
				.data(words)
				.enter()
				.append("text")
				.style("font-size", (d) => `${d.size}px`)
				.style("font-family", "'Inter', 'Helvetica', sans-serif") // Changed from Impact
				.style("fill", () => colors[Math.floor(Math.random() * colors.length)]) // Using our new palette
				.style("font-weight", "500") // Added for better readability
				.attr("text-anchor", "middle")
				.attr(
					"transform",
					(d: unknown) =>
						`translate(${(d as WordData).x},${(d as WordData).y})rotate(${
							(d as WordData).rotate
						})`
				)
				.text((d) => (d as WordData).text);
		}
	}, [wordCloudData]);

	const COLORS = ["#0088FE", "#FF8042"];

	const handleFormClick = () => {
		window.open("https://forms.gle/Y2L2mpNV78Xtax9h6", "_blank");
	};

	return (
		<div className="flex flex-col items-center min-h-screen bg-background p-4">
			<Card className="max-w-4xl w-full mx-4 p-4 mt-4">
				<CardHeader>
					<div className="flex justify-between items-center">
						<h2 className="text-2xl font-bold">
							<Button
								onClick={handleFormClick}
								className="text-lg py-5 mb-2 "
								size="lg"
								variant="default"
							>
								<span className="mr-2 ">AGI Bubble Survey →</span>
							</Button>
						</h2>
					</div>
					<div className="text-lg">
						Will we achieve human-level artificial intelligence in our lifetime?
						Join others in sharing your prediction and see what the community
						thinks about the future of AI.
					</div>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="flex justify-center items-center h-[300px]">
							Loading data...
						</div>
					) : (
						<>
							<div className="mb-4 text-sm text-muted-foreground">
								Total Responses: {totalResponses || "N/A"} <br />
								Last Updated:{" "}
								{new Date().toLocaleString(undefined, {
									year: "numeric",
									month: "short",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit",
									hour12: true,
								})}
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<h3 className="text-lg font-semibold mb-2">
										Are we in an AGI bubble?
									</h3>
									<PieChart width={300} height={300}>
										<Pie
											data={bubbleData}
											cx={150}
											cy={150}
											labelLine={false}
											label={({ name, value }) => `${name}: ${value}`}
											outerRadius={80}
											fill="#8884d8"
											dataKey="value"
										>
											{bubbleData.map((_entry, index) => (
												<Cell
													key={`cell-${index}`}
													fill={COLORS[index % COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</div>
								<div>
									<h3 className="text-lg font-semibold mb-2">
										Is AGI achievable?
									</h3>
									<PieChart width={300} height={300}>
										<Pie
											data={achievableData}
											cx={150}
											cy={150}
											labelLine={false}
											label={({ name, value }) => `${name}: ${value}`}
											outerRadius={80}
											fill="#8884d8"
											dataKey="value"
										>
											{achievableData.map((_entry, index) => (
												<Cell
													key={`cell-${index}`}
													fill={COLORS[index % COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</div>
							</div>
						</>
					)}

					<h3 className="text-lg font-semibold mb-2">Predicted AGI Timeline</h3>

					<div className="grid grid-cols-3 gap-4 mt-4">
						{dateData.map((entry) => (
							<div key={entry.name} className="text-center">
								<div className="font-medium">{entry.name}</div>
								<div className="text-2xl font-bold">{entry.date}</div>
							</div>
						))}
					</div>

					<div className="mt-8">
						<h3 className="text-lg font-semibold mb-2">
							AGI Timeline Distribution
						</h3>
						<div className="flex justify-center w-full mt-6 overflow-x-auto">
							<ResponsiveContainer width="100%" height={300} minWidth={300}>
								<BarChart data={timelineData}>
									<XAxis
										dataKey="year"
										label={{ value: "Year", position: "bottom" }}
										domain={["dataMin", "dataMax"]}
										type="number"
										ticks={timelineData.map((d) => d.year)}
									/>
									<YAxis
										label={{
											angle: -90,
											position: "left",
										}}
									/>
									<Tooltip
										labelFormatter={(year) => `Year: ${year}`}
										formatter={(value) => [`${value} responses`]}
									/>
									<Bar dataKey="count" fill="#8884d8" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>

					<div className="mt-8">
						<h3 className="text-lg font-semibold mb-2">
							Most Frequently Mentioned Words
						</h3>
						<div id="word-cloud" className="w-full overflow-hidden" />
					</div>
				</CardContent>
			</Card>
			<Button
				onClick={handleFormClick}
				className="mt-6 w-full max-w-4xl text-lg py-6"
				size="lg"
				variant="default"
			>
				<span className="mr-2 animate-pulse">Take the Survey →</span>
			</Button>

			<Button
				onClick={async () => {
					try {
						if (navigator.share) {
							await navigator.share({
								title: "AGI Bubble Survey",
								text: "Check out this survey about AGI predictions!",
								url: window.location.href,
							});
						} else {
							// Fallback to copying to clipboard
							await navigator.clipboard.writeText(window.location.href);
							alert("Link copied to clipboard!");
						}
					} catch (error) {
						console.error("Error sharing:", error);
						// Fallback to copying to clipboard if sharing fails
						try {
							await navigator.clipboard.writeText(window.location.href);
							alert("Link copied to clipboard!");
						} catch (err) {
							console.error("Error copying to clipboard:", err);
						}
					}
				}}
				className="mt-4 w-full max-w-4xl text-lg py-6 bg-blue-500 hover:bg-blue-600"
				size="lg"
				variant="default"
			>
				<span className="mr-2">Share</span>
			</Button>

			<div className="text-sm mt-4">
				Created by{" "}
				<a href="https://eonurk.com" target="_blank" rel="noopener noreferrer">
					@eonurk
				</a>
			</div>
		</div>
	);
}

export default App;
