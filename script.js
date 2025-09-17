// Game state variables
const gameState = {
    funds: settings.startingFunds,
    vehicles: [],
    buildings: [],
    vehicleCounter: 0,
    buildingCounter: 0,
    missionCounter: 0,
    activeMissions: {},
    hasSeasonPass: false,
    seasonPassPoints: 0,
    claimedRewards: {
        free: [],
        premium: []
    },
    lastResetTime: Date.now(),
    failedMissions: 0, 
    rank: {
        score: 0,
        level: "Rookie"
    },
    // Add custom image URLs to gameState for persistence
    customImages: {
        vehicle: settings.vehicleIconUrl,
        heavyPumper: settings.heavyPumperIconUrl,
        ambulance: settings.ambulanceIconUrl,
        paramedic: settings.paramedicIconUrl,
        micaSR: 'https://i.imgur.com/GzB2n8y.png'
    },
};

const costs = settings.costs;

// Map and UI elements
let map;

// Initialize icons from settings
const vehicleIcon = L.icon({
    iconUrl: settings.vehicleIconUrl,
    iconSize: [38, 38],
    popupAnchor: [0, -38]
});
const heavyPumperIcon = L.icon({
    iconUrl: settings.heavyPumperIconUrl,
    iconSize: [45, 45],
    popupAnchor: [0, -45]
});
const buildingIcon = L.icon({
    iconUrl: settings.buildingIconUrl,
    iconSize: [38, 38]
});
const ambulanceIcon = L.icon({
    iconUrl: gameState.customImages.ambulance,
    iconSize: [38, 38],
    popupAnchor: [0, -38]
});
const ambulanceStationIcon = L.icon({
    iconUrl: settings.ambulanceStationIconUrl,
    iconSize: [38, 38]
});
const paramedicIcon = L.icon({
    iconUrl: gameState.customImages.paramedic,
    iconSize: [38, 38],
    popupAnchor: [0, -38]
});
const paramedicTrainingCentreIcon = L.icon({
    iconUrl: settings.paramedicTrainingCentreIconUrl,
    iconSize: [38, 38]
});
const micaSRIcon = L.icon({
    iconUrl: gameState.customImages.micaSR,
    iconSize: [38, 38],
    popupAnchor: [0, -38]
});

let missionTimer;

// Helper function to get the display name for a vehicle type
function getVehicleName(type) {
    switch (type) {
        case 'vehicle':
            return 'Fire Truck';
        case 'heavyPumper':
            return 'Heavy Pumper';
        case 'ambulance':
            return 'Ambulance';
        case 'paramedic':
            return 'Paramedic';
        case 'micaSR':
            return 'MICA Single Response';
        default:
            return 'Unknown Vehicle';
    }
}

// ===================================
// Initialization and Setup
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupEventListeners();
    loadGame();
    // NEW: Check for season pass reset on load
    checkAndResetSeasonPass();
    updateUI();
    updateSeasonPassUI();
    // NEW: Start the reset timer update loop
    setInterval(updateResetTimer, 1000);
    populateVersionHistory();

    document.getElementById('missionIntervalInput').value = settings.missionGenerationInterval / 1000;
    document.getElementById('vehicleCostInput').value = settings.costs.vehicle;
    document.getElementById('pumperCostInput').value = settings.costs.heavyPumper;
    document.getElementById('ambulanceCostInput').value = settings.costs.ambulance;
    document.getElementById('paramedicCostInput').value = settings.costs.paramedic;
    document.getElementById('micaSRECostInput').value = settings.costs.micaSR;
    document.getElementById('micaCourseCostInput').value = settings.costs.micaCourse;

    missionTimer = setInterval(generateMission, settings.missionGenerationInterval);
    setInterval(generateIncome, settings.incomeInterval);
    setInterval(saveGame, settings.autosaveInterval);
});

function initMap() {
    map = L.map('map').setView([-25.2744, 133.7751], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

function setupEventListeners() {
    document.getElementById('buyBuilding').addEventListener('click', () => buyItem('fireStation'));
    document.getElementById('buyAmbulanceStationBtn').addEventListener('click', () => buyItem('ambulanceStation'));
    document.getElementById('buyParamedicTrainingCentreBtn').addEventListener('click', () => buyItem('paramedicTrainingCentre'));
    document.getElementById('buyVehicleBtn').addEventListener('click', () => promptVehiclePurchase('vehicle'));
    document.getElementById('buyHeavyPumperBtn').addEventListener('click', () => promptVehiclePurchase('heavyPumper'));
    document.getElementById('buyAmbulanceBtn').addEventListener('click', () => promptVehiclePurchase('ambulance'));
    document.getElementById('buyParamedicBtn').addEventListener('click', () => promptVehiclePurchase('paramedic'));
    document.getElementById('buyMicaSRBtn').addEventListener('click', () => promptVehiclePurchase('micaSR'));
    document.getElementById('buySeasonPass').addEventListener('click', () => buyItem('seasonPass'));

    // NEW: Add event listeners for the new overlay close buttons
    document.getElementById('toggleSettingsBtn').addEventListener('click', () => togglePanel('settingsPanel', 'show'));
    document.getElementById('closeSettingsBtn').addEventListener('click', () => togglePanel('settingsPanel', 'hide'));
    document.getElementById('toggleVersionHistoryBtn').addEventListener('click', () => togglePanel('versionHistoryPanel', 'show'));
    document.getElementById('closeVersionHistoryBtn').addEventListener('click', () => togglePanel('versionHistoryPanel', 'hide'));
    document.getElementById('toggleSeasonPassBtn').addEventListener('click', () => togglePanel('seasonPassPanel', 'show'));
    document.getElementById('closeSeasonPassBtn').addEventListener('click', () => togglePanel('seasonPassPanel', 'hide'));
    
    document.getElementById('applySettingsBtn').addEventListener('click', applySettings);
    document.getElementById('resetProgressBtn').addEventListener('click', resetProgress);
    
    document.getElementById('imageUpload').addEventListener('change', (e) => uploadVehicleImage(e));
}

// NEW: Updated togglePanel function to handle overlays
function togglePanel(panelId, action) {
    const panel = document.getElementById(panelId);
    if (action === 'show') {
        // Hide all other panels before showing the new one
        document.querySelectorAll('.overlay').forEach(p => p.classList.remove('visible'));
        panel.classList.add('visible');
    } else if (action === 'hide') {
        panel.classList.remove('visible');
    }
}

function populateVersionHistory() {
    const historyList = document.getElementById('versionHistoryList');
    for (const version in settings.versionHistory) {
        const versionDiv = document.createElement('div');
        versionDiv.classList.add('version-entry');
        const versionTitle = document.createElement('h3');
        versionTitle.textContent = `Version ${version}`;
        versionDiv.appendChild(versionTitle);

        const changesList = document.createElement('ul');
        settings.versionHistory[version].forEach(change => {
            const li = document.createElement('li');
            li.textContent = change;
            changesList.appendChild(li);
        });
        versionDiv.appendChild(changesList);
        historyList.appendChild(versionDiv);
    }
}

function calculateTotalIncome() {
    let totalIncome = 0;
    gameState.buildings.forEach(building => {
        const incomeDef = settings.buildingIncome[building.type];
        if (incomeDef) {
            let buildingIncome = incomeDef.base;
            for (let i = 0; i < building.upgrades.length; i++) {
                buildingIncome += incomeDef.upgrades[i].bonus;
            }
            totalIncome += buildingIncome;
        }
    });
    return totalIncome;
}

function generateIncome() {
    const totalIncome = calculateTotalIncome();
    gameState.funds += totalIncome;
    updateUI();
    saveGame();
}

function updateUI() {
    document.getElementById('fundsDisplay').textContent = `$${gameState.funds.toLocaleString()}`;
    document.getElementById('incomeDisplay').textContent = `$${calculateTotalIncome()} / 30s`;
    document.getElementById('vehicleCount').textContent = gameState.vehicles.length;
    document.getElementById('buildingCount').textContent = gameState.buildings.length;
    document.getElementById('rankDisplay').textContent = `${gameState.rank.level}`;
    document.getElementById('failedMissionsCount').textContent = `${gameState.failedMissions}`;
    document.getElementById('versionDisplay').textContent = settings.version;

    if (gameState.hasSeasonPass) {
        document.getElementById('buySeasonPass').style.display = 'none';
    }
}

// NEW: Season Pass UI & Reset Logic
function updateSeasonPassUI() {
    document.getElementById('passPointsDisplay').textContent = gameState.seasonPassPoints;

    const freeTrackList = document.getElementById('freeTrackList');
    freeTrackList.innerHTML = '';
    settings.seasonPassRewards.freeTrack.forEach((reward, index) => {
        const rewardItem = createRewardItem(reward, index, 'free');
        freeTrackList.appendChild(rewardItem);
    });

    const premiumTrackList = document.getElementById('premiumTrackList');
    premiumTrackList.innerHTML = '';
    settings.seasonPassRewards.premiumTrack.forEach((reward, index) => {
        const rewardItem = createRewardItem(reward, index, 'premium');
        premiumTrackList.appendChild(rewardItem);
    });
}

function createRewardItem(reward, index, trackType) {
    const item = document.createElement('div');
    item.classList.add('pass-reward');
    if (gameState.seasonPassPoints >= reward.points) {
        item.classList.add('unlocked');
    }
    if (gameState.claimedRewards[trackType].includes(index)) {
        item.classList.add('claimed');
    }

    item.innerHTML = `
        <div class="reward-info">
            <span class="reward-points">${reward.points} Points</span>
            <span class="reward-description">${reward.description}</span>
        </div>
        <button class="claim-btn" data-track="${trackType}" data-index="${index}">Claim</button>
    `;

    const claimBtn = item.querySelector('.claim-btn');
    if (gameState.claimedRewards[trackType].includes(index) || gameState.seasonPassPoints < reward.points) {
        claimBtn.disabled = true;
    }
    if (trackType === 'premium' && !gameState.hasSeasonPass) {
        claimBtn.disabled = true;
        item.classList.add('locked');
    }

    claimBtn.addEventListener('click', (e) => {
        const track = e.target.dataset.track;
        const rewardIndex = parseInt(e.target.dataset.index);
        claimReward(track, rewardIndex);
    });

    return item;
}

function claimReward(trackType, index) {
    const reward = settings.seasonPassRewards[trackType][index];
    if (gameState.seasonPassPoints >= reward.points && !gameState.claimedRewards[trackType].includes(index)) {
        if (trackType === 'premium' && !gameState.hasSeasonPass) {
            alert("You need to buy the Premium Season Pass to claim this reward!");
            return;
        }

        // Apply the reward
        if (reward.type === 'funds') {
            gameState.funds += reward.value;
            alert(`Claimed ${reward.description}! Gained $${reward.value}.`);
        } else if (reward.type === 'vehicle') {
            const building = gameState.buildings.find(b => {
                if (reward.value === 'vehicle' || reward.value === 'heavyPumper') return b.type === 'fireStation';
                if (reward.value === 'ambulance') return b.type === 'ambulanceStation';
                if (reward.value === 'paramedic' || reward.value === 'micaSR') return b.type === 'paramedicTrainingCentre';
            });
            if (building) {
                createVehicle(building.location, reward.value);
                alert(`Claimed ${reward.description}! A new ${getVehicleName(reward.value)} has been delivered.`);
            } else {
                alert(`Cannot claim ${reward.description} - you need a station to store it!`);
                return;
            }
        }

        gameState.claimedRewards[trackType].push(index);
        updateUI();
        updateSeasonPassUI();
        saveGame();
    }
}

function checkAndResetSeasonPass() {
    const lastReset = new Date(gameState.lastResetTime);
    const now = new Date();
    let shouldReset = false;

    if (settings.seasonPassReset.frequency === 'daily') {
        // Reset if it's a new day (UTC)
        if (now.getUTCDate() !== lastReset.getUTCDate() || now.getUTCMonth() !== lastReset.getUTCMonth() || now.getUTCFullYear() !== lastReset.getUTCFullYear()) {
            shouldReset = true;
        }
    } else if (settings.seasonPassReset.frequency === 'weekly') {
        // Reset if it's a new week (UTC) based on the configured day
        const dayOfWeekNow = now.getUTCDay();
        const dayOfWeekLast = lastReset.getUTCDay();

        // If a new week has started and the day of the week is the reset day
        if (now.getTime() - lastReset.getTime() >= 7 * 24 * 60 * 60 * 1000 || (dayOfWeekNow === settings.seasonPassReset.resetDayOfWeek && now.getUTCHours() >= settings.seasonPassReset.resetHourUTC)) {
             shouldReset = true;
        }
    }

    if (shouldReset) {
        gameState.seasonPassPoints = 0;
        gameState.claimedRewards = { free: [], premium: [] };
        gameState.lastResetTime = now.getTime();
        alert("The Season Pass has been reset! A new season has begun.");
        updateSeasonPassUI();
        saveGame();
    }
}

function updateResetTimer() {
    const lastReset = new Date(gameState.lastResetTime);
    const now = new Date();
    let nextReset = new Date();

    if (settings.seasonPassReset.frequency === 'daily') {
        nextReset = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000);
        // If the calculated next reset is in the past, move it forward
        if (nextReset < now) {
            nextReset = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            nextReset.setUTCHours(settings.seasonPassReset.resetHourUTC, 0, 0, 0);
        }
    } else if (settings.seasonPassReset.frequency === 'weekly') {
        const dayOfWeekNow = now.getUTCDay();
        const daysUntilReset = (settings.seasonPassReset.resetDayOfWeek - dayOfWeekNow + 7) % 7;
        nextReset = new Date(now.getTime() + daysUntilReset * 24 * 60 * 60 * 1000);
        nextReset.setUTCHours(settings.seasonPassReset.resetHourUTC, 0, 0, 0);

        // If the reset time for this week has passed, set it for next week
        if (nextReset < now) {
            nextReset = new Date(nextReset.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
    }

    const timeLeft = nextReset.getTime() - now.getTime();
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    let countdownText = "";
    if (days > 0) countdownText += `${days}d `;
    countdownText += `${hours}h ${minutes}m ${seconds}s`;
    
    document.getElementById('resetTimerDisplay').textContent = countdownText;
}

function resetProgress() {
    if (confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
        localStorage.clear();
        window.location.reload();
    }
}

// ===================================
// Settings Logic
// ===================================

function applySettings() {
    const newMissionInterval = parseInt(document.getElementById('missionIntervalInput').value) * 1000;
    const newVehicleCost = parseInt(document.getElementById('vehicleCostInput').value);
    const newPumperCost = parseInt(document.getElementById('pumperCostInput').value);
    const newAmbulanceCost = parseInt(document.getElementById('ambulanceCostInput').value);
    const newParamedicCost = parseInt(document.getElementById('paramedicCostInput').value);
    const newMicaSRECost = parseInt(document.getElementById('micaSRECostInput').value);
    const newMicaCourseCost = parseInt(document.getElementById('micaCourseCostInput').value);

    if (!isNaN(newMissionInterval) && newMissionInterval > 0) {
        settings.missionGenerationInterval = newMissionInterval;
        clearInterval(missionTimer);
        missionTimer = setInterval(generateMission, settings.missionGenerationInterval);
    } else {
        alert("Mission interval must be a number greater than 0.");
    }

    if (!isNaN(newVehicleCost) && newVehicleCost >= 0) {
        settings.costs.vehicle = newVehicleCost;
    } else {
        alert("Vehicle cost must be a number greater than or equal to 0.");
    }

    if (!isNaN(newPumperCost) && newPumperCost >= 0) {
        settings.costs.heavyPumper = newPumperCost;
    } else {
        alert("Heavy Pumper cost must be a number greater than or equal to 0.");
    }

    if (!isNaN(newAmbulanceCost) && newAmbulanceCost >= 0) {
        settings.costs.ambulance = newAmbulanceCost;
    } else {
        alert("Ambulance cost must be a number greater than or equal to 0.");
    }

    if (!isNaN(newParamedicCost) && newParamedicCost >= 0) {
        settings.costs.paramedic = newParamedicCost;
    } else {
        alert("Paramedic cost must be a number greater than or equal to 0.");
    }

    if (!isNaN(newMicaSRECost) && newMicaSRECost >= 0) {
        settings.costs.micaSR = newMicaSRECost;
    } else {
        alert("MICA SR cost must be a number greater than or equal to 0.");
    }

    if (!isNaN(newMicaCourseCost) && newMicaCourseCost >= 0) {
        settings.costs.micaCourse = newMicaCourseCost;
    } else {
        alert("MICA Course cost must be a number greater than or equal to 0.");
    }

    document.getElementById('buyBuilding').textContent = `Buy Fire Station ($${settings.costs.fireStation})`;
    document.getElementById('buyAmbulanceStationBtn').textContent = `Buy Ambulance Station ($${settings.costs.ambulanceStation})`;
    document.getElementById('buyParamedicTrainingCentreBtn').textContent = `Buy Paramedic Training Centre ($${settings.costs.paramedicTrainingCentre})`;
    document.getElementById('buyVehicleBtn').textContent = `Buy Fire Truck ($${settings.costs.vehicle})`;
    document.getElementById('buyHeavyPumperBtn').textContent = `Buy Heavy Pumper ($${settings.costs.heavyPumper})`;
    document.getElementById('buyAmbulanceBtn').textContent = `Buy Ambulance ($${settings.costs.ambulance})`;
    document.getElementById('buyParamedicBtn').textContent = `Buy Paramedic ($${settings.costs.paramedic})`;
    document.getElementById('buyMicaSRBtn').textContent = `Buy MICA Single Response ($${settings.costs.micaSR})`;
    document.getElementById('buySeasonPass').textContent = `Buy Season Pass ($${settings.seasonPassCost})`;

    togglePanel('settingsPanel', 'hide');
    saveGame(); // Save settings after applying them
}

function uploadVehicleImage(event) {
    const file = event.target.files[0];
    const vehicleType = document.getElementById('vehicleTypeSelect').value;

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            if (vehicleType === 'vehicle') {
                gameState.customImages.vehicle = imageUrl;
                vehicleIcon.options.iconUrl = imageUrl;
            } else if (vehicleType === 'heavyPumper') {
                gameState.customImages.heavyPumper = imageUrl;
                heavyPumperIcon.options.iconUrl = imageUrl;
            } else if (vehicleType === 'ambulance') {
                gameState.customImages.ambulance = imageUrl;
                ambulanceIcon.options.iconUrl = imageUrl;
            } else if (vehicleType === 'paramedic') {
                gameState.customImages.paramedic = imageUrl;
                paramedicIcon.options.iconUrl = imageUrl;
            } else if (vehicleType === 'micaSR') {
                gameState.customImages.micaSR = imageUrl;
                micaSRIcon.options.iconUrl = imageUrl;
            }
            alert(`New ${getVehicleName(vehicleType)} image uploaded!`);
            refreshVehicleMarkers();
            saveGame();
        };
        reader.readAsDataURL(file);
    }
}

function refreshVehicleMarkers() {
    gameState.vehicles.forEach(v => {
        if (v.type === 'vehicle') {
            v.marker.setIcon(vehicleIcon);
        } else if (v.type === 'heavyPumper') {
            v.marker.setIcon(heavyPumperIcon);
        } else if (v.type === 'ambulance') {
            v.marker.setIcon(ambulanceIcon);
        } else if (v.type === 'paramedic') {
            v.marker.setIcon(paramedicIcon);
        } else if (v.type === 'micaSR') {
            v.marker.setIcon(micaSRIcon);
        }
    });
}

// ===================================
// Core Game Logic
// ===================================

function buyItem(type) {
    if (gameState.funds >= costs[type]) {
        gameState.funds -= costs[type];
        if (type === 'fireStation') {
            promptBuildingPlacement('fireStation');
        } else if (type === 'ambulanceStation') {
            promptBuildingPlacement('ambulanceStation');
        } else if (type === 'paramedicTrainingCentre') {
            promptBuildingPlacement('paramedicTrainingCentre');
        } else if (type === 'seasonPass') {
            if (gameState.funds >= settings.seasonPassCost) {
                gameState.funds -= settings.seasonPassCost;
                gameState.hasSeasonPass = true;
                alert("Season Pass purchased! You can now earn premium rewards.");
                updateSeasonPassUI();
            } else {
                alert("Not enough funds to buy the Season Pass!");
                return;
            }
        }
        updateUI();
        saveGame();
    } else {
        alert("Not enough funds!");
    }
}

function promptVehiclePurchase(vehicleType) {
    if (gameState.funds < costs[vehicleType]) {
        alert("Not enough funds to buy this vehicle!");
        return;
    }
    const vehicleName = getVehicleName(vehicleType);
    alert(`Click on a station to buy a ${vehicleName}!`);
    map.once('click', (e) => {
        const nearestBuilding = findNearestBuilding(e.latlng, vehicleType);
        if (nearestBuilding) {
            buyVehicleFromStation(nearestBuilding.location, vehicleType);
        } else {
            alert("Please click on a valid station to buy this vehicle.");
        }
    });
}

function buyVehicleFromStation(stationLocation, vehicleType) {
    const cost = costs[vehicleType];
    if (gameState.funds >= cost) {
        gameState.funds -= cost;
        createVehicle(stationLocation, vehicleType);
        updateUI();
        saveGame();
        const vehicleName = getVehicleName(vehicleType);
        alert(`New ${vehicleName} purchased!`);
    } else {
        alert("Not enough funds!");
    }
}

function createVehicle(location, type) {
    gameState.vehicleCounter++;
    const id = gameState.vehicleCounter;
    let icon;
    switch (type) {
        case 'vehicle':
            icon = vehicleIcon;
            break;
        case 'heavyPumper':
            icon = heavyPumperIcon;
            break;
        case 'ambulance':
            icon = ambulanceIcon;
            break;
        case 'paramedic':
            icon = paramedicIcon;
            break;
        case 'micaSR':
            icon = micaSRIcon;
            break;
        default:
            icon = vehicleIcon;
    }
    const vehicleName = getVehicleName(type);
    const marker = L.marker(location, { icon }).addTo(map)
        .bindPopup(`<b>${vehicleName} #${id}</b><br>Status: Available`);
    gameState.vehicles.push({ id, marker, status: 'available', type });
    displayVehicle(gameState.vehicles[gameState.vehicles.length - 1]);
}

function displayVehicle(vehicle) {
    const vehicleList = document.getElementById('vehicleList');
    const li = document.createElement('li');
    li.id = `vehicle-${vehicle.id}`;
    li.classList.add('vehicle-item');
    const vehicleName = getVehicleName(vehicle.type);
    li.innerHTML = `
        <span>${vehicleName} #${vehicle.id}</span>
        <span class="status" id="status-${vehicle.id}">Available</span>
    `;
    vehicleList.appendChild(li);
}

function updateVehicleStatus(vehicleId, status) {
    const statusElement = document.getElementById(`status-${vehicleId}`);
    if (statusElement) {
        statusElement.textContent = status;
    }
}

function displayBuilding(building) {
    const buildingList = document.getElementById('buildingList');
    const li = document.createElement('li');
    li.id = `building-${building.id}`;
    const buildingName = building.type === 'fireStation' ? 'Fire Station' : building.type === 'ambulanceStation' ? 'Ambulance Station' : 'Paramedic Training Centre';
    li.innerHTML = `${buildingName} #${building.id} (Lv. ${building.level})`;
    buildingList.appendChild(li);
}

function promptBuildingPlacement(buildingType) {
    if (gameState.funds < costs[buildingType]) {
        alert("Not enough funds to buy a building!");
        return;
    }
    const buildingName = buildingType === 'fireStation' ? 'Fire Station' : buildingType === 'ambulanceStation' ? 'Ambulance Station' : 'Paramedic Training Centre';
    alert(`Click on the map to place your new ${buildingName}!`);
    map.once('click', (e) => {
        createBuilding(e.latlng, buildingType);
    });
}

function createBuilding(location, type) {
    gameState.buildingCounter++;
    const id = gameState.buildingCounter;
    const buildingLevel = 1;
    let icon;
    if (type === 'fireStation') {
        icon = buildingIcon;
    } else if (type === 'ambulanceStation') {
        icon = ambulanceStationIcon;
    } else if (type === 'paramedicTrainingCentre') {
        icon = paramedicTrainingCentreIcon;
    }
    const marker = L.marker(location, { icon }).addTo(map);

    function createPopupContent(buildingData) {
        const popupContent = document.createElement('div');
        const buildingName = buildingData.type === 'fireStation' ? 'Fire Station' : buildingData.type === 'ambulanceStation' ? 'Ambulance Station' : 'Paramedic Training Centre';
        const title = document.createElement('b');
        title.textContent = `${buildingName} #${buildingData.id}`;
        popupContent.appendChild(title);
        popupContent.appendChild(document.createElement('br'));
        popupContent.appendChild(document.createTextNode(`Level: ${buildingData.level}`));
        popupContent.appendChild(document.createElement('br'));

        if (buildingData.type === 'fireStation') {
            const buyVehicleBtn = document.createElement('button');
            buyVehicleBtn.textContent = `Buy Fire Truck ($${costs.vehicle})`;
            buyVehicleBtn.onclick = () => buyVehicleFromStation(location, 'vehicle');
            popupContent.appendChild(buyVehicleBtn);

            const buyPumperBtn = document.createElement('button');
            buyPumperBtn.textContent = `Buy Heavy Pumper ($${costs.heavyPumper})`;
            buyPumperBtn.onclick = () => buyVehicleFromStation(location, 'heavyPumper');
            popupContent.appendChild(buyPumperBtn);
        } else if (buildingData.type === 'ambulanceStation') {
            const buyAmbulanceBtn = document.createElement('button');
            buyAmbulanceBtn.textContent = `Buy Ambulance ($${costs.ambulance})`;
            buyAmbulanceBtn.onclick = () => buyVehicleFromStation(location, 'ambulance');
            popupContent.appendChild(buyAmbulanceBtn);
        } else if (buildingData.type === 'paramedicTrainingCentre') {
            const buyParamedicBtn = document.createElement('button');
            buyParamedicBtn.textContent = `Buy Paramedic ($${costs.paramedic})`;
            buyParamedicBtn.onclick = () => buyVehicleFromStation(location, 'paramedic');
            popupContent.appendChild(buyParamedicBtn);

            const upgradeBtn = document.createElement('button');
            upgradeBtn.textContent = `MICA Course ($${costs.micaCourse})`;
            upgradeBtn.onclick = () => promptMicaCourse(id);
            popupContent.appendChild(upgradeBtn);
        }

        const upgradeData = settings.buildingIncome[buildingData.type].upgrades;
        const nextLevel = buildingData.level;
        if (nextLevel <= upgradeData.length) {
            const nextUpgrade = upgradeData[nextLevel - 1];
            const upgradeButton = document.createElement('button');
            upgradeButton.textContent = `Upgrade to Lv.${nextLevel + 1} ($${nextUpgrade.cost})`;
            upgradeButton.onclick = () => upgradeBuilding(id, nextUpgrade.cost);
            popupContent.appendChild(upgradeButton);
        }
        return popupContent;
    }

    const buildingData = { id, marker, location, type, level: buildingLevel, upgrades: [] };
    marker.bindPopup(createPopupContent(buildingData));

    gameState.buildings.push(buildingData);
    displayBuilding(gameState.buildings[gameState.buildings.length - 1]);
    updateUI();
    saveGame();
}

function upgradeBuilding(buildingId, cost) {
    const building = gameState.buildings.find(b => b.id === buildingId);
    if (!building) return;

    const currentLevel = building.level;
    const upgradeLevels = settings.buildingIncome[building.type].upgrades.length;

    if (currentLevel > upgradeLevels) {
        alert("Building is already at max level.");
        return;
    }

    if (gameState.funds >= cost) {
        gameState.funds -= cost;
        building.level++;
        alert(`Building #${building.id} upgraded to level ${building.level}!`);
        const buildingListItem = document.getElementById(`building-${building.id}`);
        if (buildingListItem) {
            const buildingName = building.type === 'fireStation' ? 'Fire Station' : building.type === 'ambulanceStation' ? 'Ambulance Station' : 'Paramedic Training Centre';
            buildingListItem.innerHTML = `${buildingName} #${building.id} (Lv. ${building.level})`;
        }
        
        // Re-bind the popup with the new content
        const popupContent = document.createElement('div');
        const buildingName = building.type === 'fireStation' ? 'Fire Station' : building.type === 'ambulanceStation' ? 'Ambulance Station' : 'Paramedic Training Centre';
        const title = document.createElement('b');
        title.textContent = `${buildingName} #${building.id}`;
        popupContent.appendChild(title);
        popupContent.appendChild(document.createElement('br'));
        popupContent.appendChild(document.createTextNode(`Level: ${building.level}`));
        popupContent.appendChild(document.createElement('br'));

        if (building.type === 'fireStation') {
            const buyVehicleBtn = document.createElement('button');
            buyVehicleBtn.textContent = `Buy Fire Truck ($${costs.vehicle})`;
            buyVehicleBtn.onclick = () => buyVehicleFromStation(building.location, 'vehicle');
            popupContent.appendChild(buyVehicleBtn);

            const buyPumperBtn = document.createElement('button');
            buyPumperBtn.textContent = `Buy Heavy Pumper ($${costs.heavyPumper})`;
            buyPumperBtn.onclick = () => buyVehicleFromStation(building.location, 'heavyPumper');
            popupContent.appendChild(buyPumperBtn);
        } else if (building.type === 'ambulanceStation') {
            const buyAmbulanceBtn = document.createElement('button');
            buyAmbulanceBtn.textContent = `Buy Ambulance ($${costs.ambulance})`;
            buyAmbulanceBtn.onclick = () => buyVehicleFromStation(building.location, 'ambulance');
            popupContent.appendChild(buyAmbulanceBtn);
        } else if (building.type === 'paramedicTrainingCentre') {
            const buyParamedicBtn = document.createElement('button');
            buyParamedicBtn.textContent = `Buy Paramedic ($${costs.paramedic})`;
            buyParamedicBtn.onclick = () => buyVehicleFromStation(building.location, 'paramedic');
            popupContent.appendChild(buyParamedicBtn);

            const upgradeBtn = document.createElement('button');
            upgradeBtn.textContent = `MICA Course ($${costs.micaCourse})`;
            upgradeBtn.onclick = () => promptMicaCourse(buildingId);
            popupContent.appendChild(upgradeBtn);
        }
        
        const upgradeData = settings.buildingIncome[building.type].upgrades;
        const nextLevel = building.level;
        if (nextLevel <= upgradeLevels) {
            const nextUpgrade = upgradeData[nextLevel - 1];
            const upgradeButton = document.createElement('button');
            upgradeButton.textContent = `Upgrade to Lv.${nextLevel + 1} ($${nextUpgrade.cost})`;
            upgradeButton.onclick = () => upgradeBuilding(buildingId, nextUpgrade.cost);
            popupContent.appendChild(upgradeButton);
        }
        building.marker.setPopupContent(popupContent);
        
        updateUI();
        saveGame();
    } else {
        alert("Not enough funds to upgrade this building!");
    }
}

function promptMicaCourse(trainingCentreId) {
    if (gameState.funds < costs.micaCourse) {
        alert("Not enough funds for the MICA course!");
        return;
    }

    const availableParamedics = gameState.vehicles.filter(v => v.type === 'paramedic' && v.status === 'available');
    if (availableParamedics.length === 0) {
        alert("No available paramedics to train!");
        return;
    }

    const trainingCentre = gameState.buildings.find(b => b.id === trainingCentreId);
    let nearestParamedic = null;
    let minDistance = Infinity;

    const trainingCentreLocation = L.latLng(trainingCentre.location.lat, trainingCentre.location.lng);

    availableParamedics.forEach(p => {
        const distance = trainingCentreLocation.distanceTo(p.marker.getLatLng());
        if (distance < minDistance) {
            minDistance = distance;
            nearestParamedic = p;
        }
    });

    if (nearestParamedic) {
        gameState.funds -= costs.micaCourse;
        updateUI();
        alert(`Paramedic #${nearestParamedic.id} is now a MICA Paramedic!`);
        nearestParamedic.type = 'micaSR';
        nearestParamedic.marker.setIcon(micaSRIcon);
        const vehicleListItem = document.getElementById(`vehicle-${nearestParamedic.id}`);
        if (vehicleListItem) {
            vehicleListItem.querySelector('span:first-child').textContent = `${getVehicleName('micaSR')} #${nearestParamedic.id}`;
        }
        updateVehicleStatus(nearestParamedic.id, 'Available');
        saveGame();
    }
}

function generateMission() {
    if (gameState.buildings.length === 0 || gameState.vehicles.length === 0) {
        // Stop generating missions if there are no buildings or vehicles
        return;
    }

    // Pick a random mission type from the settings
    const missionKeys = Object.keys(settings.missionDefinitions);
    const randomMissionType = missionKeys[Math.floor(Math.random() * missionKeys.length)];
    const missionDef = settings.missionDefinitions[randomMissionType];
    
    // Find a valid building to spawn the mission near
    const validBuildings = gameState.buildings.filter(b => missionDef.spawnBuildings.includes(b.type));
    if (validBuildings.length === 0) {
        // No valid building to spawn this mission, skip generation
        return;
    }
    const targetBuilding = validBuildings[Math.floor(Math.random() * validBuildings.length)];

    gameState.missionCounter++;
    const id = `mission-${gameState.missionCounter}`;
    const mission = { id, target: targetBuilding.location, type: randomMissionType, def: missionDef };
    
    // Check if there are any available vehicles for this mission type
    const availableVehicle = findBestAvailableVehicle(missionDef.requiredVehicles);
    
    if (availableVehicle) {
        gameState.activeMissions[id] = mission;
        displayMission(mission);
    } else {
        // No vehicle available, failed mission
        gameState.failedMissions++;
        gameState.funds -= settings.failedMissionPenalty;
        alert(`Failed to respond to a ${missionDef.name}! You lost $${settings.failedMissionPenalty}.`);
        updateUI();
        saveGame();
    }
}

function findBestAvailableVehicle(requiredTypes) {
    for (const type of requiredTypes) {
        const vehicle = gameState.vehicles.find(v => v.type === type && v.status === 'available');
        if (vehicle) {
            return vehicle;
        }
    }
    return null; // No vehicle found
}

function displayMission(mission) {
    const missionList = document.getElementById('missionList');
    const li = document.createElement('li');
    li.id = mission.id;
    li.innerHTML = `Mission #${mission.id.split('-')[1]}<br>Reward: $${mission.def.reward}<br>Type: ${mission.def.name}`;

    const dispatchBtn = document.createElement('button');
    dispatchBtn.textContent = 'Dispatch';
    dispatchBtn.onclick = () => dispatchVehicle(mission);
    li.appendChild(dispatchBtn);
    missionList.appendChild(li);
}

function dispatchVehicle(mission) {
    const availableVehicle = findBestAvailableVehicle(mission.def.requiredVehicles);

    if (availableVehicle) {
        availableVehicle.status = 'dispatched';
        const vehicleName = getVehicleName(availableVehicle.type);
        availableVehicle.marker.setPopupContent(`<b>${vehicleName} #${availableVehicle.id}</b><br>Status: Dispatched`);
        document.getElementById(mission.id).querySelector('button').style.display = 'none';
        updateVehicleStatus(availableVehicle.id, 'Dispatched');

        moveVehicle(availableVehicle, mission.target, () => {
            const nearestStation = findNearestBuilding(mission.target, availableVehicle.type);
            if (nearestStation) {
                moveVehicle(availableVehicle, nearestStation.location, () => {
                    completeMission(mission, availableVehicle);
                });
            } else {
                completeMission(mission, availableVehicle);
            }
        });
    } else {
        alert(`No available vehicles for this mission!`);
    }
}

function moveVehicle(vehicle, destination, callback) {
    const start = vehicle.marker.getLatLng();
    const end = destination;
    const duration = 5000;
    let startTime = null;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = timestamp - startTime;
        const newLat = start.lat + (end.lat - start.lat) * (progress / duration);
        const newLng = start.lng + (end.lng - start.lng) * (progress / duration);
        vehicle.marker.setLatLng([newLat, newLng]);

        if (progress < duration) {
            requestAnimationFrame(animate);
        } else {
            if (callback) callback();
        }
    }
    requestAnimationFrame(animate);
}

function findNearestBuilding(location, vehicleType) {
    let filteredBuildings;
    if (vehicleType === 'ambulance') {
        filteredBuildings = gameState.buildings.filter(b => b.type === 'ambulanceStation');
    } else if (vehicleType === 'paramedic' || vehicleType === 'micaSR') {
        filteredBuildings = gameState.buildings.filter(b => b.type === 'paramedicTrainingCentre');
    } else {
        filteredBuildings = gameState.buildings.filter(b => b.type === 'fireStation');
    }

    if (filteredBuildings.length === 0) {
        return null;
    }
    let nearest = null;
    let minDistance = Infinity;
    const leafletLocation = L.latLng(location.lat, location.lng);

    filteredBuildings.forEach(building => {
        const distance = leafletLocation.distanceTo(building.location);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = building;
        }
    });
    return nearest;
}

function completeMission(mission, vehicle) {
    gameState.funds += mission.def.reward;

    vehicle.status = 'available';
    const vehicleName = getVehicleName(vehicle.type);
    vehicle.marker.setPopupContent(`<b>${vehicleName} #${vehicle.id}</b><br>Status: Available`);
    updateVehicleStatus(vehicle.id, 'Available');
    saveGame();

    updateRank(settings.rankPointsPerMission);

    gameState.seasonPassPoints += settings.passPointsPerMission;
    updateSeasonPassUI();

    delete gameState.activeMissions[mission.id];
    document.getElementById(mission.id).remove();
    updateUI();
}

// ===================================
// Save and Load
// ===================================

function saveGame() {
    const data = {
        funds: gameState.funds,
        vehicles: gameState.vehicles.map(v => ({ id: v.id, location: v.marker.getLatLng(), type: v.type, status: v.status })),
        buildings: gameState.buildings.map(b => ({ id: b.id, location: b.location, type: b.type, level: b.level })),
        vehicleCounter: gameState.vehicleCounter,
        buildingCounter: gameState.buildingCounter,
        hasSeasonPass: gameState.hasSeasonPass,
        seasonPassPoints: gameState.seasonPassPoints,
        claimedRewards: gameState.claimedRewards,
        lastResetTime: gameState.lastResetTime,
        failedMissions: gameState.failedMissions,
        rank: gameState.rank,
        customImages: gameState.customImages,
    };
    localStorage.setItem('dispatchSimulator', JSON.stringify(data));
    console.log("Game saved.");
}

function loadGame() {
    const savedData = localStorage.getItem('dispatchSimulator');
    if (savedData) {
        const data = JSON.parse(savedData);
        if (typeof data.funds !== 'undefined' && !isNaN(data.funds)) gameState.funds = data.funds;
        if (typeof data.vehicleCounter !== 'undefined' && !isNaN(data.vehicleCounter)) gameState.vehicleCounter = data.vehicleCounter;
        if (typeof data.buildingCounter !== 'undefined' && !isNaN(data.buildingCounter)) gameState.buildingCounter = data.buildingCounter;
        if (typeof data.hasSeasonPass !== 'undefined') gameState.hasSeasonPass = data.hasSeasonPass;
        if (typeof data.seasonPassPoints !== 'undefined' && !isNaN(data.seasonPassPoints)) gameState.seasonPassPoints = data.seasonPassPoints;
        if (data.claimedRewards) gameState.claimedRewards = data.claimedRewards;
        if (data.lastResetTime) gameState.lastResetTime = data.lastResetTime;
        if (typeof data.failedMissions !== 'undefined' && !isNaN(data.failedMissions)) gameState.failedMissions = data.failedMissions;
        if (typeof data.rank !== 'undefined' && typeof data.rank.score !== 'undefined' && !isNaN(data.rank.score)) gameState.rank = data.rank;

        if (data.customImages) {
            if (data.customImages.vehicle) {
                gameState.customImages.vehicle = data.customImages.vehicle;
                vehicleIcon.options.iconUrl = data.customImages.vehicle;
            }
            if (data.customImages.heavyPumper) {
                gameState.customImages.heavyPumper = data.customImages.heavyPumper;
                heavyPumperIcon.options.iconUrl = data.customImages.heavyPumper;
            }
            if (data.customImages.ambulance) {
                gameState.customImages.ambulance = data.customImages.ambulance;
                ambulanceIcon.options.iconUrl = data.customImages.ambulance;
            }
            if (data.customImages.paramedic) {
                gameState.customImages.paramedic = data.customImages.paramedic;
                paramedicIcon.options.iconUrl = data.customImages.paramedic;
            }
            if (data.customImages.micaSR) {
                gameState.customImages.micaSR = data.customImages.micaSR;
                micaSRIcon.options.iconUrl = data.customImages.micaSR;
            }
        }
        if (data.vehicles && Array.isArray(data.vehicles)) {
            data.vehicles.forEach(v => createVehicle(v.location, v.type));
        }
        if (data.buildings && Array.isArray(data.buildings)) data.buildings.forEach(b => createBuilding(b.location, b.type, b.level));
    } else {
        gameState.funds = settings.startingFunds;
    }
    updateUI();
}