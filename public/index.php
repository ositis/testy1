<!DOCTYPE html>
<html lang="en">
<head>
    <title>UK Hotel Map</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="/css/styles.css">
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-geometryutil@0.10.2/dist/leaflet.geometryutil.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
    <script src="/js/map.js" defer></script>
</head>
<body>
    <div id="map"></div>
    <div id="location-indicator"></div>
    <div id="sidebar-toggle" onclick="toggleSidebar()">
        <div class="burger-line"></div>
        <div class="burger-line"></div>
        <div class="burger-line"></div>
    </div>
    <div id="sidebar">
        <div>
            <label for="store-select">Select Store: </label>
            <select id="store-select"></select>
        </div>
        <div id="custom-address-container">
            <input type="text" id="custom-address-input" placeholder="Enter UK address (e.g., 10 Downing Street, London)">
            <button id="submit-address">Set Address</button>
        </div>
        <div id="settings">
            <details>
                <summary>Settings</summary>
                <div class="toggle-container">
                    <label for="hide-unavailable-amenities">Hide Unavailable Amenities</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="hide-unavailable-amenities">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="toggle-container">
                    <label for="show-all-lines">Show All Lines</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="show-all-lines">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="toggle-container">
                    <label for="show-distance-labels">Show Distance Labels</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="show-distance-labels">
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="toggle-container">
                    <label for="top3-toggle">Show Top 3 Nearest Only</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="top3-toggle" checked>
                        <span class="slider"></span>
                    </label>
                </div>
                <div class="toggle-container">
                    <label for="auto-tooltips">Show Disciplines for Top 3</label>
                    <label class="toggle-switch">
                        <input type="checkbox" id="auto-tooltips" checked>
                        <span class="slider"></span>
                    </label>
                </div>
            </details>
        </div>
        <div id="amenity-filters">
            <details>
                <summary>Filters</summary>
                <div id="amenity-list"></div> <!-- Dynamic amenities will be inserted here -->
            </details>
        </div>
        <div id="distance-list">Click a store or select from the dropdown to see distances</div>
        <div id="stats"></div>
        <button onclick="map.setView([54.0, -2.0], 6)">Reset Zoom</button>
    </div>
</body>
</html>
