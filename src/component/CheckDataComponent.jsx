import React, {useEffect, useMemo} from 'react';
import {EntityTreemap} from "./EntityTreemap";
import {EntityTreeMapLinks} from "./EntityTreeMapLinks";

export const CheckDataComponent = ({data, subgraphs, title}) => {
    let minRevenue = Infinity;
    let maxRevenue = -Infinity;

    const maps = {
        country: new Map(),
        ProductServices: new Map(),
        PointOfContact: new Map(),
        HeadOfOrg: new Map(),
        TradeDescription: new Map(),
        founding_date: new Map(),
        type: new Map(),
        linkType: new Map(),
        linkSource: new Map(),
        linkTarget: new Map(),
    };

    const buildTrees = (nodes, links) => {
        const idToNode = new Map();
        const childMap = new Map();
        const parentMap = new Map();

        nodes.forEach(node => {
            idToNode.set(node.id, { ...node, children: [] });
        });

        links.forEach(link => {
            const source = link.source;
            const target = link.target;

            if (!childMap.has(source)) childMap.set(source, []);
            childMap.get(source).push(target);

            parentMap.set(target, source);
        });

        for (let [sourceId, childIds] of childMap.entries()) {
            const sourceNode = idToNode.get(sourceId);
            if (!sourceNode) continue;

            childIds.forEach(childId => {
                const childNode = idToNode.get(childId);
                if (childNode) {
                    sourceNode.children.push(childNode);
                }
            });
        }

        const roots = [];
        idToNode.forEach((node, id) => {
            if (!parentMap.has(id)) {
                roots.push(node);
            }
        });

        return roots;
    }

    const buildFullGraph = (startNodeId, nodes, links) => {
        const nodeMap = new Map();
        nodes.forEach(n => nodeMap.set(n.id, { ...n, children: [], parents: [] }));

        const forwardLinks = new Map(); // source ➝ list of links
        const backwardLinks = new Map(); // target ➝ list of links

        links.forEach(link => {
            const src = link.source;
            const tgt = link.target;

            if (!forwardLinks.has(src)) forwardLinks.set(src, []);
            forwardLinks.get(src).push(link);

            if (!backwardLinks.has(tgt)) backwardLinks.set(tgt, []);
            backwardLinks.get(tgt).push(link);

            // add structural references
            nodeMap.get(src)?.children.push(tgt);
            nodeMap.get(tgt)?.parents.push(src);
        });

        const visitedNodes = new Set();
        const visitedLinks = new Set();
        const queue = [startNodeId];

        while (queue.length > 0) {
            const currentId = queue.shift();
            if (visitedNodes.has(currentId)) continue;
            visitedNodes.add(currentId);

            const fLinks = forwardLinks.get(currentId) || [];
            for (const link of fLinks) {
                visitedLinks.add(link);
                if (!visitedNodes.has(link.target)) queue.push(link.target);
            }

            const bLinks = backwardLinks.get(currentId) || [];
            for (const link of bLinks) {
                visitedLinks.add(link);
                if (!visitedNodes.has(link.source)) queue.push(link.source);
            }
        }

        const subNodes = [...visitedNodes].map(id => nodeMap.get(id));
        const subLinks = [...visitedLinks];

        return { nodes: subNodes, links: subLinks };
    }

    const buildAllConnectedSubgraphs = (nodes, links) => {
        const allVisited = new Set();
        const subgraphs = [];

        for (const node of nodes) {
            if (allVisited.has(node.id)) continue;

            const { nodes: subNodes, links: subLinks } = buildFullGraph(node.id, nodes, links);

            subNodes.forEach(n => allVisited.add(n.id));

            subgraphs.push({ nodes: subNodes, links: subLinks });
        }

        return subgraphs;
    }


    const sortMapByValueDescending = (map) => {
        return new Map([...map.entries()].sort((a, b) => b[1] - a[1]));
    }

    if (data && data.nodes) {
        for (const node of data.nodes) {
            for (const key of Object.keys(maps)) {
                if (key === 'linkType' || key === 'linkSource' || key === 'linkTarget') {
                    continue;
                }
                const value = node[key] || 'UNKNOWN';
                maps[key].set(value, (maps[key].get(value) || 0) + 1);
            }

            const revenue = node.revenue;
            if (typeof revenue === 'number' && !isNaN(revenue)) {
                if (revenue < minRevenue) minRevenue = revenue;
                if (revenue > maxRevenue) maxRevenue = revenue;
            }
        }
    }
    if (data && data.links) {
        for (const link of data.links) {
            const value = link.type;
            maps['linkType'].set(value, (maps['linkType'].get(value) || 0) + 1);

            const target = link.target;
            const source = link.source;
            maps['linkSource'].set(source, (maps['linkSource'].get(source) || 0) + 1);
            maps['linkTarget'].set(target, (maps['linkTarget'].get(target) || 0) + 1);
        }
    }

    /*const trees = useMemo(() => {
        if (data?.nodes && data?.links) {
            return buildTrees(data.nodes, data.links);
        }
        return [];
    }, [data?.nodes, data?.links]);

    const subgraphs = useMemo(() => {
        if (data?.nodes && data?.links) {
            return buildAllConnectedSubgraphs(data.nodes, data.links);
        }
        return [];
    }, [data?.nodes, data?.links]);

    useEffect(() => {
        if (trees.length > 0) {
            const json = JSON.stringify(trees, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'trees.json';
            a.click();

            URL.revokeObjectURL(url);
        }
    }, [trees]);

    useEffect(() => {
        if (subgraphs.length > 0) {
            const json = JSON.stringify(subgraphs, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'subgraphs.json';
            a.click();

            URL.revokeObjectURL(url);
        }
    }, [subgraphs]);*/


    /*if (subgraphs && subgraphs.length !== 0) {
        console.log(analyzeAndSortSubgraphs(subgraphs));
    }*/

    Object.keys(maps).forEach(key => {
        maps[key] = sortMapByValueDescending(maps[key]);
    });

    console.log(maps.type);
    console.log(maps.linkType);
    console.log(maps.linkSource);
    console.log(maps.linkTarget);
    console.log(maps.country);
    console.log(maps.ProductServices);
    console.log(maps.PointOfContact);
    console.log(maps.HeadOfOrg);
    console.log(maps.TradeDescription);
    console.log(maps.founding_date);
    console.log(minRevenue);
    console.log(maxRevenue);

    return (
        <>
            {maps.type && maps.type.size > 0 && <EntityTreemap data={maps.type}/>}
            {maps.linkType && maps.linkType.size > 0 && <EntityTreeMapLinks data={maps.linkType}/>}
        </>
    );
};
