import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";

export const ForceGraph = ({ graphData, width = 700, height = 600, depth, setDepth }) => {
    const svgRef = useRef();
    const simulationRef = useRef();
    const linkGroupRef = useRef();
    const nodeGroupRef = useRef();

    const parseDate = d3.timeParse("%Y-%m-%dT%H:%M:%S");

    const allLinksProcessed = graphData.links
        .map(d => ({
            ...d,
            key: `${d.source}-${d.target}`,
            start_date_parsed: parseDate(d.start_date) || new Date(d.start_date), // Handle both formats
            end_date_parsed: d.end_date ? (parseDate(d.end_date) || new Date(d.end_date)) : null // Handle both formats
        }))
        .sort((a, b) => a.start_date_parsed - b.start_date_parsed);

    const minDate = d3.min(allLinksProcessed, d => d.start_date_parsed);
    const maxDate = d3.max(allLinksProcessed, d => d.start_date_parsed);

    const [currentDate, setCurrentDate] = useState(null);
    const [isPlaying, setIsPlaying] = useState(null);
    const [displayedDateStr, setDisplayedDateStr] = useState(null);

    const dragstarted = useCallback((event, d) => {
        if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }, []);

    const dragged = useCallback((event, d) => {
        d.fx = event.x;
        d.fy = event.y;
    }, []);

    const dragended = useCallback((event, d) => {
        if (!event.active) simulationRef.current.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }, []);

    let activeLinks = allLinksProcessed.filter(d =>
        d.start_date_parsed <= currentDate &&
        (!d.end_date_parsed || d.end_date_parsed >= currentDate)
    );

    let latestLinkMap = new Map();

    activeLinks.forEach(d => {
        const key = `${d.source}-${d.target}`;
        const existing = latestLinkMap.get(key);

        if (!existing || d.start_date_parsed > existing.start_date_parsed) {
            latestLinkMap.set(key, d);
        }
    });

    let filteredLinks = Array.from(latestLinkMap.values());

    let nodesInLinks = new Set();
    filteredLinks.forEach(link => {
        nodesInLinks.add(link.source);
        nodesInLinks.add(link.target);
    });
    let filteredNodes = graphData.nodes.filter(node => nodesInLinks.has(node.id));
    const linkHistoryMap = new Map();

    allLinksProcessed.forEach(link => {
        const key = `${link.source}-${link.target}`;
        if (!linkHistoryMap.has(key)) {
            linkHistoryMap.set(key, []);
        }
        linkHistoryMap.get(key).push(link);
    });

    linkHistoryMap.forEach(history => {
        history.sort((a, b) => a.start_date_parsed - b.start_date_parsed);
    });

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        linkGroupRef.current = svg.append("g").attr("class", "links");
        nodeGroupRef.current = svg.append("g").attr("class", "nodes");

        const simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(d => d.id).distance(120))
            .force("charge", d3.forceManyBody().strength(-5))
            .force("center", d3.forceCenter(width / 2, height / 2));

        simulationRef.current = simulation;

        setCurrentDate(minDate);
        setIsPlaying(false);
        setDisplayedDateStr(d3.timeFormat("%Y-%m-%d")(minDate));
        activeLinks = allLinksProcessed.filter(d =>
            d.start_date_parsed <= currentDate &&
            (!d.end_date_parsed || d.end_date_parsed >= currentDate)
        );

        latestLinkMap = new Map();

        activeLinks.forEach(d => {
            const key = `${d.source}-${d.target}`;
            const existing = latestLinkMap.get(key);

            if (!existing || d.start_date_parsed > existing.start_date_parsed) {
                latestLinkMap.set(key, d);
            }
        });

        filteredLinks = Array.from(latestLinkMap.values());
        nodesInLinks = new Set();
        filteredLinks.forEach(link => {
            nodesInLinks.add(link.source);
            nodesInLinks.add(link.target);
        });
        filteredNodes = graphData.nodes.filter(node => nodesInLinks.has(node.id));

        return () => {
            simulation.stop();
        };
    }, [width, height, graphData]); // Dependencies: only re-run if width/height changes


    function generateHistoryHtml(d, currentDate ) {
        return linkHistoryMap.get(d.key).filter(entry => entry.start_date_parsed <= currentDate).map(entry => `
            <div>
              <strong>${entry.start_date}</strong>: ${entry.type}
            </div>
        `).join("");
    }

    useEffect(() => {
        const simulation = simulationRef.current;
        if (!simulation) return;

        simulation.nodes(filteredNodes);
        simulation.force("link").links(filteredLinks);
        simulation.alpha(1).restart();

        const linkGroup = linkGroupRef.current;
        const nodeGroup = nodeGroupRef.current;

        const link = linkGroup.selectAll(".link")
            .data(filteredLinks, d => `${d.source.id}-${d.target.id}-${d.type}-${d.key}`); // Unique key for data binding

        link.exit().remove();

        const tooltip = d3.select("#tooltip");
        const newLink = link.enter().append("line")
            .attr("class", "link")
            .attr("stroke-width", d => {
                if (d.type === "Event.Owns.Shareholdership") return 4;
                if (d.type === "Event.Owns.BeneficialOwnership") return 3.5;
                if (d.type === "Event.WorksFor") return 2;
                return 1;
            })
            .attr("stroke-dasharray", d => {
                if (d.type === "Event.Owns.Shareholdership") return "5,2";
                if (d.type === "Event.Owns.BeneficialOwnership") return null;
                if (d.type === "Event.WorksFor") return "1,3";
                return null;
            })
            .attr("stroke", d => {
                if (d.type === "Event.Owns.Shareholdership") return "#349dbe";
                if (d.type === "Event.Owns.BeneficialOwnership") return "#28b463";
                if (d.type === "Event.WorksFor") return "#f59e0b";
                if (d.type === "Relationship.FamilyRelationship") return "#e11d48";
                return "#9ca3af";
            }).on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .style('display', 'block')

                tooltip.html(`
            <div><strong>Changes:</strong></div>
            ${generateHistoryHtml(d, currentDate)}
        `);
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", event.x + "px")
                    .style("top", event.y + "px")
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0)
                    .style("display",  "none")
            });
        ;

        link.merge(newLink);

        const node = nodeGroup.selectAll(".node")
            .data(filteredNodes, d => d.id);

        node.exit().remove();

        const newNode = node.enter().append("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("mouseover", (event, d) => {
                tooltip.style("opacity", 1)
                    .style('display', 'block')

                tooltip.html(`        
            <div><strong>${d.type}</strong></div>
        `);
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("left", event.x + "px")
                    .style("top", event.y + "px")
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0)
                    .style("display",  "none")
            });
        ;;

        const originalColor = (d) => {
            if (d.type === "Entity.Organization.Company") return "#e2583e";
            if (d.type === "Entity.Organization.FishingCompany") return "#f28074";
            if (d.type === "Entity.Organization.LogisticsCompany") return "#e67300";
            if (d.type === "Entity.Organization.FinancialCompany") return "#f94144";
            if (d.type === "Entity.Organization.NewsCompany") return "#c75a3f";
            if (d.type === "Entity.Organization.NGO") return "#a63c06";
            if (d.type === "Entity.Person") return "#3f479e";
            if (d.type === "Entity.Person.CEO") return "#6d85bb";
            return "#6b7280";
        };

        const getNodeSize = (d) => {
            if (d.type.includes("Entity.Person")) return 12;
            return 18;
        };

        newNode.each(function (d) {
            const group = d3.select(this);
            const size = getNodeSize(d);
            const color = originalColor(d);

            if (d.type.startsWith("Entity.Person")) {
                group.append("circle")
                    .attr("r", size)
                    .attr("fill", "limegreen")
                    .attr("opacity", 0.3)
                    .transition().duration(800)
                    .attr("fill", color)
                    .attr("opacity", 1);
            } else {
                group.append("rect")
                    .attr("x", -size)
                    .attr("y", -size)
                    .attr("width", size * 2)
                    .attr("height", size * 2)
                    .attr("rx", 6)
                    .attr("ry", 6)
                    .attr("fill", "limegreen")
                    .attr("opacity", 0.3)
                    .transition().duration(800)
                    .attr("fill", color)
                    .attr("opacity", 1);
            }
        });

        newNode.append("text")
            .attr("class", "temp-label")
            .attr("dy", 4)
            .attr("x", 0)
            .attr("text-anchor", "middle")
            .text(d => d.id);

        node.merge(newNode);

        const ticked = () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node
                .attr("transform", d => `translate(${d.x},${d.y})`);

        };

        simulation.on("tick", ticked);

    }, [filteredNodes, filteredLinks, dragstarted, dragged, dragended, currentDate]);

    useEffect(() => {
        let playInterval;
        if (isPlaying) {
            playInterval = setInterval(() => {
                setCurrentDate(prevDate => {
                    const maxMillis = maxDate.getTime();
                    let currentMillis = prevDate.getTime();

                    if (currentMillis < maxMillis) {
                        currentMillis += (maxMillis - minDate.getTime()) / 200;
                        if (currentMillis > maxMillis) currentMillis = maxMillis;
                        return new Date(currentMillis);
                    } else {
                        setIsPlaying(false);
                        return prevDate;
                    }
                });
            }, 100);
        } else {
            clearInterval(playInterval);
        }

        return () => clearInterval(playInterval);
    }, [isPlaying, minDate, maxDate]);

    useEffect(() => {
        setDisplayedDateStr(d3.timeFormat("%Y-%m-%d")(currentDate));
    }, [currentDate]);


    const handleSliderChange = (event) => {
        setIsPlaying(false);
        setCurrentDate(new Date(+event.target.value));
    };

    const togglePlayback = () => {
        setIsPlaying(prev => !prev);
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
                display: 'flex',
                marginTop: '10px',
                background: 'rgba(255, 255, 255, 0.8)',
                padding: '10px',
                borderRadius: '5px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                zIndex: 10
            }}>
                <label htmlFor="dateSlider">Current Date:</label>
                <input
                    type="range"
                    id="dateSlider"
                    min={minDate?.getTime()}
                    max={maxDate?.getTime()}
                    value={currentDate?.getTime()}
                    onChange={handleSliderChange}
                    style={{ width: '300px' }}
                />
                <span id="currentDateDisplay" style={{ marginLeft: '10px' }}>{displayedDateStr}</span>
                <button onClick={togglePlayback} style={{ marginLeft: '10px' }}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <FormControl style={{marginLeft: '10px', width: '80px'}} size="small">
                    <InputLabel id="depth-select-label">Depth</InputLabel>
                    <Select
                        labelId="depth-select-label"
                        value={depth}
                        label="Depth"
                        onChange={(e) => setDepth(Number(e.target.value))}
                    >
                        <MenuItem value={1}>1</MenuItem>
                        <MenuItem value={2}>2</MenuItem>
                        <MenuItem value={3}>3</MenuItem>
                    </Select>
                </FormControl>
            </div>

            <svg ref={svgRef} width={width} height={height} style={{ border: '1px solid #ccc', backgroundColor: '#fff', marginTop: '70px' }}>
            </svg>

            <style jsx>{`
                .node circle {
                    stroke: #fff;
                    stroke-width: 1.5px;
                }
                .node text {
                    font-size: 10px;
                    text-anchor: middle;
                    pointer-events: none;
                    text-shadow: 0 1px 0 #fff, 1px 0 0 #fff, 0 -1px 0 #fff, -1px 0 0 #fff;
                }
            `}</style>
        </div>
    );
};
