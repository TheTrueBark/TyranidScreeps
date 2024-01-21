const RoomScanner = require('./roomPlanner');
const { planRoads } = require("./roadPlanner");
const spawnManager = require('./spawnManager');
const allPurpose = require("./role.AllPurpose");
const { runChangeling, runMiner, runHauler, runUpgrader, runRepairman, releaseMiningPositions } = require('./role.AllPurpose');
const { determineCreepRole, spawnCreep, getAdvancedMinerBody, needsChangelings, spawnChangeling, } = require('./spawnManager');
const { assignAdvancedMinerPositions } = require('./roomManagement');
const memoryManager = require("./memoryManager");
const { displaySpawnStatus } = require('./userInterface');
const { runScout } = require('./role.scout');
const { placeExtensions, placeContainers, cacheRoomMiningPositions } = require('./structurePlanner');
const statsConsole = require("statsConsole");

module.exports.loop = function () {
    let initCPUUsage = Game.cpu.getUsed();

    // Initialize global memory properties if they don't exist
    Memory.scoutedRooms = Memory.scoutedRooms || {};
    Memory.scoutedRoomsData = Memory.scoutedRoomsData || {};

    // Memory Management
    memoryManager.cleanUpMemory();
    let memoryManagerCPUUsage = Game.cpu.getUsed() - initCPUUsage;

    // Room Management
    let roomManagerStartCPU = Game.cpu.getUsed();
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (room.controller && room.controller.my) {
            const scanner = new RoomScanner(room);
            scanner.scan();

            planRoads(room);
            placeExtensions(room);
            placeContainers(room);
            cacheRoomMiningPositions(room);
            assignAdvancedMinerPositions(room);
            releaseMiningPositions(room);

            const spawns = room.find(FIND_MY_SPAWNS);
            if (spawns.length > 0) {
                displaySpawnStatus(spawns[0]);
                const role = determineCreepRole(room);
                let bodyParts;
                if (role) {
                    switch (role) {
                        case 'miner':
                            bodyParts = getAdvancedMinerBody(room); // Advanced miner body
                            break;
                    case 'hauler':
                            bodyParts = [WORK, CARRY, MOVE]; // Example for a hauler
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
                    case 'scout':
                            bodyParts = [MOVE];
                            break;
                    // Add cases for any other roles you have
                    }
                    if (bodyParts) {
                        spawnCreep(spawns[0], bodyParts, role);
                    }
                }
            }
        }
    }
    let roomManagerCPUUsage = Game.cpu.getUsed() - roomManagerStartCPU;

    // Creep Management
    let creepManagerStartCPU = Game.cpu.getUsed();
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
            case 'scout':
                runScout(creep);
                break;
            // Add other roles as needed
        }
    }
    let creepManagerCPUUsage = Game.cpu.getUsed() - creepManagerStartCPU;

    // StatUI Integration
    let myStats = [
        ["Memory Manager", memoryManagerCPUUsage],
        ["Room Manager", roomManagerCPUUsage],
        ["Creep Manager", creepManagerCPUUsage],
        // ... other stats ...
    ];
    statsConsole.run(myStats);

    let totalTime = Game.cpu.getUsed();
    if (totalTime > Game.cpu.limit) {
        statsConsole.log("Tick: " + Game.time + "  CPU OVERRUN: " + totalTime.toFixed(2) + "  Bucket:" + Game.cpu.bucket, 5);
    }
    if ((Game.time % 5) === 0) {
        console.log(statsConsole.displayHistogram());
        console.log(statsConsole.displayStats());
        console.log(statsConsole.displayLogs());
        // console.log(statsConsole.displayMaps()); // Optional
        totalTime = (Game.cpu.getUsed() - totalTime);
        console.log("Time to Draw: " + totalTime.toFixed(2));
    }
}
