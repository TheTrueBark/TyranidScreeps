const { findOpenSpacesAround, cacheRoomMiningPositions } = require("./structurePlanner");
const { validateMiningPositions } = require('./memoryManager');

function determineCreepRole(room) {
    const totalCreeps = _.filter(Game.creeps, creep => creep.room.name === room.name).length;

    // Spawn Changelings if total creeps are less than 3
    if (totalCreeps < 3) {
        return 'changeling';
    }

    // Prioritize miners and haulers
    if (needsMoreMiners(room)) {
        return 'miner';
    } else if (needsMoreHaulers(room)) {
        return 'hauler';
    }

    // Only spawn other roles if necessary
    if (needsMoreUpgraders(room)) {
        return 'upgrader';
    } else if (needsMoreRepairmen(room)) {
        return 'repairman';
    }

    // Default to upgrader if no other roles are needed
    return 'upgrader';
}


function needsChangelings(room) {
    // Check if there are no active creeps in the room
    return _.filter(Game.creeps, creep => creep.room.name === room.name).length === 0;
}

function needsMoreMiners(room) {
    if (!room.memory.miningPositions) {
        cacheRoomMiningPositions(room);
    }

    const totalMiningPositions = Object.keys(room.memory.miningPositions).reduce((total, sourceId) => 
        total + room.memory.miningPositions[sourceId].length, 0);

    const currentMiners = _.filter(Game.creeps, creep => creep.memory.role === 'miner' && creep.room.name === room.name).length;
    return currentMiners < totalMiningPositions;
}

function needsMoreHaulers(room) {
    const currentMiners = _.filter(Game.creeps, creep => creep.memory.role === 'miner' && creep.room.name === room.name).length;
    const currentHaulers = _.filter(Game.creeps, creep => creep.memory.role === 'hauler' && creep.room.name === room.name).length;

    // Enforce a strict 1:1 ratio between miners and haulers
    return currentHaulers < currentMiners;
}

function needsMoreUpgraders(room) {
    const currentUpgraders = _.filter(Game.creeps, creep => creep.memory.role === 'upgrader' && creep.room.name === room.name).length;
    return currentUpgraders < 7;  // Limit to 7 upgraders
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
    const name = (role === 'changeling') ? 'Changeling' + Game.time : generateTyranidName(role);
    spawn.spawnCreep(bodyParts, name, { memory: { role: role } });
    validateMiningPositions(spawn.room);
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


module.exports = {
    determineCreepRole,
    needsChangelings,
    spawnChangeling,
    spawnCreep
};