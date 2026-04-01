// Airtable Connection Details
const personalAccessToken = 'pat8YgpxMOutcFbk8.8cde4fdfb5d2445441fc11c0b50910415ec2aa0c810811fdfa930bdd892fd70a';
const baseId = 'appuzIP4S09O1J427';
const tableName ='tbly2pqDVtjTJ6Bt2';
const url = 'https://api.airtable.com/v0/${baseId}/${tableName}';
// Fetching Data from Airtable
async function fetchPlaces() {
    try {
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${personalAccessToken}` }
        });
        const data = await response.json();

        if (data.error) {
            console.error("Airtable Error:", data.error.message);
            return;
        }
        displayPlaces(data.records);
    } catch (error) {
        console.error("Connection Error:", error);
    }
}

function displayPlaces(records) {
    const container = document.getElementById('places-container');
    if (!container) return;
    container.innerHTML = '';

    records.forEach(record => {
        const fields = record.fields;
        const name = fields["Name"] || "Unnamed Spot";
        const images = fields["Images"] || "No description available.";
        const mapslink = fields["Maps Link"] || "San Francisco, CA";
        const hoursofaccess = fields["Hours of Access"] || "Always Open";
        const neighborhood = fields["Neighborhood"] || "No description available.";
        const reviews = fields["Reviews"] || "No address provided.";
        const parkingavailability = fields["Parking Availability"] || "No description available.";
        const website = fields["Website"] || "No address provided.";

        let imageUrl = (fields["Images"] && fields["Images"].length > 0) ? fields["Images"][0].url : 'https://via.placeholder.com/400x250';

        const cardHTML = `
        <div class="col">
            <div class="card h-100 shadow-sm border-0">
                <div class="position-relative">
                    <img src="${imageUrl}" class="card-img-top" alt="${name}">
                    <span class="badge bg-primary position-absolute top-0 end-0 m-3 shadow-sm">
                        ${fields.Stars || '5.0'} ★
                    </span>
                </div>
                <div class="card-body p-4 d-flex flex-column">
                    <h5 class="card-title fw-bold">${name}</h5>
                    <p class="card-text text-muted mb-4 small">${desc.substring(0, 90)}...</p>

                    <div class="mt-auto">
                        <button class="btn btn-outline-primary w-100 rounded-pill mb-2 spot-detail-btn"
                                data-name="${name}"
                                data-bio="${desc}"
                                data-addr="${addr}"
                                data-hours="${hours}">
                            VIEW SPOT DETAILS
                        </button>

                        <a href="${fields.Website || '#'}" target="_blank" class="btn btn-outline-dark w-100 rounded-pill">
                            VISIT OFFICIAL SITE
                        </a>
                    </div>
                </div>
            </div>
        </div>`;
        container.innerHTML += cardHTML;
    });

    // New way to handle the clicks
    setupModalButtons();
}










//start app
fetchPlaces();