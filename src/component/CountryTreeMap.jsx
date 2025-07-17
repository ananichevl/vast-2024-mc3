import * as d3 from "d3";
import {useEffect, useRef} from "react";

export const CountryTreeMap = ({ data, setSelectedTypes, selectedTypes }) => {
    const ref = useRef();

    const handleToggle = (type) => {
        const newSet = new Set(selectedTypes);
        if (newSet.has(type)) {
            newSet.delete(type);
        } else {
            newSet.add(type);
        }
        setSelectedTypes(newSet);
    };

    useEffect(() => {
        const typeCounts = Array.from(data, ([type, count]) => ({ type, count }));
        /*const grouped = {
            children: [
                {
                    name: "Person",
                    children: typeCounts.filter(d => d.type.startsWith("Entity.Person"))
                },
                {
                    name: "Organization",
                    children: typeCounts.filter(d => d.type.startsWith("Entity.Organization"))
                }
            ]
        };*/

        const root = d3.hierarchy({ children: typeCounts })
            .sum(d => d.count || 0)
            .sort((a, b) => b.value - a.value);

        const svg = d3.select(ref.current);
        const width = 800;
        const height = 600;

        svg.selectAll("*").remove();
        svg.attr("width", width).attr("height", height);

        const treemap = d3.treemap().size([width, height]).padding(1);
        treemap(root);

        const maxCount = d3.max(typeCounts, d => d.count);
        const minCount = d3.min(typeCounts, d => d.count);

        const colorScale = d3.scaleSequential()
            .domain([Math.log(minCount), Math.log(maxCount)])
            .interpolator(d3.interpolateTurbo);

        const getNodeColor = (count) => colorScale(Math.log(count || 1));

        const leaves = root.leaves();
        const cell = svg.selectAll("g")
            .data(leaves)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .style("cursor", "pointer")
                .on("click", (event, d) => handleToggle(d.data.type));

        cell.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => getNodeColor(d.data.count))
            .style("opacity", d => selectedTypes?.has(d.data.type) ? 1 : 0.6)
            .attr("stroke", d => selectedTypes?.has(d.data.type) ? "#1d4ed8" : "white")
            .attr("stroke-width", d => selectedTypes?.has(d.data.type) ? 3 : 1);

        cell.append("text")
            .attr("x", 5)
            .attr("y", 18)
            .text(d => d.data.type)
            .attr("fill", "white")
            .attr("font-size", "12px")
            .style("display", d => (d.x1 - d.x0 > 30 && d.y1 - d.y0 > 20 ? "block" : "none"));

        cell.append("title").text(d =>
            d.data.type
                ? `${d.data.type}\n${d.data.count} nodes`
                : `${d.data.name}`
        );

    }, [data, selectedTypes]);

    return (
        <>
            <svg ref={ref}></svg>
        </>
    );
};
