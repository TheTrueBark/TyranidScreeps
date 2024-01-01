const RoomScanner = require('./roomPlanner'); // Adjust the path as needed
const { planRoads } = require("./roadPlanner"); // Adjust as necessary if the export format is different
const spawnManager = require('./spawnManager'); // Adjust the path as needed

// Assuming placeExtensions and placeContainers are functions exported from structurePlanner.js
const { placeExtensions, placeContainers } = require('./structurePlanner'); // Adjust the path as needed

module.exports.loop = function () {
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
        }

        // Example of using spawnManager
        const spawns = room.find(FIND_MY_SPAWNS);
        if (spawns.length > 0) {
            const role = spawnManager.determineCreepRole(room);
            const bodyParts = [WORK, CARRY, MOVE]; // Example body parts, adjust based on role and available energy
            spawnManager.spawnCreep(spawns[0], bodyParts, role);
        }
    }
}