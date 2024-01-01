const { cacheRoomMiningPositions } = require('./structurePlanner');
const { positionToString } = require('./role.AllPurpose');

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

    // Iterate through all miners and update claimed positions
    const miners = _.filter(Game.creeps, creep => creep.memory.role === 'miner' && creep.room.name === room.name);
    miners.forEach(miner => {
        if (miner.memory.miningPosition) {
            const posKey = positionToString(miner.memory.miningPosition);
            room.memory.claimedMiningPositions[posKey] = true;
        }
    });
}



module.exports = {
    cleanUpMemory,
    validateMiningPositions,
}