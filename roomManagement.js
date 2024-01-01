function assignAdvancedMinerPositions(room) {
    const sources = room.find(FIND_SOURCES);
    room.memory.minerPositions = room.memory.minerPositions || {};

    sources.forEach(source => {
        if (!room.memory.minerPositions[source.id]) {
            const containerSite = source.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            }) || source.pos.findClosestByRange(FIND_CONSTRUCTION_SITES, {
                filter: s => s.structureType === STRUCTURE_CONTAINER
            });

            if (containerSite) {
                room.memory.minerPositions[source.id] = containerSite.pos;
            }
        }
    });
}

function isMinerPositionAvailable(room, sourceId) {
    if (!room.memory.minerPositions || !room.memory.minerPositions[sourceId]) {
        return false;
    }

    const minerPosition = room.memory.minerPositions[sourceId];
    const minerPositionString = minerPosition.x + "_" + minerPosition.y;

    return !_.some(Game.creeps, creep => 
        creep.memory.role === 'miner' && 
        creep.memory.miningPosition === minerPositionString
    );
}


module.exports = { 
    assignAdvancedMinerPositions,
    isMinerPositionAvailable,
}