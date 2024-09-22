document.addEventListener("DOMContentLoaded", function() {
    const apiBaseUrl = 'https://algorithmxcomp.pythonanywhere.com/api'; // Update if necessary
    // const apiBaseUrl = 'http://127.0.0.1:8000/api'; // Update if necessary
    let currentPage = 1;

    // Initialize Charts
    const charts = {};

    function initializeCharts() {
        charts.disorderStudyCountChart = createChart('disorderStudyCountChart', 'bar', ['Disorder Study Count']);
        charts.researchRegionStudyCountChart = createChart('researchRegionStudyCountChart', 'bar', ['Research Region Study Count']);
        charts.biologicalModalityStudyCountChart = createChart('biologicalModalityStudyCountChart', 'bar', ['Biological Modality Study Count']);
        charts.geneticSourceMaterialStudyCountChart = createChart('geneticSourceMaterialStudyCountChart', 'bar', ['Genetic Source Material Study Count']);
        charts.yearlyStudyCountChart = createChart('yearlyStudyCountChart', 'line', ['Yearly Study Count', 'impact factor']);
        charts.citationStudyCountChart = createChart('citationStudyCountChart', 'line', ['citation count']);
    }

    function createChart(canvasId, type, label) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: type,
            data: {
                labels: [],
                datasets: [{
                    label: label[0],
                    data: [],
                    backgroundColor: generateColors(type),
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    fill: type === 'line' ? false : true,
                },
                {
                    label: label[1],
                    data: [],
                    backgroundColor: generateColors(type),
                    borderColor: 'rgba(0, 128, 0, 1)',
                    borderWidth: 1,
                    fill: type === 'line' ? false : true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 1.5,  // Adjust this for smaller charts
                scales: {
                    y: {
                        beginAtZero: true,
                        display: type !== 'pie' // Hide y-axis for pie charts
                    }
                }
            }
        });
    }

    function generateColors(type) {
        if (type === 'pie') {
            return [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)'
            ];
        }
        return 'rgba(54, 162, 235, 0.6)';  // Default for other types
    }

    function fetchAndUpdateChart(apiEndpoint, chartKey, labelKey = null) {
        fetch(`${apiBaseUrl}${apiEndpoint}`)
            .then(response => response.json())
            .then(data => {
                const labels = [];
                const counts = [];
                const counts1 = [];

                data.forEach(item => {
                    if (labelKey) {
                        labels.push(item[labelKey]);
                    } else {
                        labels.push(Object.values(item)[0]);
                    }
                    counts.push(item.study_count);
                    // counts.push(item.citation);
                    counts1.push(item.impact_factor);

                });

                charts[chartKey].data.labels = labels;
                charts[chartKey].data.datasets[0].data = counts;
                charts[chartKey].data.datasets[1].data = counts1;
                charts[chartKey].update();
            })
            .catch(error => console.error(`Error fetching ${chartKey} data:`, error));
    }

    function fetchAndUpdateChartforcitation(apiEndpoint, chartKey, labelKey = null) {
        fetch(`${apiBaseUrl}${apiEndpoint}`)
            .then(response => response.json())
            .then(data => {
                const labels = [];
                const citation = [];
                // const counts1 = [];

                data.forEach(item => {
                    if (labelKey) {
                        labels.push(item[labelKey]);
                    } else {
                        labels.push(Object.values(item)[0]);
                    }
                    citation.push(item.citation);
                    // counts1.push(item.impact_factor);
                });

                charts[chartKey].data.labels = labels;
                charts[chartKey].data.datasets[0].data = citation;
                // charts[chartKey].data.datasets[1].data = counts1;
                charts[chartKey].update();
            })
            .catch(error => console.error(`Error fetching ${chartKey} data:`, error));
    }

    document.getElementById('uploadCsvButton').addEventListener('click', () => {
        const fileInput = document.getElementById('csvFileInput');
        const uploadStatus = document.getElementById('uploadStatus');

        if (fileInput.files.length === 0) {
            uploadStatus.textContent = 'Please select a file to upload.';
            uploadStatus.style.color = 'red';
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        fetch(`${apiBaseUrl}/upload-csv/`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                uploadStatus.textContent = data.message;
                uploadStatus.style.color = 'green';
            } else if (data.errors) {
                uploadStatus.textContent = `Error: ${data.errors[0].error}`;
                uploadStatus.style.color = 'red';
            }
        })
        .catch(error => {
            uploadStatus.textContent = 'Error uploading file.';
            uploadStatus.style.color = 'red';
            console.error('Upload Error:', error);
        });
    });

    document.getElementById('downloadCsvExampleButton').addEventListener('click', () => {
        window.location.href = `${apiBaseUrl}/download-csv-example/`;
    });

    function fetchStudies(queryParams = '') {
        fetch(`${apiBaseUrl}/studies/?page=${currentPage}&${queryParams}`)
            .then(response => response.json())
            .then(data => {
                const studyList = document.getElementById('studyList');

                data.results.forEach(study => {
                    const studyItem = document.createElement('div');
                    studyItem.className = 'study-item';
                    studyItem.innerHTML = `
                        <input type="checkbox" class="study-checkbox" value="${study.id}">
                        <h5>${study.title}</h5>
                        <p><strong>Author:</strong> ${study.lead_author}</p>
                        <p><strong>Year:</strong> ${study.year}</p>
                        <p><strong>Journal:</strong> ${study.journal_name}</p>
                        <p><strong>Impact Factor:</strong> ${study.impact_factor}</p>
                    `;
                    studyList.appendChild(studyItem);
                });

                if (data.next) {
                    document.getElementById('loadMoreButton').style.display = 'block';
                } else {
                    document.getElementById('loadMoreButton').style.display = 'none';
                }
            })
            .catch(error => console.error('Error fetching studies:', error));
    }

    document.getElementById('searchButton').addEventListener('click', () => {
        const searchTitle = document.getElementById('searchTitle').value.trim();
        document.getElementById('studyList').innerHTML = '';
        currentPage = 1;
        fetchStudies(`title=${encodeURIComponent(searchTitle)}`);
    });

    document.getElementById('loadMoreButton').addEventListener('click', () => {
        currentPage++;
        fetchStudies();
    });

    document.getElementById('deleteSelectedButton').addEventListener('click', () => {
        const selectedCheckboxes = document.querySelectorAll('.study-checkbox:checked');
        const idsToDelete = Array.from(selectedCheckboxes).map(cb => cb.value);

        if (idsToDelete.length === 0) {
            alert('No studies selected for deletion.');
            return;
        }

        fetch(`${apiBaseUrl}/studies/delete-multiple/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids: idsToDelete }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                document.getElementById('studyList').innerHTML = ''; // Clear the list and refetch
                fetchStudies();
            } else if (data.errors) {
                alert(`Error: ${data.errors[0].error}`);
            }
        })
        .catch(error => {
            alert('Error deleting studies.');
            console.error('Deletion Error:', error);
        });
    });

    fetchStudies();
    initializeCharts();
    fetchAndUpdateChart('/disorder-study-count/', 'disorderStudyCountChart', 'disorder__disorder_name');
    fetchAndUpdateChart('/research-region-study-count/', 'researchRegionStudyCountChart', 'countries__name');
    fetchAndUpdateChart('/biological-modality-study-count/', 'biologicalModalityStudyCountChart', 'biological_modalities__modality_name');
    fetchAndUpdateChart('/genetic-source-material-study-count/', 'geneticSourceMaterialStudyCountChart', 'genetic_source_materials__material_type');
    fetchAndUpdateChart('/yearly-study-count/', 'yearlyStudyCountChart', 'year');
    fetchAndUpdateChartforcitation('/yearly-study-count/', 'citationStudyCountChart', 'year');
});



function fetchSuggestions(query) {
    if (query.length === 0) return; // No query, no need to fetch

    // fetch(`http://127.0.0.1:8000/api/suggestions/?query=${query}`)
    fetch(`https://algorithmxcomp.pythonanywhere.com/api/suggestions/?query=${query}`)
        .then(response => response.json())
        .then(data => {
            // Use data to display suggestions (study_titles, disorders, authors)
            console.log(data);
        })
        .catch(error => {
            console.error('Error fetching suggestions:', error);
        });
}
// ======================== Chord Diagram: Africa vs. Other Regions ===================================
// Define the African regions and all regions
const regions = {
    "NORTH AMERICA": ["UNITED STATES", "CANADA", "MEXICO", "GREENLAND", "CUBA", "HAITI", "DOMINICAN REPUBLIC", "JAMAICA", "PUERTO RICO"],
    "SOUTH AMERICA": ["BRAZIL", "ARGENTINA", "CHILE", "PERU", "COLOMBIA", "VENEZUELA", "ECUADOR", "BOLIVIA", "PARAGUAY", "URUGUAY", "GUYANA", "SURINAME"],
    "EUROPE": ["UNITED KINGDOM", "GERMANY", "FRANCE", "ITALY", "SPAIN", "SWEDEN", "NETHERLANDS", "BELGIUM", "NORWAY", "DENMARK", "FINLAND", "IRELAND", "PORTUGAL", "POLAND", "AUSTRIA", "SWITZERLAND", "CZECH REPUBLIC", "HUNGARY", "GREECE", "ICELAND", "LUXEMBOURG", "MONACO", "SLOVAKIA", "SLOVENIA", "BOSNIA AND HERZEGOVINA", "CROATIA", "SERBIA", "MONTENEGRO", "NORTH MACEDONIA", "BULGARIA", "ROMANIA", "ALBANIA", "ESTONIA", "LATVIA", "LITHUANIA", "BELARUS", "RUSSIA", "UKRAINE", "MOLDOVA", "KOSOVO", "MALTA", "CYPRUS"],
    "ASIA": ["CHINA", "JAPAN", "INDIA", "SAUDI ARABIA", "SOUTH KOREA", "NORTH KOREA", "VIETNAM", "THAILAND", "PHILIPPINES", "INDONESIA", "MALAYSIA", "SINGAPORE", "MYANMAR", "LAOS", "CAMBODIA", "NEPAL", "BHUTAN", "BANGLADESH", "SRI LANKA", "MALDIVES", "PAKISTAN", "AFGHANISTAN", "IRAN", "IRAQ", "SYRIA", "LEBANON", "ISRAEL", "JORDAN", "YEMEN", "OMAN", "UNITED ARAB EMIRATES", "KUWAIT", "QATAR", "BAHRAIN", "TAIWAN", "MONGOLIA", "KAZAKHSTAN", "UZBEKISTAN", "TURKMENISTAN", "KYRGYZSTAN", "TAJIKISTAN", "ARMENIA", "AZERBAIJAN", "GEORGIA"],
    "OCEANIA": ["AUSTRALIA", "NEW ZEALAND", "FIJI", "PAPUA NEW GUINEA", "SOLOMON ISLANDS", "VANUATU", "SAMOA", "TONGA", "KIRIBATI", "TUVALU", "NAURU", "PALAU", "MARSHALL ISLANDS", "MICRONESIA"],
    "NORTHERN AFRICA": ["MOROCCO", "EGYPT", "TUNISIA", "ALGERIA", "LIBYA", "SUDAN"],
    "EASTERN AFRICA": ["KENYA", "UGANDA", "RWANDA", "SEYCHELLES", "TANZANIA", "SOMALIA", "ETHIOPIA", "ERITREA", "DJIBOUTI", "MADAGASCAR", "MAURITIUS", "COMOROS"],
    "MIDDLE AFRICA": ["CENTRAL AFRICAN REPUBLIC", "DEMOCRATIC REPUBLIC OF THE CONGO", "GABON", "CONGO", "CHAD", "EQUATORIAL GUINEA", "SÃO TOMÉ AND PRÍNCIPE", "ANGOLA"],
    "WESTERN AFRICA": ["GHANA", "NIGERIA", "SENEGAL", "MALI", "BENIN", "TOGO", "NIGER", "BURKINA FASO", "GUINEA", "SIERRA LEONE", "LIBERIA", "IVORY COAST", "CAPE VERDE", "GAMBIA", "GUINEA-BISSAU", "MAURITANIA"],
    "SOUTHERN AFRICA": ["SOUTH AFRICA", "NAMIBIA", "BOTSWANA", "ZIMBABWE", "ZAMBIA", "MALAWI", "MOZAMBIQUE", "LESOTHO", "ESWATINI"]
};

// Define African regions for easier identification
const africanRegions = ["NORTHERN AFRICA", "EASTERN AFRICA", "MIDDLE AFRICA", "WESTERN AFRICA", "SOUTHERN AFRICA"];

// Create a color scale for regions
const regionColors = d3.scaleOrdinal()
    .domain(Object.keys(regions))
    .range(d3.schemeCategory10);

// Create a reverse lookup for country -> region
const countryToRegion = {};
for (const [region, countries] of Object.entries(regions)) {
    countries.forEach(country => {
        countryToRegion[country] = region;
    });
}

// Fetch data from the Django API
// fetch('http://127.0.0.1:8000/api/country-collaboration/')
fetch('https://algorithmxcomp.pythonanywhere.com/api/country-collaboration/')
    .then(response => response.json())
    .then(data => {
        let matrix = data.matrix;
        let countries = data.countries;

        if (!matrix.length) {
            document.getElementById('chart').innerHTML = '<p>No data available</p>';
            return;
        }

        // Sort countries by region
        const sortedCountries = [];
        Object.keys(regions).forEach(region => {
            regions[region].forEach(country => {
                if (countries.includes(country)) {
                    sortedCountries.push(country);
                }
            });
        });

        // Rearrange the matrix based on the sorted countries
        const sortedMatrix = sortedCountries.map((_, i) =>
            sortedCountries.map((_, j) => matrix[countries.indexOf(sortedCountries[i])][countries.indexOf(sortedCountries[j])])
        );

        countries = sortedCountries;
        matrix = sortedMatrix;

        // Modify the matrix to show intra-African relationships and Africa to other regions
        const africaMatrix = matrix.map((row, i) => row.map((value, j) => {
            const isAfricaI = africanRegions.includes(countryToRegion[countries[i]]);
            const isAfricaJ = africanRegions.includes(countryToRegion[countries[j]]);
            
            // Keep relationships between African countries and between Africa and other regions
            if (isAfricaI && isAfricaJ) {
                return value; // Intra-African connections should remain
            } else if (isAfricaI || isAfricaJ) {
                return value; // Connections between Africa and other regions should remain
            }

            // Set relationships between non-African regions to zero
            return 0;
        }));

        // Reverse the direction of non-African to African relationships
        const reversedAfricaMatrix = africaMatrix.map((row, i) => row.map((value, j) => {
            const isAfricaI = africanRegions.includes(countryToRegion[countries[i]]);
            const isAfricaJ = africanRegions.includes(countryToRegion[countries[j]]);

            // Reverse the direction for non-African to African connections
            return isAfricaI && !isAfricaJ ? africaMatrix[j][i] : value;
        }));

        const width = 900;
        const height = 900;
        const outerRadius = Math.min(width, height) / 2 - 200;
        const innerRadius = outerRadius - 1.5;

        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const chord = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending);

        const chords = chord(reversedAfricaMatrix);

        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        const ribbon = d3.ribbon()
            .radius(innerRadius - 5);

        const group = svg.append("g")
            .selectAll("g")
            .data(chords.groups)
            .enter().append("g");

        // Draw arcs
        group.append("path")
            .style("fill", d => regionColors(countryToRegion[countries[d.index]]))
            .style("stroke", d => d3.rgb(regionColors(countryToRegion[countries[d.index]])).darker())
            .attr("d", arc);

        // Add text labels
        group.append("text")
            .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
            .attr("dy", ".5em")
            .attr("transform", d => `
                rotate(${(d.angle * 180 / Math.PI - 90)})
                translate(${outerRadius + 4})
                ${d.angle > Math.PI ? "rotate(180)" : ""}
            `)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .text(d => countries[d.index]);

        // Draw ribbons (connections between countries)
        svg.append("g")
            .selectAll("path")
            .data(chords)
            .enter().append("path")
            .attr("d", ribbon)
            .style("fill", d => regionColors(countryToRegion[countries[d.target.index]]))
            .style("stroke", d => d3.rgb(regionColors(countryToRegion[countries[d.target.index]])).darker())
            .style("stroke-width", 0.1)
            .style("opacity", 0.4);

        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .selectAll("g")
            .data(Object.keys(regions))
            .enter().append("g")
            .attr("transform", (d, i) => `translate(${-(width / 2)},${i * 20 - height / 2 })`);

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 20)
            .attr("height", 16)
            .style("fill", d => regionColors(d));

        legend.append("text")
            .attr("x", 20)
            .attr("y", 9)
            .attr("dy", ".20em")
            .text(d => d);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });

