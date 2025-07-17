import React, {useEffect, useMemo, useState} from "react";
import {Box, Divider, Paper} from "@mui/material";
import {FilterRow} from "./FilterRow";
import {AllNodesList} from "./AllNodesList";
import {SubgraphNodeList} from "./SubgraphNodeList";
import {ForceGraph} from "./ForceGraph";

export const Dashboard = ({graph, subgraphs, countries}) => {
    const [selectedCountries, setSelectedCountries] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [allNodes, setAllNodes] = useState(new Map());
    const [selectedRowIndex, setSelectedRowIndex] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedRevenueRange, setSelectedRevenueRange] = useState(null);
    const [depth, setDepth] = useState(1);

    const analyzeAndSortSubgraphs = (subgraphs) => {
        const resultMap = new Map();

        for (let i = 0; i < subgraphs.length; i++) {
            let { nodes = [], links = [] } = subgraphs[i];

            if (selectedRevenueRange) {
                let [minRevenue, maxRevenue] = selectedRevenueRange;
                if (minRevenue === 1) {
                    minRevenue = 0;
                }
                nodes = nodes.filter(node => {
                    const revenue = parseFloat(node.revenue) || 0;
                    return revenue >= minRevenue && revenue <= maxRevenue && (!searchTerm || node.id.toLowerCase().includes(searchTerm.toLowerCase())) && (selectedCountries.size === 0 || selectedCountries.has(node.country));
                });

                // Remove links not connected to filtered nodes
                const validNodeIds = new Set(nodes.map(n => n.id));
                links = links.filter(link =>
                    validNodeIds.has(link.source) && validNodeIds.has(link.target)
                );
            }

            let totalRevenue = 0;
            let biggestCompanyName = '';
            let biggestLinkCompany = '';
            let maxRevenue = -Infinity;
            let maxOutgoingLinks = -1;

            const outgoingLinkCount = {};
            for (const link of links) {
                if (link.source) {
                    outgoingLinkCount[link.source] = (outgoingLinkCount[link.source] || 0) + 1;
                }
            }

            for (const node of nodes) {
                // Assuming node has a revenue field (number), otherwise default to 0
                const revenue = parseFloat(node.revenue) || 0;
                totalRevenue += revenue;

                if (revenue > maxRevenue && node.type && node.type.includes("Entity.Organization")) {
                    maxRevenue = revenue;
                    biggestCompanyName = node.id || '';
                }

                if (node.type && node.type.includes("Entity.Organization")) {
                    const outLinks = outgoingLinkCount[node.id] || 0;

                    if (
                        outLinks > maxOutgoingLinks ||
                        (outLinks === maxOutgoingLinks && revenue > maxRevenue)
                    ) {
                        maxOutgoingLinks = outLinks;
                        maxRevenue = revenue;
                        biggestLinkCompany = node.id || '';
                    }
                }
            }

            const averageRevenue = nodes.length > 0 ? totalRevenue / nodes.length : 0;

            resultMap.set(i, {
                countNodes: nodes.length,
                countLinks: links.length,
                totalRevenue,
                averageRevenue,
                biggestCompanyName,
                biggestLinkCompany
            });
        }

        // Sort Map by countNodes descending
        return new Map([...resultMap.entries()].sort((a, b) => b[1].countNodes - a[1].countNodes));
    }

    useEffect(() => {
        if (subgraphs) {
            const sortedMap = analyzeAndSortSubgraphs(subgraphs);
            setAllNodes(sortedMap);
            /*const filteredNodes = selectedSubgraph?.nodes?.filter(node =>
                node.type === "Entity.Organization.Company" &&
                node.country === "Uziland" &&
                node.ProductServices !== "Unknown"
            );

            const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

            const filteredLinks = selectedSubgraph?.links?.filter(link =>
                filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
            );*/
        }
    }, [subgraphs, selectedRevenueRange, searchTerm, selectedCountries  ]);

    function buildSubgraph(selectedId, allNodes, allLinks) {
        const nodesMap = new Map(allNodes.map(n => [n.id, n]));

        const firstLevelLinks = allLinks.filter(link => link.source === selectedId);

        const firstLevelTargets = new Set(firstLevelLinks.map(l => l.target));

        const secondLevelLinks = allLinks.filter(
            link => firstLevelTargets.has(link.source) || firstLevelTargets.has(link.target)
        );

        const secondLevelNodeIds = new Set();
        secondLevelLinks.forEach(link => {
            secondLevelNodeIds.add(link.source);
            secondLevelNodeIds.add(link.target);
        });

        const allNodeIds = new Set([selectedId, ...firstLevelTargets, ...secondLevelNodeIds]);

        const nodes = [...allNodeIds].map(id => {
            const node = nodesMap.get(id);
            return {
                id,
                name: node?.name || id,
                type: node?.type || "Unknown",
            };
        });

        const links = [...firstLevelLinks, ...secondLevelLinks];

        return { nodes, links };
    }

    function buildSubgraphDepth(selectedId, allNodes, allLinks, depth = 2) {
        const nodesMap = new Map(allNodes.map(n => [n.id, n]));
        const visitedNodeIds = new Set();
        const collectedLinks = new Set();

        // Initialize frontier with selected node
        let currentLevelNodeIds = new Set([selectedId]);
        visitedNodeIds.add(selectedId);

        for (let level = 0; level < depth; level++) {
            const nextLevelNodeIds = new Set();

            allLinks.forEach(link => {
                const sourceId = typeof link.source === "object" ? link.source.id : link.source;
                const targetId = typeof link.target === "object" ? link.target.id : link.target;

                if (currentLevelNodeIds.has(sourceId) || currentLevelNodeIds.has(targetId)) {
                    collectedLinks.add(link);
                    if (!visitedNodeIds.has(sourceId)) nextLevelNodeIds.add(sourceId);
                    if (!visitedNodeIds.has(targetId)) nextLevelNodeIds.add(targetId);
                }
            });

            // Add current level nodes to visited
            for (const id of nextLevelNodeIds) {
                visitedNodeIds.add(id);
            }

            currentLevelNodeIds = nextLevelNodeIds;
        }

        // Collect nodes based on visited IDs
        const nodes = Array.from(visitedNodeIds).map(id => {
            const node = nodesMap.get(id);
            return {
                id,
                name: node?.name || id,
                type: node?.type || "Unknown",
            };
        });

        // Convert Set to array
        const links = Array.from(collectedLinks);

        return { nodes, links };
    }

    const graphData = useMemo(() => {
        return selectedNodeId && buildSubgraphDepth(selectedNodeId, graph.nodes, graph.links, depth);
    }, [depth, selectedNodeId, graph?.nodes, graph?.links]);

    return (
        <Box display="flex" height="100vh" padding={2} gap={2}>

            {/* Left Panel */}
            <Box
                width="40%"
                component={Paper}
                elevation={3}
                padding={2}
                display="flex"
                flexDirection="column"
                overflow="auto"
            >
                <FilterRow data={graph}
                           selectedRevenueRange={selectedRevenueRange}
                           setSelectedRevenueRange={setSelectedRevenueRange}
                           searchTerm={searchTerm}
                           setSearchTerm={setSearchTerm}
                           selectedTypes={selectedCountries}
                           setSelectedTypes={setSelectedCountries}
                           countries={countries}
                />
                <Divider sx={{my: 2}}/>
                <AllNodesList dataMap={allNodes} selectedRowIndex={selectedRowIndex}
                              setSelectedRowIndex={setSelectedRowIndex}/>
            </Box>

            {/* Right Panel */}
            <Box
                flex={1}
                component={Paper}
                elevation={3}
                padding={2}
                overflow="auto"
            >
                {selectedRowIndex !== null && (
                    <SubgraphNodeList
                        subgraph={subgraphs[selectedRowIndex]}
                        selectedNodeId={selectedNodeId}
                        onSelectNode={(nodeId) => {
                            setSelectedNodeId(nodeId);

                        }}
                    />
                )}
                {selectedNodeId !== null && (
                    <ForceGraph graphData={graphData} depth={depth} setDepth={setDepth}/>
                )}
            </Box>
        </Box>
    );
}
