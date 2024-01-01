const { findOpenSpacesAround } = require("./structurePlanner");

function determineCreepRole(room) {
    const totalCreeps = _.filter(Game.creeps, creep => creep.room.name === room.name).length;

    // Spawn Changelings if total creeps are less than 3
    if (totalCreeps < 3) {
        return 'changeling';
    }

    // Once we have at least 3 creeps, focus on miners and haulers
    if (needsMoreMiners(room)) {
        return 'miner';
    } else if (needsMoreHaulers(room)) {
        return 'hauler';
    }

    // Once miners and haulers are sufficient, spawn upgraders
    return needsMoreUpgraders(room) ? 'upgrader' : 'repairman';
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

    // Ensure haulers are spawned according to the 2:1 miner-to-hauler ratio
    return currentMiners >= 2 && currentHaulers < Math.ceil(currentMiners / 2);
}



function needsMoreUpgraders(room) {
    const currentUpgraders = _.filter(Game.creeps, creep => creep.memory.role === 'upgrader' && creep.room.name === room.name).length;
    return currentUpgraders < 4;
}

function needsMoreRepairmen(room) {
    const structuresNeedingRepair = room.find(FIND_STRUCTURES, {
        filter: (structure) => structure.hits < structure.hitsMax && structure.hits / structure.hitsMax <= 0.8
    });

    const currentRepairmen = _.filter(Game.creeps, creep => creep.memory.role === 'repairman' && creep.room.name === room.name).length;
    return structuresNeedingRepair.length > 0 && currentRepairmen === 0;
}



function spawnCreep(spawn, bodyParts, role) {
    const name = (role === 'changeling') ? 'Changeling' + Game.time : generateTyranidName(role);
    spawn.spawnCreep(bodyParts, name, { memory: { role: role } });
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