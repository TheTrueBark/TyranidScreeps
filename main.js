const RoomScanner = require('./roomPlanner'); // Adjust the path as needed
const { planRoads } = require("./roadPlanner"); // Adjust as necessary if the export format is different
const spawnManager = require('./spawnManager'); // Adjust the path as needed
const allPurpose = require("./role.AllPurpose")
const { runChangeling, runMiner, runHauler, runUpgrader, runRepairman, releaseMiningPositions } = require('./role.AllPurpose');
const { determineCreepRole, spawnCreep, getAdvancedMinerBody, needsChangelings, spawnChangeling, } = require('./spawnManager');
const { assignAdvancedMinerPositions } = require('./roomManagement');
const memoryManager = require("./memoryManager");
const { displaySpawnStatus } = require('./userInterface');


// Assuming placeExtensions and placeContainers are functions exported from structurePlanner.js
const { placeExtensions, placeContainers, cacheRoomMiningPositions } = require('./structurePlanner'); // Adjust the path as needed

module.exports.loop = function () {
    // Memory Manager called first
    memoryManager.cleanUpMemory();

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (room.controller && room.controller.my) {
            // Room scanner logic
            const scanner = new RoomScanner(room);
            scanner.scan();

            // Road planning logic
            planRoads(room);

            // Structure planning logic
            placeExtensions(room);
            placeContainers(room);

            // Handles miner position caching
            cacheRoomMiningPositions(room);

            // Handles Advanced miner position caching
            assignAdvancedMinerPositions(room);

            // Handle miner position releasing
            releaseMiningPositions(room);

            // Creep spawning logic
            const spawns = room.find(FIND_MY_SPAWNS);
            if (spawns.length > 0) {

                // Display current Spawn Status
                displaySpawnStatus(spawns[0]);

                const role = determineCreepRole(room);
                let bodyParts;
                if (role) {
                    switch (role) {
                        case 'miner':
                            bodyParts = getAdvancedMinerBody(room); // Advanced miner body
                            break;
                    case 'hauler':
                            bodyParts = [CARRY, CARRY, MOVE]; // Example for a hauler
                            break;
                    case 'changeling':
                            bodyParts = [WORK, CARRY, MOVE]; // Example for a changeling
                            break;
                    case 'upgrader':
                            bodyParts = [WORK, CARRY, MOVE]; // Example for an upgrader
                            break;
                    case 'repairman':
                            bodyParts = [WORK, CARRY, MOVE]; // Example for a repairman
                            break;
                    // Add cases for any other roles you have
                }

                if (bodyParts) {
                spawnCreep(spawns[0], bodyParts, role);
                }

                
            }
}

        }

        // Run role-specific behavior for each creep
        for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            switch (creep.memory.role) {
                case 'changeling':
                    runChangeling(creep);
                    break;
                case 'miner':
                    runMiner(creep); // Assuming you have a function to handle miner behavior
                    break;
                case 'hauler':
                    runHauler(creep);
                    break;
                case 'upgrader':
                    runUpgrader(creep);
                    break;
                case 'repairman':
                    runRepairman(creep);
                    break;
                // Add other roles as needed
            }
        }
    }
}