"use client";

import React, { useState, useMemo } from "react";
import { TimeSeriesPoint } from "../analyticsApi";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

interface ThroughputAreaChartProps {
    data: TimeSeriesPoint[];
    isLoading?: boolean;
}

const ThroughputAreaChart: React.FC<ThroughputAreaChartProps> = ({ data, isLoading }) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [visibleSeries, setVisibleSeries] = useState<{
        uploaded: boolean;
        verified: boolean;
        transformed: boolean;
    }>({
        uploaded: true,
        verified: true,
        transformed: true,
    });

    const toggleSeries = (key: keyof typeof visibleSeries) => {
        setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Chart dimensions in SVG coordinates
    const width = 800;
    const height = 260;
    const padding = { top: 20, right: 20, bottom: 35, left: 40 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data || [];

    // Compute max value for Y scale
    const maxY = useMemo(() => {
        if (!points.length) return 10;
        let max = 0;
        for (const p of points) {
            if (visibleSeries.uploaded && p.uploaded > max) max = p.uploaded;
            if (visibleSeries.verified && p.verified > max) max = p.verified;
            if (visibleSeries.transformed && p.transformed > max) max = p.transformed;
        }
        return Math.max(max, 5);
    }, [points, visibleSeries]);

    // Nice Y-axis ticks
    const yTicks = useMemo(() => {
        const step = Math.ceil(maxY / 4);
        return [0, step, step * 2, step * 3, step * 4];
    }, [maxY]);

    const yMaxActual = yTicks[yTicks.length - 1];

    // Coordinate converters
    const getX = (index: number) => {
        if (points.length <= 1) return padding.left + chartWidth / 2;
        return padding.left + (index / (points.length - 1)) * chartWidth;
    };

    const getY = (val: number) => {
        if (yMaxActual === 0) return padding.top + chartHeight;
        return padding.top + chartHeight - (val / yMaxActual) * chartHeight;
    };

    // Generate smooth SVG paths
    const generatePath = (key: "uploaded" | "verified" | "transformed", isArea = false) => {
        if (!points.length) return "";
        let path = "";

        points.forEach((p, i) => {
            const x = getX(i);
            const y = getY(p[key]);

            if (i === 0) {
                path += `M ${x} ${y}`;
            } else {
                const prevX = getX(i - 1);
                const prevY = getY(points[i - 1][key]);
                const cpX1 = prevX + (x - prevX) / 2;
                const cpX2 = cpX1;
                path += ` C ${cpX1} ${prevY}, ${cpX2} ${y}, ${x} ${y}`;
            }
        });

        if (isArea) {
            const lastX = getX(points.length - 1);
            const firstX = getX(0);
            const bottomY = padding.top + chartHeight;
            path += ` L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
        }

        return path;
    };

    // Calculate hover interactions
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!points.length) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const svgX = ((e.clientX - rect.left) / rect.width) * width;
        const boundedX = Math.max(padding.left, Math.min(width - padding.right, svgX));
        const ratio = (boundedX - padding.left) / chartWidth;
        const index = Math.round(ratio * (points.length - 1));
        setHoverIndex(Math.max(0, Math.min(points.length - 1, index)));
    };

    const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
            {/* Header & Series Toggles */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        Pipeline Throughput & Verification Velocity
                    </h3>
                    <p className="text-xs text-slate-500">
                        Daily comparison of uploaded documents, AI transformations, and verified output.
                    </p>
                </div>

                {/* Series Legend Toggles */}
                <div className="flex items-center gap-3 text-xs select-none">
                    <button
                        onClick={() => toggleSeries("uploaded")}
                        className={cn(
                            "flex items-center gap-1.5 font-medium transition-opacity cursor-pointer",
                            visibleSeries.uploaded ? "opacity-100" : "opacity-40"
                        )}
                    >
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        <span className="text-slate-700">Uploaded</span>
                    </button>

                    <button
                        onClick={() => toggleSeries("transformed")}
                        className={cn(
                            "flex items-center gap-1.5 font-medium transition-opacity cursor-pointer",
                            visibleSeries.transformed ? "opacity-100" : "opacity-40"
                        )}
                    >
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span className="text-slate-700">Transformed</span>
                    </button>

                    <button
                        onClick={() => toggleSeries("verified")}
                        className={cn(
                            "flex items-center gap-1.5 font-medium transition-opacity cursor-pointer",
                            visibleSeries.verified ? "opacity-100" : "opacity-40"
                        )}
                    >
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-slate-700">Verified</span>
                    </button>
                </div>
            </div>

            {/* SVG Chart */}
            <div className="relative w-full aspect-[2.8/1] min-h-[220px]">
                {isLoading ? (
                    <div className="w-full h-full bg-slate-50 rounded-lg animate-pulse flex items-center justify-center text-xs text-slate-400">
                        Aggregating throughput time-series...
                    </div>
                ) : points.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        No processing activity recorded in this time range.
                    </div>
                ) : (
                    <>
                        <svg
                            viewBox={`0 0 ${width} ${height}`}
                            className="w-full h-full overflow-visible select-none"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoverIndex(null)}
                        >
                            <defs>
                                <linearGradient id="area-uploaded" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="area-transformed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                                </linearGradient>
                                <linearGradient id="area-verified" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>

                            {/* Horizontal Gridlines & Y-Axis Labels */}
                            {yTicks.map((tickVal) => {
                                const y = getY(tickVal);
                                return (
                                    <g key={tickVal}>
                                        <line
                                            x1={padding.left}
                                            y1={y}
                                            x2={width - padding.right}
                                            y2={y}
                                            stroke="#f1f5f9"
                                            strokeDasharray="4 4"
                                        />
                                        <text
                                            x={padding.left - 8}
                                            y={y + 3}
                                            textAnchor="end"
                                            className="text-[10px] fill-slate-400 font-mono"
                                        >
                                            {tickVal}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* X-Axis Date Labels (Sparse sampling) */}
                            {points.map((p, i) => {
                                const interval = Math.max(1, Math.floor(points.length / 7));
                                if (i % interval !== 0 && i !== points.length - 1) return null;
                                const x = getX(i);
                                let formatted = p.date;
                                try {
                                    formatted = format(parseISO(p.date), "MMM d");
                                } catch {
                                    formatted = p.date;
                                }

                                return (
                                    <text
                                        key={p.date}
                                        x={x}
                                        y={height - 8}
                                        textAnchor="middle"
                                        className="text-[10px] fill-slate-400 font-mono"
                                    >
                                        {formatted}
                                    </text>
                                );
                            })}

                            {/* Area Fills */}
                            {visibleSeries.uploaded && (
                                <path
                                    d={generatePath("uploaded", true)}
                                    fill="url(#area-uploaded)"
                                    className="transition-all duration-300"
                                />
                            )}
                            {visibleSeries.transformed && (
                                <path
                                    d={generatePath("transformed", true)}
                                    fill="url(#area-transformed)"
                                    className="transition-all duration-300"
                                />
                            )}
                            {visibleSeries.verified && (
                                <path
                                    d={generatePath("verified", true)}
                                    fill="url(#area-verified)"
                                    className="transition-all duration-300"
                                />
                            )}

                            {/* Stroke Lines */}
                            {visibleSeries.uploaded && (
                                <path
                                    d={generatePath("uploaded", false)}
                                    fill="none"
                                    stroke="#0284c7"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                />
                            )}
                            {visibleSeries.transformed && (
                                <path
                                    d={generatePath("transformed", false)}
                                    fill="none"
                                    stroke="#6366f1"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeDasharray="4 2"
                                />
                            )}
                            {visibleSeries.verified && (
                                <path
                                    d={generatePath("verified", false)}
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                />
                            )}

                            {/* Interactive Hover Guide & Dots */}
                            {hoverIndex !== null && hoveredPoint && (
                                <g>
                                    <line
                                        x1={getX(hoverIndex)}
                                        y1={padding.top}
                                        x2={getX(hoverIndex)}
                                        y2={padding.top + chartHeight}
                                        stroke="#64748b"
                                        strokeWidth="1.2"
                                        strokeDasharray="3 3"
                                    />

                                    {visibleSeries.uploaded && (
                                        <circle
                                            cx={getX(hoverIndex)}
                                            cy={getY(hoveredPoint.uploaded)}
                                            r="4"
                                            fill="#0284c7"
                                            stroke="#fff"
                                            strokeWidth="2"
                                        />
                                    )}
                                    {visibleSeries.transformed && (
                                        <circle
                                            cx={getX(hoverIndex)}
                                            cy={getY(hoveredPoint.transformed)}
                                            r="4"
                                            fill="#6366f1"
                                            stroke="#fff"
                                            strokeWidth="2"
                                        />
                                    )}
                                    {visibleSeries.verified && (
                                        <circle
                                            cx={getX(hoverIndex)}
                                            cy={getY(hoveredPoint.verified)}
                                            r="4.5"
                                            fill="#10b981"
                                            stroke="#fff"
                                            strokeWidth="2"
                                        />
                                    )}
                                </g>
                            )}
                        </svg>

                        {/* Interactive Floating Tooltip */}
                        {hoverIndex !== null && hoveredPoint && (
                            <div
                                className="absolute pointer-events-none z-20 bg-slate-900/90 text-white backdrop-blur-md rounded-lg p-2.5 shadow-xl border border-slate-700/50 text-[11px] flex flex-col gap-1 transition-all duration-75"
                                style={{
                                    left: `${(getX(hoverIndex) / width) * 100}%`,
                                    top: "15%",
                                    transform: getX(hoverIndex) > width * 0.65 ? "translateX(-105%)" : "translateX(10px)",
                                }}
                            >
                                <div className="font-semibold text-slate-300 pb-1 border-b border-slate-700/60 font-mono">
                                    {hoveredPoint.date}
                                </div>
                                <div className="flex items-center justify-between gap-3 text-sky-400">
                                    <span>Uploaded:</span>
                                    <span className="font-bold font-mono">{hoveredPoint.uploaded}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-indigo-300">
                                    <span>Transformed:</span>
                                    <span className="font-bold font-mono">{hoveredPoint.transformed}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-emerald-400">
                                    <span>Verified:</span>
                                    <span className="font-bold font-mono">{hoveredPoint.verified}</span>
                                </div>
                                {hoveredPoint.rejected > 0 && (
                                    <div className="flex items-center justify-between gap-3 text-rose-400">
                                        <span>Rejected:</span>
                                        <span className="font-bold font-mono">{hoveredPoint.rejected}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ThroughputAreaChart;
