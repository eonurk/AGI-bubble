import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell } from "recharts";
import { BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { ResponsiveContainer } from "recharts";

type TimelineDataPoint = {
	year: number;
	count: number;
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

	const COLORS = ["#0088FE", "#FF8042"];

	const handleFormClick = () => {
		window.open("https://forms.gle/Y2L2mpNV78Xtax9h6", "_blank");
	};

	return (
		<div className="flex flex-col items-center min-h-screen bg-background p-4">
			<Card className="max-w-4xl w-full mx-4 p-4 mt-4">
				<CardHeader>
					<h2 className="text-2xl font-bold">AGI Bubble Survey</h2>
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
