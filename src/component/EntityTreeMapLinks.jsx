import * as d3 from "d3";
import {useEffect, useRef} from "react";

export const EntityTreeMapLinks = ({ data }) => {
    const ref = useRef();

    useEffect(() => {
        const typeCounts = Array.from(data, ([type, count]) => ({ type, count }));

        const grouped = {
            children: [
                {
                    name: "Event",
                    children: typeCounts.filter(d => d.type.startsWith("Event"))
                },
                {
                    name: "Relationship",
                    children: typeCounts.filter(d => d.type.startsWith("Relationship"))
                }
            ]
        };

        const root = d3
            .hierarchy(grouped)
            .sum(d => Math.log1p(d.count || 0))
            .sort((a, b) => b.value - a.value);

        const onTypeSelect = (type) => {
            console.log("Selected type:", type);
        };

        const baseGroupColors = {
            Event: "#57a74e",
            Relationship: "#e1da57"
        };

        const getNodeColor = (type) => {
            if (type === "Event.Owns.Shareholdership") return "#57a74e";
            if (type === "Event.Owns.BeneficialOwnership") return "#45a437";
            if (type === "Event.WorksFor") return "#79e76c";

            if (type === "Relationship.FamilyRelationship") return "#e1da57";

            return "#bab0ab";
        };

        const svg = d3.select(ref.current);
        const width = 500, height = 350;

        svg.selectAll("*").remove();
        svg.attr("width", width).attr("height", height);

        const treemap = d3.treemap().size([width, height]).padding(1);
        treemap(root);

        const leaves = root.leaves();

        const cell = svg
            .selectAll("g")
            .data(leaves)
            .enter()
            .append("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .style("cursor", "pointer")
            .on("click", (event, d) => onTypeSelect(d.data.type));

        cell
            .append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => getNodeColor(d.data.type))
            .attr("stroke", "white");

        cell
            .append("text")
            .attr("x", 5)
            .attr("y", 18)
            .text(d => d.data.type)
            .attr("fill", "white")
            .attr("font-size", "13px")
            .style("display", d => (d.x1 - d.x0 > 100 && d.y1 - d.y0 > 30 ? "block" : "none"));

        cell
            .append("text")
            .attr("x", 5)
            .attr("y", 34)
            .text(d => `${d.data.count} nodes`)
            .attr("fill", "white")
            .attr("font-size", "12px")
            .style("display", d => (d.x1 - d.x0 > 100 && d.y1 - d.y0 > 30 ? "block" : "none"));

        cell.append("title").text(d =>
            d.data.type
                ? `${d.data.type}\n${d.data.count} nodes`
                : `${d.data.name}`
        );

        /*svg.selectAll("text.subgroup-title")
            .data(root.children) // depth-1 groups like "Person", "Organization"
            .enter()
            .append("text")
            .attr("class", "subgroup-title")
            .attr("x", d => d.x0 + 4)
            .attr("y", d => d.y0 + 16)
            .text(d => d.data.name)
            .attr("fill", "black")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .attr("pointer-events", "none");*/
    }, [data]);

    return <>
        <svg ref={ref}></svg>
    </>;
};
