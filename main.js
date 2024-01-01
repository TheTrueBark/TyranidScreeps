const RoomScanner = require('./roomPlanner'); // Adjust the path as needed
const { planRoads } = require("./roadPlanner"); // Adjust as necessary if the export format is different
const spawnManager = require('./spawnManager'); // Adjust the path as needed
const allPurpose = require("./role.AllPurpose")
const { runChangeling } = require('./role.AllPurpose');
const { needsChangelings, spawnChangeling } = require('./spawnManager');
const memoryManager = require("./memoryManager");

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

            // Handles Changeling spawn
            if (needsChangelings(room)) {
                const spawns = room.find(FIND_MY_SPAWNS);
                if (spawns.length > 0) {
                    spawnChangeling(spawns[0]);
                }
            }

            // Handles miner position caching
            cacheRoomMiningPositions(room);

            // Handle miner position releasing
            allPurpose.releaseMiningPositions(room);
        }

        // Example of using spawnManager
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            const role = spawnManager.determineCreepRole(room);
            const bodyParts = [WORK, CARRY, MOVE]; // Example body parts, adjust based on role and available energy
            spawnManager.spawnCreep(spawns[0], bodyParts, role);
        }
    }

    // Run role-specific behavior for each creep
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        if (creep.memory.role === 'changeling') {
            runChangeling(creep);
        } else {
        allPurpose.runCreep(creep); // This function should call the appropriate role behavior
        }
    }



}