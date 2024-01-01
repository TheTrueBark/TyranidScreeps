const { findOpenSpacesAround } = require("./structurePlanner");

function determineCreepRole(room) {
    // Example logic to determine role based on room needs
    if (needsMoreMiners(room)) return 'miner';
    if (needsMoreHaulers(room)) return 'hauler';
    if (needsMoreUpgraders(room)) return 'upgrader';
    if (needsMoreRepairmen(room)) return 'repairman';
}

function needsMoreMiners(room) {
    const sources = room.find(FIND_SOURCES);
    let totalMiningPositions = 0;

    sources.forEach(source => {
        // Calculate open spaces around each source
        totalMiningPositions += findOpenSpacesAround(room, source.pos).length;
    });

    const currentMiners = _.filter(Game.creeps, creep => creep.memory.role === 'miner' && creep.room.name === room.name).length;
    return currentMiners < totalMiningPositions;
}

function needsMoreHaulers(room) {
    const currentMiners = _.filter(Game.creeps, creep => creep.memory.role === 'miner' && creep.room.name === room.name).length;
    if (currentMiners < 2) return false;

    const currentHaulers = _.filter(Game.creeps, creep => creep.memory.role === 'hauler' && creep.room.name === room.name).length;
    return currentHaulers < currentMiners + 2;
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
    // Logic to spawn a new creep with the given body parts and role
    const name = role + Game.time; // Generate a unique name
    spawn.spawnCreep(bodyParts, name, { memory: { role: role } });
}

module.exports = {
    determineCreepRole,
    spawnCreep
};