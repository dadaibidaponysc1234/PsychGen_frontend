document.addEventListener("DOMContentLoaded", function() {
    const apiBaseUrl = 'https://algorithmxcomp.pythonanywhere.com/api'; // Update if necessary
    let currentPage = 1;

    // Initialize Charts
    const charts = {};

    function initializeCharts() {
        charts.disorderStudyCountChart = createChart('disorderStudyCountChart', 'pie', 'Disorder Study Count');
        charts.researchRegionStudyCountChart = createChart('researchRegionStudyCountChart', 'pie', 'Research Region Study Count');
        charts.biologicalModalityStudyCountChart = createChart('biologicalModalityStudyCountChart', 'pie', 'Biological Modality Study Count');
        charts.geneticSourceMaterialStudyCountChart = createChart('geneticSourceMaterialStudyCountChart', 'pie', 'Genetic Source Material Study Count');
        charts.yearlyStudyCountChart = createChart('yearlyStudyCountChart', 'line', 'Yearly Study Count');
    }

    function createChart(canvasId, type, label) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: type,
            data: {
                labels: [],
                datasets: [{
                    label: label,
                    data: [],
                    backgroundColor: generateColors(type),
                    borderColor: 'rgba(54, 162, 235, 1)',
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

                data.forEach(item => {
                    if (labelKey) {
                        labels.push(item[labelKey]);
                    } else {
                        labels.push(Object.values(item)[0]);
                    }
                    counts.push(item.study_count);
                });

                charts[chartKey].data.labels = labels;
                charts[chartKey].data.datasets[0].data = counts;
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
    fetchAndUpdateChart('/research-region-study-count/', 'researchRegionStudyCountChart', 'research_regions__name');
    fetchAndUpdateChart('/biological-modality-study-count/', 'biologicalModalityStudyCountChart', 'biological_modalities__modality_name');
    fetchAndUpdateChart('/genetic-source-material-study-count/', 'geneticSourceMaterialStudyCountChart', 'genetic_source_materials__material_type');
    fetchAndUpdateChart('/yearly-study-count/', 'yearlyStudyCountChart', 'year');
});
