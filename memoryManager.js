const { cacheRoomMiningPositions } = require('./structurePlanner');

function cleanUpMemory() {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name]; // Delete memory of non-existing creeps
        }
    }
}

function validateMiningPositions(room) {
    if (!room.memory.miningPositions) {
        cacheRoomMiningPositions(room);
    }

    // Clear the current claimed mining positions
    room.memory.claimedMiningPositions = {};

    // Repopulate claimedMiningPositions based on current miners
    for (const sourceId in room.memory.miningPositions) {
        room.memory.miningPositions[sourceId].forEach(pos => {
            const posKey = positionToString(pos);

            // Check if the position is currently assigned to a miner
            const isAssigned = _.some(Game.creeps, creep => 
                creep.memory.role === 'miner' && 
                creep.memory.miningPosition && 
                positionToString(creep.memory.miningPosition) === posKey
            );

            if (isAssigned) {
                room.memory.claimedMiningPositions[posKey] = true;
            }
        });
    }

    // Ensure the spawn location is not considered a valid mining position
    const spawns = room.find(FIND_MY_SPAWNS);
    spawns.forEach(spawn => {
        const spawnKey = positionToString(spawn.pos);
        delete room.memory.claimedMiningPositions[spawnKey];
    });
}

function positionToString(pos) {
    return `${pos.x}_${pos.y}`;
}



module.exports = {
    cleanUpMemory,
    validateMiningPositions,
}