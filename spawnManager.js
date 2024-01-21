const { runChangeling, runMiner, runHauler, runUpgrader, runRepairman, releaseMiningPositions } = require('./role.AllPurpose'); // Adjust the path as needed
const { findOpenSpacesAround, cacheRoomMiningPositions } = require("./structurePlanner");
const { validateMiningPositions } = require('./memoryManager');



function determineCreepRole(room) {
    const totalCreeps = _.filter(Game.creeps, creep => creep.room.name === room.name).length;

    if (totalCreeps < 3) {
        return 'changeling';
    }
    if (needsMoreMiners(room)) {
        return 'miner';
    }
    if (needsMoreHaulers(room)) {
        return 'hauler';
    }
    if (needsMoreUpgraders(room)) {
        return 'upgrader';
    }
    if (needsMoreRepairmen(room)) {
        return 'repairman';
    }

    // Check for spawning a scout
    if (shouldSpawnScout(room)) {
        return 'scout';
    }

    return null; // No role needed
}

function shouldSpawnScout(room) {
    // Check if there are no scouts in the room or globally
    const scouts = _.filter(Game.creeps, { memory: { role: 'scout' } });
    const hasNoScouts = scouts.length === 0;

    // Check if there is enough energy to spawn a scout
    const hasEnoughEnergy = room.energyAvailable >= BODYPART_COST[MOVE];

    return hasNoScouts && hasEnoughEnergy;
}



function needsChangelings(room) {
    // Check if there are no active creeps in the room
    return _.filter(Game.creeps, creep => creep.room.name === room.name).length === 0;
}

function needsMoreMiners(room) {
    if (!room.memory.miningPositions) {
        cacheRoomMiningPositions(room);
    }

    if (room.controller.level < 2) {
        // For low RCL, spawn basic miners for each mining position
        const totalMiningPositions = Object.keys(room.memory.miningPositions).reduce((total, sourceId) => 
            total + room.memory.miningPositions[sourceId].length, 0);
        const currentMiners = _.filter(Game.creeps, creep => creep.memory.role === 'miner' && creep.room.name === room.name).length;
        return currentMiners < totalMiningPositions;
    } else {
        // For higher RCL, spawn advanced miners based on container positions
        const containerPositions = getContainerPositionsNextToSources(room);
        const currentMiners = _.filter(Game.creeps, creep => creep.memory.role === 'miner' && creep.room.name === room.name);

        let occupiedContainerPositions = new Set();
        currentMiners.forEach(creep => {
            const posKey = positionToString(creep.memory.miningPosition);
            if (containerPositions.includes(posKey)) {
                occupiedContainerPositions.add(posKey);
            }
        });

        // Return true if there are available container positions for miners
        return occupiedContainerPositions.size < containerPositions.length;
    }
}


function getContainerPositionsNextToSources(room) {
    let positions = [];
    const sources = room.find(FIND_SOURCES);
    for (const source of sources) {
        const containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
            filter: { structureType: STRUCTURE_CONTAINER }
        });
        for (const container of containers) {
            positions.push(positionToString(container.pos));
        }
    }
    return positions;
}

function positionToString(pos) {
    return `${pos.x},${pos.y}`;
}


function isAdvancedMinerPositionAvailable(room) {
    // Assuming 'advancedMinerPositions' is an array of positions for advanced miners
    const assignedPositions = room.memory.advancedMinerPositions || [];
    
    return assignedPositions.some(posKey => {
        return !_.some(Game.creeps, {
            memory: { miningPosition: posKey, role: 'miner' }
        });
    });
}

function needsMoreHaulers(room) {
    // Count the number of active mining sources
    const activeMiningSources = _.filter(Game.creeps, (creep) => 
        creep.memory.role === 'miner' && creep.room.name === room.name
    ).length;

    // Count the current number of haulers in the room
    const currentHaulers = _.filter(Game.creeps, (creep) => 
        creep.memory.role === 'hauler' && creep.room.name === room.name
    ).length;

    // Limit haulers to the number of active mining sources
    return currentHaulers < activeMiningSources;
}



function needsMoreUpgraders(room) {
    const currentUpgraders = _.filter(Game.creeps, creep => creep.memory.role === 'upgrader' && creep.room.name === room.name).length;
    const needMore = currentUpgraders < 7;
    return needMore;
}



function needsMoreRepairmen(room) {
    const structuresNeedingRepair = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.hits < structure.hitsMax && structure.hits / structure.hitsMax < 0.8
    });

    if (structuresNeedingRepair.length === 0) return false;

    const currentRepairmen = _.filter(Game.creeps, creep => creep.memory.role === 'repairman' && creep.room.name === room.name).length;
    // Spawn one repairman for every few structures needing repair, adjust the ratio as needed
    return currentRepairmen < Math.ceil(structuresNeedingRepair.length / 5);
}




function spawnCreep(spawn, bodyParts, role) {
    if (!role) return; // Do not spawn if no role is given

    let name;
    let memory;

    if (role === 'scout') {
        // Special case for spawning a scout
        name = 'Scout' + Game.time;
        bodyParts = [MOVE]; // Scout only needs MOVE parts
        memory = {
            role: 'scout',
            homeRoom: spawn.room.name,
            scoutedRooms: {},
            currentTarget: findInitialScoutingTarget(spawn.room) // Function to find initial scouting target
        };
    } else {
        // Standard case for other roles
        name = (role === 'changeling') ? 'Changeling' + Game.time : generateTyranidName(role);
        memory = { role: role };
    }

    const spawnResult = spawn.spawnCreep(bodyParts, name, { memory: memory });

    if (spawnResult === OK && role !== 'scout') {
        validateMiningPositions(spawn.room);
    }
}

// Function to determine the initial target room for scouting
function findInitialScoutingTarget(room) {
    const exits = Game.map.describeExits(room.name);
    // Select a random exit room as the initial target
    const exitRoomNames = Object.values(exits);
    return exitRoomNames.length > 0 ? exitRoomNames[Math.floor(Math.random() * exitRoomNames.length)] : null;
}




function spawnChangeling(spawn) {
    const bodyParts = [WORK, CARRY, MOVE];  // Basic body composition
    const name = 'Changeling' + Game.time;  // Unique name

    return spawn.spawnCreep(bodyParts, name, { memory: { role: 'changeling' } });
}


function generateTyranidName(role) {
    const tyranidPrefixes = {
        'miner': 'Ripper',
        'hauler': 'Termagant',
        'upgrader': 'Warrior',
        'repairman': 'Hormagaunt',
        'scout' : 'Genestealer',
    };

    const prefix = tyranidPrefixes[role] || 'Tyranid';
    return prefix + Game.time;  // e.g., "Ripper123456"
}

function getAdvancedMinerBody(room) {
    // Calculate the number of WORK parts based on room's energy capacity
    const maxWorkParts = Math.min(Math.floor((room.energyCapacityAvailable -50) / 100), 5);
    const body = Array(maxWorkParts).fill(WORK);

    // Adding one MOVE part to ensure creep can move efficiently
    body.push(MOVE);
    return body;
    
}

module.exports = {
    determineCreepRole,
    needsChangelings,
    spawnChangeling,
    spawnCreep,
    getAdvancedMinerBody,
};