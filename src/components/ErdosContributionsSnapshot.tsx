import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CategoryKey = "incorrect" | "partial" | "full";

type Contribution = {
	date: Date;
	category: CategoryKey;
	sectionKey: string;
};

type ChartPoint = {
	timestamp: number;
	weekLabel: string;
	incorrect: number;
	partial: number;
	full: number;
	total: number;
};

type SnapshotStats = {
	total: number;
	incorrect: number;
	partial: number;
	full: number;
};

type SectionSnapshot = {
	key: string;
	title: string;
	contributions: Contribution[];
};

type SectionAggregate = {
	key: string;
	title: string;
	problemIds: Set<string>;
	contributions: Contribution[];
};

type ParsedSnapshot = {
	sections: SectionSnapshot[];
	contributions: Contribution[];
};

type TabSeries = {
	key: string;
	label: string;
	title: string;
	points: ChartPoint[];
	stats: SnapshotStats;
	latestDate: Date | null;
};

const WIKI_RAW_URL =
	"https://raw.githubusercontent.com/wiki/teorth/erdosproblems/AI-contributions-to-Erd%C5%91s-problems.md";
const WIKI_PAGE_URL =
	"https://github.com/teorth/erdosproblems/wiki/AI-contributions-to-Erd%C5%91s-problems";
const TWEET_URL = "https://x.com/eonurkara/status/2022590635530756227?s=20";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const monthMap: Record<string, number> = {
	jan: 0,
	feb: 1,
	mar: 2,
	apr: 3,
	may: 4,
	jun: 5,
	jul: 6,
	aug: 7,
	sep: 8,
	oct: 9,
	nov: 10,
	dec: 11,
};

const tooltipDateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	timeZone: "UTC",
});

const weekLabelFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	timeZone: "UTC",
});

function formatWeekLabel(value: string | number): string {
	const parsedDate =
		typeof value === "string"
			? new Date(`${value}T00:00:00Z`)
			: new Date(value);
	return Number.isFinite(parsedDate.getTime())
		? weekLabelFormatter.format(parsedDate)
		: String(value);
}

function formatTooltipLabel(value: unknown): string {
	if (typeof value === "string") {
		const parsedDate = new Date(`${value}T00:00:00Z`);
		return Number.isFinite(parsedDate.getTime())
			? tooltipDateFormatter.format(parsedDate)
			: value;
	}
	if (typeof value === "number") {
		const parsedDate = new Date(value);
		return Number.isFinite(parsedDate.getTime())
			? tooltipDateFormatter.format(parsedDate)
			: String(value);
	}
	return String(value);
}

function buildMobileXAxisTicks(points: ChartPoint[]): string[] | undefined {
	if (points.length <= 6) return undefined;
	const n = points.length;
	const indices = [0, Math.floor((n - 1) / 3), Math.floor((2 * (n - 1)) / 3), n - 1];
	const labels = indices.map((idx) => points[idx]?.weekLabel).filter((value): value is string => Boolean(value));
	return [...new Set(labels)];
}

function splitMarkdownRow(row: string): string[] {
	return row
		.trim()
		.replace(/^\|/, "")
		.replace(/\|$/, "")
		.split("|")
		.map((cell) => cell.trim());
}

function isDividerRow(row: string): boolean {
	return /^[:\-\s]+$/.test(row.replace(/\|/g, "").trim());
}

function parseSectionHeading(line: string): { key: string; title: string } | null {
	const headingMatch = line.match(/^##\s+([0-9]+(?:\([a-z]\))?)\.\s*(.+)$/i);
	if (!headingMatch) return null;
	return {
		key: headingMatch[1],
		title: headingMatch[2].trim(),
	};
}

function sectionSortValue(key: string): number {
	const match = key.match(/^(\d+)(?:\(([a-z])\))?$/i);
	if (!match) return Number.MAX_SAFE_INTEGER;
	const major = Number(match[1]);
	const letter = match[2] ? match[2].toLowerCase().charCodeAt(0) - 96 : 0;
	return major * 100 + letter;
}

function getDateColumnIndex(headers: string[]): number {
	const normalized = headers.map((header) => header.toLowerCase());
	const exactDate = normalized.findIndex((header) => header === "date");
	if (exactDate !== -1) return exactDate;

	return normalized.findIndex((header) =>
		[
			"review performed on",
			"formalized on",
			"performed on",
			"reported on",
			"created on",
		].some((needle) => header.includes(needle))
	);
}

function getOutcomeColumnIndex(headers: string[]): number {
	const normalized = headers.map((header) => header.toLowerCase());
	return normalized.findIndex((header) =>
		["outcome", "status", "result"].some((needle) => header.includes(needle))
	);
}

function createUtcDate(day: number, monthLabel: string, year: number): Date | null {
	const month = monthMap[monthLabel.slice(0, 3).toLowerCase()];
	if (month === undefined) return null;
	return new Date(Date.UTC(year, month, day));
}

function parseSingleDatePart(rawDate: string): Date | null {
	const dateText = rawDate.replace(/\u2013/g, "-").replace(/\s+/g, " ").trim();
	if (!dateText || /in progress/i.test(dateText)) return null;

	if (/^\d{4}$/.test(dateText)) {
		return new Date(Date.UTC(Number(dateText), 0, 1));
	}

	const dayRangeMatch = dateText.match(/^(\d{1,2})-(\d{1,2})\s+([A-Za-z]+),?\s*(\d{4})$/);
	if (dayRangeMatch) {
		return createUtcDate(Number(dayRangeMatch[1]), dayRangeMatch[3], Number(dayRangeMatch[4]));
	}

	const monthRangeMatch = dateText.match(
		/^(\d{1,2})\s+([A-Za-z]+)-(\d{1,2})\s+([A-Za-z]+),?\s*(\d{4})$/
	);
	if (monthRangeMatch) {
		return createUtcDate(Number(monthRangeMatch[1]), monthRangeMatch[2], Number(monthRangeMatch[5]));
	}

	const firstRangePart = dateText.split(" - ")[0].trim();
	const yearMatch = dateText.match(/\b(19|20)\d{2}\b/);
	const year = yearMatch ? Number(yearMatch[0]) : null;

	const tryParse = (value: string): Date | null => {
		const text = value.replace(/,/g, "").trim();

		const dmy = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
		if (dmy) return createUtcDate(Number(dmy[1]), dmy[2], Number(dmy[3]));

		const mdy = text.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/);
		if (mdy) return createUtcDate(Number(mdy[2]), mdy[1], Number(mdy[3]));

		const my = text.match(/^([A-Za-z]+)\s+(\d{4})$/);
		if (my) return createUtcDate(1, my[1], Number(my[2]));

		const timestamp = Date.parse(text);
		if (!Number.isNaN(timestamp)) {
			const parsed = new Date(timestamp);
			return new Date(
				Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate())
			);
		}
		return null;
	};

	const firstPartParsed = tryParse(firstRangePart);
	if (firstPartParsed) return firstPartParsed;

	if (year !== null && !/\b(19|20)\d{2}\b/.test(firstRangePart)) {
		const withYearParsed = tryParse(`${firstRangePart} ${year}`);
		if (withYearParsed) return withYearParsed;
	}

	const fullParsed = tryParse(dateText);
	if (fullParsed) return fullParsed;

	return year !== null ? new Date(Date.UTC(year, 0, 1)) : null;
}

function parseContributionDate(rawDate: string): Date | null {
	const cleaned = rawDate.replace(/\u2013/g, "-").trim();
	if (!cleaned || /in progress/i.test(cleaned)) return null;

	const segments = cleaned
		.split(";")
		.map((part) => part.trim())
		.filter(Boolean);

	const candidateDates = (segments.length > 0 ? segments : [cleaned])
		.map((segment) => parseSingleDatePart(segment))
		.filter((date): date is Date => date !== null);

	if (candidateDates.length === 0) return parseSingleDatePart(cleaned);
	return candidateDates.sort((a, b) => a.getTime() - b.getTime())[0];
}

function classifyOutcome(outcome: string): CategoryKey {
	const text = outcome.toLowerCase();

	const hasFull =
		text.includes("🟢") || text.includes("full solution") || text.includes("full proof");
	const hasPartial =
		text.includes("🟡") ||
		text.includes("partial") ||
		text.includes("exploration") ||
		text.includes("variant") ||
		text.includes("reduction") ||
		text.includes("counterexample to previous formulation") ||
		text.includes("matched past construction") ||
		text.includes("no counterexample found");
	const hasIncorrect =
		text.includes("🔴") ||
		text.includes("incorrect") ||
		text.includes("did not") ||
		text.includes("failed") ||
		text.includes("unable") ||
		text.includes("major gaps");

	if (hasFull) return "full";
	if (hasPartial) return "partial";
	if (hasIncorrect) return "incorrect";
	return "partial";
}

function weekStartUtc(date: Date): number {
	const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
	const day = utcDate.getUTCDay();
	const dayOffset = day === 0 ? -6 : 1 - day;
	utcDate.setUTCDate(utcDate.getUTCDate() + dayOffset);
	return utcDate.getTime();
}

function parseSnapshotBySection(markdown: string): ParsedSnapshot {
	const lines = markdown.split("\n");
	const sectionMap = new Map<string, SectionAggregate>();

	let currentSectionKey = "unsectioned";
	let currentSectionTitle = "Unsectioned";

	const ensureSection = (key: string, title: string): SectionAggregate => {
		const existing = sectionMap.get(key);
		if (existing) return existing;
		const created: SectionAggregate = {
			key,
			title,
			problemIds: new Set<string>(),
			contributions: [],
		};
		sectionMap.set(key, created);
		return created;
	};

	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i]?.trim();
		if (!line) continue;

		const heading = parseSectionHeading(line);
		if (heading) {
			currentSectionKey = heading.key;
			currentSectionTitle = heading.title;
			ensureSection(currentSectionKey, currentSectionTitle);
			continue;
		}

		const headerLine = line;
		const dividerLine = lines[i + 1]?.trim();
		if (!headerLine.startsWith("|") || !dividerLine?.startsWith("|")) continue;
		if (!isDividerRow(dividerLine)) continue;

		const section = ensureSection(currentSectionKey, currentSectionTitle);
		const headers = splitMarkdownRow(headerLine);
		const problemIndex = headers.findIndex((header) => header.toLowerCase() === "problem");
		const dateIndex = getDateColumnIndex(headers);
		const outcomeIndex = getOutcomeColumnIndex(headers);

		i += 2;
		while (i < lines.length && lines[i]?.trim().startsWith("|")) {
			const rowLine = lines[i].trim();
			if (isDividerRow(rowLine)) {
				i += 1;
				continue;
			}

			const cells = splitMarkdownRow(rowLine);
			const problemCell = problemIndex >= 0 ? cells[problemIndex] ?? "" : "";
			for (const match of problemCell.matchAll(/\[\[(\d+)\]\]/g)) {
				section.problemIds.add(match[1]);
			}

			const dateCell = dateIndex >= 0 ? cells[dateIndex] ?? "" : "";
			const parsedDate = parseContributionDate(dateCell);
			if (parsedDate) {
				const outcomeSource = outcomeIndex >= 0 ? cells[outcomeIndex] ?? "" : cells.join(" ");
				section.contributions.push({
					date: parsedDate,
					category: classifyOutcome(outcomeSource),
					sectionKey: section.key,
				});
			}

			i += 1;
		}

		i -= 1;
	}

	const sections: SectionSnapshot[] = [...sectionMap.values()]
		.map((section) => ({
			key: section.key,
			title: section.title,
			contributions: section.contributions,
		}))
		.sort((a, b) => sectionSortValue(a.key) - sectionSortValue(b.key));

	return {
		sections,
		contributions: sections.flatMap((section) => section.contributions),
	};
}

function buildChartSeries(contributions: Contribution[]): { points: ChartPoint[]; stats: SnapshotStats } {
	if (contributions.length === 0) {
		return {
			points: [],
			stats: { total: 0, incorrect: 0, partial: 0, full: 0 },
		};
	}

	const increments = new Map<number, SnapshotStats>();
	for (const entry of contributions) {
		const week = weekStartUtc(entry.date);
		const existing = increments.get(week) ?? {
			total: 0,
			incorrect: 0,
			partial: 0,
			full: 0,
		};
		existing.total += 1;
		existing[entry.category] += 1;
		increments.set(week, existing);
	}

	const sortedWeeks = [...increments.keys()].sort((a, b) => a - b);
	const firstWeek = sortedWeeks[0];
	const lastWeek = sortedWeeks[sortedWeeks.length - 1];

	let cumulativeIncorrect = 0;
	let cumulativePartial = 0;
	let cumulativeFull = 0;
	const points: ChartPoint[] = [];

	for (let currentWeek = firstWeek; currentWeek <= lastWeek; currentWeek += WEEK_MS) {
		const step = increments.get(currentWeek);
		if (step) {
			cumulativeIncorrect += step.incorrect;
			cumulativePartial += step.partial;
			cumulativeFull += step.full;
		}

		points.push({
			timestamp: currentWeek,
			weekLabel: new Date(currentWeek).toISOString().slice(0, 10),
			incorrect: cumulativeIncorrect,
			partial: cumulativePartial,
			full: cumulativeFull,
			total: cumulativeIncorrect + cumulativePartial + cumulativeFull,
		});
	}

	return {
		points,
		stats: {
			total: cumulativeIncorrect + cumulativePartial + cumulativeFull,
			incorrect: cumulativeIncorrect,
			partial: cumulativePartial,
			full: cumulativeFull,
		},
	};
}

export function ErdosContributionsSnapshot() {
	const [tabSeries, setTabSeries] = useState<TabSeries[]>([]);
	const [activeTab, setActiveTab] = useState("all");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const loadSnapshot = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const response = await fetch(WIKI_RAW_URL);
				if (!response.ok) {
					throw new Error(`Failed to load data: ${response.status}`);
				}
				const markdown = await response.text();
				const parsed = parseSnapshotBySection(markdown);

				const allSeries = buildChartSeries(parsed.contributions);
				const perSectionSeries: TabSeries[] = parsed.sections
					.filter((section) => section.contributions.length > 0)
					.map((section) => {
						const { points, stats } = buildChartSeries(section.contributions);
						const latestTs =
							section.contributions.length > 0
								? Math.max(...section.contributions.map((entry) => entry.date.getTime()))
								: Number.NaN;
						return {
							key: section.key,
							label: section.key,
							title: section.title,
							points,
							stats,
							latestDate: Number.isFinite(latestTs) ? new Date(latestTs) : null,
						};
					});

				const allLatestTs =
					parsed.contributions.length > 0
						? Math.max(...parsed.contributions.map((entry) => entry.date.getTime()))
						: Number.NaN;

				setTabSeries([
					{
						key: "all",
						label: "All",
						title: "All sections combined",
						points: allSeries.points,
						stats: allSeries.stats,
						latestDate: Number.isFinite(allLatestTs) ? new Date(allLatestTs) : null,
					},
					...perSectionSeries,
				]);
				setActiveTab("all");
			} catch (loadError) {
				console.error(loadError);
				setError("Could not load the latest Erdős AI contribution snapshot.");
			} finally {
				setIsLoading(false);
			}
		};

		loadSnapshot();
	}, []);

	useEffect(() => {
		const updateViewport = () => {
			setIsMobile(window.innerWidth < 768);
		};
		updateViewport();
		window.addEventListener("resize", updateViewport);
		return () => window.removeEventListener("resize", updateViewport);
	}, []);

	const activeSeries = tabSeries.find((tab) => tab.key === activeTab) ?? tabSeries[0];
	const mobileTicks = useMemo(
		() => (isMobile && activeSeries ? buildMobileXAxisTicks(activeSeries.points) : undefined),
		[activeSeries, isMobile]
	);
	return (
		<section className="space-y-6">
			<div className="text-center space-y-3 max-w-4xl mx-auto">
				<div className="inline-flex items-center rounded-full border border-border/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Live Erdős Snapshot
				</div>
				<h2 className="text-3xl md:text-4xl font-bold tracking-tight">
					Cumulative AI Contributions to Erdős Problems
				</h2>
				<p className="text-muted-foreground">
					Cumulative figures with section tabs from the live wiki status page.
				</p>
			</div>

			<Card className="bg-card/50 backdrop-blur border-primary/10">
				<CardHeader>
					<CardTitle>Cumulative Snapshot</CardTitle>
					<CardDescription>
						{activeSeries ? `${activeSeries.label}: ${activeSeries.title}` : "Loading"}
						{activeSeries?.latestDate
							? ` • source last updated ${tooltipDateFormatter.format(activeSeries.latestDate)}`
							: ""}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{isLoading ? (
						<div className="h-[460px] flex items-center justify-center">
							<Loader2 className="w-8 h-8 animate-spin text-primary" />
						</div>
					) : error ? (
						<div className="h-[460px] flex flex-col items-center justify-center gap-3 text-center">
							<p className="text-muted-foreground">{error}</p>
							<Button asChild variant="outline">
								<a href={WIKI_PAGE_URL} target="_blank" rel="noopener noreferrer">
									Open Data Source <ExternalLink />
								</a>
							</Button>
						</div>
					) : (
						<>
							<div className="flex gap-2 overflow-x-auto pb-1">
								{tabSeries.map((tab) => (
									<button
										key={tab.key}
										type="button"
										onClick={() => setActiveTab(tab.key)}
										className={`px-2.5 py-1.5 rounded-md text-xs md:text-sm font-medium border transition-colors whitespace-nowrap shrink-0 ${
											activeTab === tab.key
												? "bg-primary text-primary-foreground border-primary"
												: "bg-background text-foreground border-border hover:bg-muted"
										}`}
									>
										{tab.label}
									</button>
								))}
							</div>

							{activeSeries && (
								<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
									<div className="rounded-md border border-border bg-background px-3 py-2">
										<div className="text-xs text-muted-foreground">Total</div>
										<div className="text-xl font-bold">{activeSeries.stats.total}</div>
									</div>
									<div className="rounded-md border border-border bg-background px-3 py-2">
										<div className="text-xs text-muted-foreground">Full</div>
										<div className="text-xl font-bold text-[#1B9E77]">{activeSeries.stats.full}</div>
									</div>
									<div className="rounded-md border border-border bg-background px-3 py-2">
										<div className="text-xs text-muted-foreground">Partial</div>
										<div className="text-xl font-bold text-[#E6AB02]">{activeSeries.stats.partial}</div>
									</div>
									<div className="rounded-md border border-border bg-background px-3 py-2">
										<div className="text-xs text-muted-foreground">Incorrect</div>
										<div className="text-xl font-bold text-[#D95F02]">{activeSeries.stats.incorrect}</div>
									</div>
								</div>
							)}

							<div className={`w-full ${isMobile ? "h-[265px]" : "h-[360px]"} rounded-lg border border-slate-300 bg-white ${isMobile ? "p-1.5" : "p-2"}`}>
								{(activeSeries?.points.length ?? 0) === 0 ? (
									<div className="h-full flex items-center justify-center text-sm text-slate-600">
										No dated contributions found for this section.
									</div>
								) : (
									<div className="h-full flex flex-col">
										<div className="px-1 pb-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] md:text-xs text-slate-700">
											<div className="inline-flex items-center gap-1">
												<span className="inline-block w-2 h-2 rounded-full bg-[#D95F02]" />
												<span>{isMobile ? "Incorrect" : "Incorrect / counterexample / gaps"}</span>
											</div>
											<div className="inline-flex items-center gap-1">
												<span className="inline-block w-2 h-2 rounded-full bg-[#E6AB02]" />
												<span>{isMobile ? "Partial" : "Partial / exploration"}</span>
											</div>
											<div className="inline-flex items-center gap-1">
												<span className="inline-block w-2 h-2 rounded-full bg-[#1B9E77]" />
												<span>{isMobile ? "Full" : "Full solutions"}</span>
											</div>
										</div>

										<div className="flex-1 min-h-0">
											<ResponsiveContainer width="100%" height="100%">
												<AreaChart
													data={activeSeries?.points ?? []}
													margin={{
														top: 6,
														right: isMobile ? 4 : 16,
														left: isMobile ? -8 : 12,
														bottom: isMobile ? 2 : 20,
													}}
												>
													<CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
													<XAxis
														dataKey="weekLabel"
														type="category"
														ticks={mobileTicks}
														tickLine={false}
														axisLine={{ stroke: "#334155" }}
														tick={{ fill: "#334155", fontSize: isMobile ? 9 : 12 }}
														minTickGap={isMobile ? 28 : 20}
														interval="preserveStartEnd"
														tickFormatter={(value: string | number) => formatWeekLabel(value)}
														label={
															isMobile
																? undefined
																: { value: "Week", position: "insideBottom", offset: -6, fill: "#0f172a", style: { fontSize: 11 } }
														}
													/>
													<YAxis
														tickLine={false}
														axisLine={{ stroke: "#334155" }}
														tick={{ fill: "#334155", fontSize: isMobile ? 9 : 12 }}
														allowDecimals={false}
														width={isMobile ? 26 : 40}
														domain={[0, "dataMax + 2"]}
														label={
															isMobile
																? undefined
																: {
																	value: "Cumulative number of contributions",
																	angle: -90,
																	position: "insideLeft",
																	style: {
																		textAnchor: "middle",
																		fill: "#0f172a",
																		fontSize: 11,
																	},
																}
														}
													/>
													<Tooltip
														labelFormatter={(value) => formatTooltipLabel(value)}
														formatter={(value: number, name: string) => [value, name]}
														contentStyle={{
															backgroundColor: "#ffffff",
															border: "1px solid #d1d5db",
															borderRadius: "8px",
														}}
													/>
													<Area
														name={isMobile ? "Incorrect" : "Incorrect / counterexample / gaps"}
														type="monotone"
														dataKey="incorrect"
														stackId="1"
														stroke="#D95F02"
														fill="#D95F02"
														fillOpacity={0.9}
													/>
													<Area
														name={isMobile ? "Partial" : "Partial / exploration"}
														type="monotone"
														dataKey="partial"
														stackId="1"
														stroke="#E6AB02"
														fill="#E6AB02"
														fillOpacity={0.9}
													/>
													<Area
														name={isMobile ? "Full" : "Full solutions"}
														type="monotone"
														dataKey="full"
														stackId="1"
														stroke="#1B9E77"
														fill="#1B9E77"
														fillOpacity={0.9}
													/>
												</AreaChart>
											</ResponsiveContainer>
										</div>
									</div>
								)}
							</div>
						</>
					)}

					<div className="pt-1 flex flex-col sm:flex-row gap-3 justify-end">
						<Button asChild variant="outline">
							<a href={WIKI_PAGE_URL} target="_blank" rel="noopener noreferrer">
								Current wiki status <ExternalLink />
							</a>
						</Button>
						<Button asChild>
							<a href={TWEET_URL} target="_blank" rel="noopener noreferrer">
								Reference tweet <ExternalLink />
							</a>
						</Button>
					</div>
				</CardContent>
			</Card>
		</section>
	);
}
