import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export const RevenueFilterGraph = ({nodes, width = 300, height = 600 ,setSelectedRevenueRange, selectedRevenueRange}) => {
    const svgRef = useRef();
    const miniSvgRef = useRef();
    const brushRef = useRef();

    const [filteredGraphNodes, setFilteredGraphNodes] = useState(nodes);

    const miniChartHeight = 60;
    const miniChartMargin = { top: 20, right: 30, bottom: 30, left: 50 };
    const miniChartWidth = width - miniChartMargin.left - miniChartMargin.right;

    useEffect(() => {
        const svg = d3.select(miniSvgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${miniChartMargin.left},${miniChartMargin.top})`);

        const minRevenueActual = d3.min(nodes, d => d.revenue);
        const maxRevenueActual = d3.max(nodes, d => d.revenue);

        // Define a small epsilon value for log scale if min revenue is 0
        const epsilon = minRevenueActual === 0 ? 1 : minRevenueActual; // Use 1 if 0 is present, otherwise actual min

        // 1. Scales for the histogram (Logarithmic X Scale)
        const x = d3.scaleLog() // Use d3.scaleLog()
            .domain([epsilon, maxRevenueActual]) // Domain must be positive
            .range([0, miniChartWidth]);

        const y = d3.scaleLinear()
            .range([miniChartHeight, 0]);

        const logMin = Math.log10(epsilon);
        const logMax = Math.log10(maxRevenueActual);
        const binCount = 50;
        const logStep = (logMax - logMin) / binCount;

        const thresholds = d3.range(logMin, logMax + logStep, logStep).map(d => Math.pow(10, d));

        const histogram = d3.bin()
            .value(d => d.revenue === 0 ? epsilon : d.revenue)
            .domain(x.domain())
            .thresholds(thresholds);


        const binnedNodes = nodes.map(d => ({ // Map nodes for binning, handling zero
            ...d,
            binnableRevenue: d.revenue === 0 ? epsilon : d.revenue
        }));
        const bins = histogram(binnedNodes);

        // Filter out empty bins that might occur with a log scale and sparse data
        const nonZeroBins = bins.filter(d => d.length > 0);

        // Update Y scale domain based on bin counts
        y.domain([0, d3.max(nonZeroBins, d => d.length)]);

        // 3. Draw bars
        g.selectAll("rect")
            .data(nonZeroBins)
            .join("rect")
            .attr("x", d => x(d.x0) + 1) // Add a small gap between bars
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", d => y(d.length))
            .attr("height", d => miniChartHeight - y(d.length))
            .attr("fill", "steelblue")
            .attr("opacity", 0.7);

        // 4. Add X axis
        g.append("g")
            .attr("transform", `translate(0,${miniChartHeight})`)
            .call(d3.axisBottom(x)
                .ticks(8, d3.format(".1s")) // Use .1s for significant figures and SI prefix
                .tickFormat(d => {
                    // Custom format to show original 0, then large numbers with Suffix
                    if (d === epsilon && minRevenueActual === 0) return "$0";
                    return d3.format(".2s")(d);
                })
            );

        // Add Y axis (optional, but good for context)
        g.append("g")
            .call(d3.axisLeft(y).ticks(3));

        // Add X axis label
        g.append("text")
            .attr("transform", `translate(${miniChartWidth / 2}, ${miniChartHeight + miniChartMargin.bottom - 5})`)
            .style("text-anchor", "middle")
            .text("Revenue");

        // 5. Implement the Brush
        const brush = d3.brushX()
            .extent([[0, 0], [miniChartWidth, miniChartHeight]])
            .on("end", brushed); // `end` event is good for filtering after selection

        brushRef.current = g.append("g")
            .attr("class", "brush")
            .call(brush);

        // Set initial brush selection to cover the entire range
        brushRef.current.call(brush.move, x.range());

        function brushed(event) {
            const selection = event.selection;
            if (selection) {
                const [x0, x1] = selection.map(x.invert);
                setSelectedRevenueRange([x0, x1]);
            } else {
                setSelectedRevenueRange(null); // No selection, show all
            }
        }

    }, [nodes, width, miniChartWidth, miniChartHeight, miniChartMargin.left, miniChartMargin.bottom]);

    // Effect to filter main graph nodes based on selected revenue range
    useEffect(() => {
        if (!selectedRevenueRange) {
            setFilteredGraphNodes(nodes); // If no selection, show all
        } else {
            const [minRevenue, maxRevenue] = selectedRevenueRange;
            const newFilteredNodes = nodes.filter(node =>
                node.revenue >= minRevenue && node.revenue <= maxRevenue
            );
            setFilteredGraphNodes(newFilteredNodes);
        }
    }, [selectedRevenueRange, nodes]);


    return (
        <div style={{ width: '100%', height: '160px'}}>
            <div style={{display: 'flex', flexDirection: 'column'}}>
                <svg
                    ref={miniSvgRef}
                    width={width}
                    height={miniChartHeight + miniChartMargin.top + miniChartMargin.bottom}
                    style={{ border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}
                >
                    {/* Histogram and Brush will be rendered here by D3 */}
                </svg>
                {selectedRevenueRange && (
                    <div style={{ marginTop: '10px', fontSize: '0.9em', display: 'flex'}}>
                        Selected Revenue: ${d3.format(",.0f")(selectedRevenueRange[0])} to ${d3.format(",.0f")(selectedRevenueRange[1])}
                    </div>
                )}
                {!selectedRevenueRange && (
                    <div style={{ marginTop: '10px', fontSize: '0.9em', display: 'flex' }}>
                        No revenue range selected (showing all nodes).
                    </div>
                )}
            </div>

            <style jsx>{`
                .brush .selection {
                    fill-opacity: .3;
                    stroke: #333;
                    stroke-dasharray: 2,2;
                }
            `}</style>
        </div>
    );
};
