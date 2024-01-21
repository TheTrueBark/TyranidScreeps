const { findOpenSpacesAround } = require('./structurePlanner');
const { cacheRoomMiningPositions } = require('./structurePlanner');

function runScout(creep) {
    // Check if the scout has a target room assigned
    if (!creep.memory.targetRoom) {
        creep.memory.targetRoom = findNextTargetRoom(creep);
    }

    // Perform scouting activities
    if (creep.memory.targetRoom && creep.room.name !== creep.memory.targetRoom) {
        moveToTargetRoom(creep);
    } else {
        // Scout the current room
        scoutRoom(creep);
        updateGlobalScoutingInfo(creep);
        // Assign next target room for further scouting
        creep.memory.targetRoom = findNextTargetRoom(creep);
    }
}

function findNextTargetRoom(creep) {
    // Find the next unscouted adjacent room
    const adjacentRooms = Game.map.describeExits(creep.room.name);
    for (let exitDir in adjacentRooms) {
        const roomName = adjacentRooms[exitDir];
        if (!Memory.scoutedRooms || !Memory.scoutedRooms[roomName]) {
            return roomName;
        }
    }

    // If all adjacent rooms are scouted, return null or expand the search
    return null;
}

function moveToTargetRoom(creep) {
    const exitDir = creep.room.findExitTo(creep.memory.targetRoom);
    const exit = creep.pos.findClosestByRange(exitDir);
    creep.moveTo(exit);
}

function scoutRoom(creep) {
    // Mark the room as scouted
    creep.memory.scoutedRooms[creep.room.name] = true;

    // Gather room data like openSpaces and minerPositions
    const roomData = {
        openSpaces: findOpenSpacesAround(creep.room, creep.pos),
        minerPositions: cacheRoomMiningPositions(creep.room)
    };

    // Store data in creep memory to bring back to home base
    creep.memory.roomData = roomData;
}

function updateGlobalScoutingInfo(creep) {
    // Update global memory with information from scouted room
    if (creep.memory.roomData) {
        Memory.scoutedRoomsData = Memory.scoutedRoomsData || {};
        Memory.scoutedRoomsData[creep.room.name] = creep.memory.roomData;
    }

    // Update list of scouted rooms
    Memory.scoutedRooms = Object.assign(Memory.scoutedRooms, creep.memory.scoutedRooms);
}

module.exports = {
    runScout,
};
