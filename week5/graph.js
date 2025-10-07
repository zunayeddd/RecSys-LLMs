// graph.js
const graphVisualization = {
    svg: null,
    simulation: null,
    
    render(graph, pagerankScores, selectedNode = null) {
        const container = document.getElementById('graph');
        container.innerHTML = '';
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.svg = d3.select('#graph')
            .append('svg')
            .attr('width', width)
            .attr('height', height);
        
        // Calculate node sizes based on PageRank scores
        const scores = pagerankScores ? Object.values(pagerankScores) : [];
        const minScore = scores.length > 0 ? Math.min(...scores) : 0;
        const maxScore = scores.length > 0 ? Math.max(...scores) : 1;
        
        const scaleNodeSize = d3.scaleLinear()
            .domain([minScore, maxScore])
            .range([5, 20]);
        
        const scaleColor = d3.scaleSequential(d3.interpolateBlues)
            .domain([minScore, maxScore]);
        
        // Create links
        const links = this.svg.append('g')
            .selectAll('line')
            .data(graph.edges)
            .enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1);
        
        // Create nodes
        const nodes = this.svg.append('g')
            .selectAll('circle')
            .data(graph.nodes)
            .enter()
            .append('circle')
            .attr('r', d => {
                if (!pagerankScores) return 8;
                return scaleNodeSize(pagerankScores[d.id]);
            })
            .attr('fill', d => {
                if (!pagerankScores) return '#69b3a2';
                return scaleColor(pagerankScores[d.id]);
            })
            .attr('stroke', d => d.id === selectedNode ? '#ff0000' : '#fff')
            .attr('stroke-width', d => d.id === selectedNode ? 3 : 2)
            .call(d3.drag()
                .on('start', (event, d) => this.dragStarted(event, d))
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', (event, d) => this.dragEnded(event, d)));
        
        // Add node labels
        const labels = this.svg.append('g')
            .selectAll('text')
            .data(graph.nodes)
            .enter()
            .append('text')
            .text(d => d.id)
            .attr('font-size', '10px')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .attr('fill', '#333');
        
        // Add tooltips
        nodes.append('title')
            .text(d => {
                const score = pagerankScores ? pagerankScores[d.id] : 'N/A';
                return `Node ${d.id}\nPageRank: ${typeof score === 'number' ? score.toFixed(4) : score}`;
            });
        
        // Set up force simulation
        this.simulation = d3.forceSimulation(graph.nodes)
            .force('link', d3.forceLink(graph.edges).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => {
                if (!pagerankScores) return 12;
                return scaleNodeSize(pagerankScores[d.id]) + 5;
            }));
        
        // Update positions on simulation tick
        this.simulation.on('tick', () => {
            links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            nodes
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
            
            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });
        
        // Add click handlers
        nodes.on('click', (event, d) => {
            event.stopPropagation();
            app.selectNode(d.id);
        });
        
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                this.svg.selectAll('g').attr('transform', event.transform);
            });
        
        this.svg.call(zoom);
    },
    
    dragStarted(event, d) {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    },
    
    dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    },
    
    dragEnded(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
};
