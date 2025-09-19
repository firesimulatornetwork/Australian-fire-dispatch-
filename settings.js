// settings.js

const settings = {
    version: Object.keys(changelog)[0], // This will automatically get the latest version number from the changelog
    
    startingFunds: 1000,
    autosaveInterval: 5000,
    incomeInterval: 30000, // 30 seconds
    
    // Game costs and rewards
    costs: {
        fireStation: 200,
        vehicle: 500,
        heavyPumper: 750,
        ambulanceStation: 250,
        ambulance: 400,
        paramedicTrainingCentre: 300,
        paramedic: 600,
        micaCourse: 500,
        micaSR: 1000,
        seasonPass: 5,
    },
    
    buildingIncome: {
        fireStation: {
            base: 10,
            upgrades: [{ cost: 100, bonus: 10 }]
        },
        ambulanceStation: {
            base: 15,
            upgrades: [{ cost: 150, bonus: 15 }]
        },
        paramedicTrainingCentre: {
            base: 20,
            upgrades: [{ cost: 200, bonus: 20 }]
        }
    },
    
    // Mission definitions
    missionDefinitions: {
        basicEmergency: {
            name: "Medical Emergency",
            reward: 50,
            requiredVehicles: ["ambulance", "paramedic"],
            spawnBuildings: ["ambulanceStation", "paramedicTrainingCentre"]
        },
        fireEmergency: {
            name: "Structure Fire",
            reward: 100,
            requiredVehicles: ["vehicle"],
            spawnBuildings: ["fireStation"]
        },
        trafficAccident: {
            name: "Traffic Accident",
            reward: 150,
            requiredVehicles: ["vehicle", "ambulance"],
            spawnBuildings: ["fireStation", "ambulanceStation"]
        },
        micaEmergency: {
            name: "MICA Emergency",
            reward: 400,
            requiredVehicles: ["micaSR"],
            spawnBuildings: ["paramedicTrainingCentre"]
        }
    },
    
    // Mission generation
    missionGenerationInterval: 60000, // 60 seconds
    failedMissionPenalty: 25,
    
    // Rank system
    rankPointsPerMission: 10,
    rankDefinitions: {
        Rookie: 0,
        Cadet: 50,
        Officer: 150,
        Captain: 300,
        Commander: 500,
        Chief: 1000,
        Commissioner: 2500
    },
    
    // Season Pass
    seasonPassCost: 5,
    passPointsPerMission: 5,
    seasonPassReset: {
        frequency: 'weekly', // 'daily' or 'weekly'
        resetDayOfWeek: 0,   // 0 for Sunday, 1 for Monday, etc.
        resetHourUTC: 0      // 0 for midnight UTC
    },
    seasonPassRewards: {
        freeTrack: [
            { points: 5, type: "funds", value: 100, description: "100 Funds" },
            { points: 15, type: "vehicle", value: "vehicle", description: "Fire Truck" },
            { points: 30, type: "funds", value: 300, description: "300 Funds" },
        ],
        premiumTrack: [
            { points: 10, type: "funds", value: 250, description: "250 Funds" },
            { points: 20, type: "vehicle", value: "heavyPumper", description: "Heavy Pumper" },
            { points: 40, type: "funds", value: 500, description: "500 Funds" },
        ]
    },
    
    // Map icons
    vehicleIconUrl: 'https://i.imgur.com/r0tG0d5.png',
    heavyPumperIconUrl: 'https://i.imgur.com/n14S432.png',
    buildingIconUrl: 'https://i.imgur.com/v8tT7Fw.png',
    ambulanceIconUrl: 'https://i.imgur.com/Qh15O2C.png',
    ambulanceStationIconUrl: 'https://i.imgur.com/9nJ97N8.png',
    paramedicTrainingCentreIconUrl: 'https://i.imgur.com/j0F3M6k.png',
    micaSRIconUrl: 'https://i.imgur.com/GzB2n8y.png'
};