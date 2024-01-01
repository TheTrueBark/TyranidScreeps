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

    return null;
}


function needsChangelings(room) {
    // Check if there are no active creeps in the room
    return _.filter(Game.creeps, creep => creep.room.name === room.name).length === 0;
}

function needsMoreMiners(room) {
    if (!room.memory.miningPositions) {
        cacheRoomMiningPositions(room);
    }

    // Adjust the logic based on RCL
    if (room.controller.level < 3) {
        // For low RCL, spawn miners for each mining position
        const totalMiningPositions = Object.keys(room.memory.miningPositions).reduce((total, sourceId) => 
            total + room.memory.miningPositions[sourceId].length, 0);
        const currentMiners = _.filter(Game.creeps, creep => creep.memory.role === 'miner' && creep.room.name === room.name).length;
        return currentMiners < totalMiningPositions;
    } else {
        // For higher RCL, spawn advanced miners based on container positions
        const containerPositions = getContainerPositionsNextToSources(room);
        let availableContainerPositions = containerPositions.length;

        // Check for each miner if they occupy a container position
        for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            if (creep.memory.role === 'miner' && creep.room.name === room.name) {
                const posKey = positionToString(creep.memory.miningPosition);
                if (containerPositions.includes(posKey)) {
                    availableContainerPositions--;
                }
            }
        }

        // Return true if there are available container positions for miners
        return availableContainerPositions > 0;
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
    // Count the number of sources currently being mined
    const minedSourcesCount = Object.keys(room.memory.miningPositions).filter(sourceId => {
        return _.some(Game.creeps, { memory: { role: 'miner', miningPosition: { sourceId: sourceId } } });
    }).length;

    // Count the current haulers
    const currentHaulers = _.filter(Game.creeps, { memory: { role: 'hauler', homeRoom: room.name } }).length;

    // Return true if the number of haulers is less than the number of mined sources
    return currentHaulers < minedSourcesCount;
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
    if (!role) {
        return; // Do not spawn if no role is given
    }

    const name = (role === 'changeling') ? 'Changeling' + Game.time : generateTyranidName(role);
    const spawnResult = spawn.spawnCreep(bodyParts, name, { memory: { role: role } });

    if (spawnResult === OK) {
        validateMiningPositions(spawn.room);
    }
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
        'repairman': 'Hormagaunt'
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