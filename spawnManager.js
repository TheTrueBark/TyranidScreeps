const { findOpenSpacesAround } = require("./structurePlanner");

function determineCreepRole(room) {
    // Example logic to determine role based on room needs
    if (needsMoreMiners(room)) return 'miner';
    if (needsMoreHaulers(room)) return 'hauler';
    if (needsMoreUpgraders(room)) return 'upgrader';
    if (needsMoreRepairmen(room)) return 'repairman';
}

function needsChangelings(room) {
    // Check if there are no active creeps in the room
    return _.filter(Game.creeps, creep => creep.room.name === room.name).length === 0;
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
    const name = generateTyranidName(role); // Use the Tyranid naming function
    const spawningResult = spawn.spawnCreep(bodyParts, name, { memory: { role: role } });

    if (spawningResult === OK) {
        console.log(`Spawning new ${role}: ${name}`);
    } else {
        console.log(`Error spawning new ${role}: ${name}, result code: ${spawningResult}`);
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


module.exports = {
    determineCreepRole,
    needsChangelings,
    spawnChangeling,
    spawnCreep
};