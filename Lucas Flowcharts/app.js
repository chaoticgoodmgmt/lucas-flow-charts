document.addEventListener('DOMContentLoaded', function() {
    const canvasContainer = document.getElementById('canvasContainer');
    const canvas = document.getElementById('canvas');
    const connectionCanvas = document.getElementById('connectionCanvas');
    const documentTitleElement = document.getElementById('documentTitle');
    const ctx = connectionCanvas.getContext('2d');
    let decisionCount = 0;
    let selectedDecisions = [];

    // Initialize jsPlumb
    const instance = jsPlumb.getInstance({
        Container: canvas
    });

    // Common endpoint style for the circles
    const endpointStyle = {
        endpoint: "Dot",
        paintStyle: { fill: "black", radius: 5 }, // Black circles
        isSource: true,
        isTarget: true,
        anchor: ["Top"], // Connect at the top of the decisions
        connector: ["Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true }],
        connectorStyle: { stroke: "gold", strokeWidth: 2 }, // Gold lines
        maxConnections: -1,
    };

    // Resize the connection canvas to match the container
    function resizeCanvas() {
        connectionCanvas.width = canvasContainer.scrollWidth;
        connectionCanvas.height = canvasContainer.scrollHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Add Decision Button
    document.getElementById('addDecision').addEventListener('click', function() {
        const decision = document.createElement('div');
        decision.className = 'decision';
        decision.id = 'decision' + decisionCount++;
        decision.innerText = 'Decision ' + decisionCount;
        decision.style.top = '50px';
        decision.style.left = '50px';
        decision.style.position = 'absolute';
        canvas.appendChild(decision);

        // Make the decision draggable and connectable using jsPlumb
        instance.draggable(decision.id);
        instance.addEndpoint(decision.id, { anchors: "Top" }, endpointStyle);

        // Click event to select the decision
        decision.addEventListener('mousedown', function(event) {
            event.stopPropagation(); // Prevent the event from bubbling up

            // Toggle selection
            if (selectedDecisions.includes(decision)) {
                selectedDecisions = selectedDecisions.filter(dec => dec !== decision);
                decision.classList.remove('selected');
            } else {
                if (selectedDecisions.length < 2) {
                    selectedDecisions.push(decision);
                    decision.classList.add('selected');
                } else {
                    alert('You can only select two decisions at a time.');
                }
            }
        });

        // Deselect if clicking anywhere else on the canvas
        canvas.addEventListener('mousedown', function(event) {
            selectedDecisions.forEach(dec => dec.classList.remove('selected'));
            selectedDecisions = [];
        });

        resizeCanvas(); // Adjust the canvas size to fit the new decision
    });

    // Create Connection Button
    document.getElementById('createConnection').addEventListener('click', function() {
        if (selectedDecisions.length === 2) {
            const [sourceDecision, targetDecision] = selectedDecisions;
            instance.connect({
                source: sourceDecision.id,
                target: targetDecision.id
            });
            selectedDecisions.forEach(dec => dec.classList.remove('selected'));
            selectedDecisions = [];
        } else {
            alert('Please select exactly two decisions to create a connection.');
        }
    });

    // Delete Decision Button
    document.getElementById('deleteDecision').addEventListener('click', function() {
        if (selectedDecisions.length > 0) {
            selectedDecisions.forEach(decision => {
                instance.remove(decision);
            });
            selectedDecisions = [];
            resizeCanvas(); // Adjust the canvas size after decision deletion
        } else {
            alert('Please select at least one decision to delete.');
        }
    });

    // Rename Decision Button
    document.getElementById('renameDecision').addEventListener('click', function() {
        if (selectedDecisions.length === 1) {
            const selectedDecision = selectedDecisions[0];
            const newName = prompt("Enter new name for the decision", selectedDecision.innerText);
            if (newName) {
                selectedDecision.innerText = newName;
            }
        } else {
            alert('Please select exactly one decision to rename.');
        }
    });

    // Add Title Button
    document.getElementById('addTitle').addEventListener('click', function() {
        const title = prompt("Enter the title for your document:");
        if (title) {
            documentTitleElement.innerText = title;
        }
    });

    // Download PDF Button
    document.getElementById('downloadPDF').addEventListener('click', function() {
        if (!documentTitleElement.innerText || documentTitleElement.innerText === "Untitled Document") {
            alert('Please add a title to your document before downloading.');
            return;
        }

        // Make sure all connections are cleared before capturing
        clearConnections();

        // Ensure that connections are drawn on the overlay canvas only when needed
        drawConnections();

        setTimeout(function() {
            html2canvas(canvasContainer).then(function(canvas) {
                clearConnections(); // Clear after drawing to avoid any residuals
                const imgData = canvas.toDataURL('image/png');
                const docDefinition = {
                    content: [
                        { text: documentTitleElement.innerText, style: 'header', alignment: 'center' },
                        { image: imgData, width: 500 }
                    ],
                    styles: {
                        header: {
                            fontSize: 18,
                            bold: true,
                            margin: [0, 0, 0, 10]
                        }
                    }
                };
                // Use pdfMake to create and download the PDF
                pdfMake.createPdf(docDefinition).download('flowchart.pdf');
            });
        }, 100); // Delay to ensure all decisions are rendered
    });

    // Function to draw connections on the overlay canvas
    function drawConnections() {
        ctx.clearRect(0, 0, connectionCanvas.width, connectionCanvas.height); // Clear previous connections
        const connections = instance.getAllConnections();
        connections.forEach(connection => {
            const sourceEndpoint = connection.endpoints[0].canvas.getBoundingClientRect();
            const targetEndpoint = connection.endpoints[1].canvas.getBoundingClientRect();
            const canvasRect = connectionCanvas.getBoundingClientRect();
            const sourcePos = {
                x: sourceEndpoint.left + sourceEndpoint.width / 2 - canvasRect.left,
                y: sourceEndpoint.top + sourceEndpoint.height / 2 - canvasRect.top
            };
            const targetPos = {
                x: targetEndpoint.left + targetEndpoint.width / 2 - canvasRect.left,
                y: targetEndpoint.top + targetEndpoint.height / 2 - canvasRect.top
            };
            drawLine(sourcePos, targetPos);
        });
    }

    // Function to draw a line between two points
    function drawLine(start, end) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = 'gold'; // Gold lines
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Function to clear connections before redrawing
    function clearConnections() {
        ctx.clearRect(0, 0, connectionCanvas.width, connectionCanvas.height);
    }

    // Extend Canvas Horizontally Button
    document.getElementById('extendHorizontal').addEventListener('click', function() {
        const currentWidth = canvas.style.width ? parseInt(canvas.style.width, 10) : canvas.clientWidth;
        canvas.style.width = (currentWidth + 500) + 'px'; // Increase width by 500px
        resizeCanvas();
    });

    // Extend Canvas Vertically Button
    document.getElementById('extendVertical').addEventListener('click', function() {
        const currentHeight = canvas.style.height ? parseInt(canvas.style.height, 10) : canvas.clientHeight;
        canvas.style.height = (currentHeight + 500) + 'px'; // Increase height by 500px
        resizeCanvas();
    });
});
