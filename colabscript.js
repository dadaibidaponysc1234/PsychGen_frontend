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
fetch('http://127.0.0.1:8000/api/country-collaboration/')
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
            .attr("dy", ".5em")
            .text(d => d);
    })
    .catch(error => {
        console.error('Error fetching data:', error);
    });

