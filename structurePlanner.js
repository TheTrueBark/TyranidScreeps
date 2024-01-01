function findOpenSpacesAround(room, point) {
    const terrain = room.getTerrain();
    let openSpaces = [];

    // Generate a unique key for the point
    const pointKey = point.x + "_" + point.y;

    // Check if data is already in memory
    if (room.memory.openSpaces && room.memory.openSpaces[pointKey]) {
        return room.memory.openSpaces[pointKey].map(pos => new RoomPosition(pos.x, pos.y, room.name));
    }

    // Define relative positions to check around the point
    const positionsToCheck = [
        { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 0 }, /* Center Point */ { dx: 1, dy: 0 },
        { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }
    ];

    positionsToCheck.forEach(offset => {
        const x = point.x + offset.dx;
        const y = point.y + offset.dy;

        // Check if the position is within room bounds
        if (x < 0 || x >= 50 || y < 0 || y >= 50) return;

        // Check for walkable terrain (not a wall)
        if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
            const pos = new RoomPosition(x, y, room.name);

            // Check for absence of structures and construction sites
            if (!pos.lookFor(LOOK_STRUCTURES).length && !pos.lookFor(LOOK_CONSTRUCTION_SITES).length) {
                openSpaces.push(pos);
            }
        }
    });

    // Filter out the actual point itself
    openSpaces = openSpaces.filter(pos => !(pos.x === point.x && pos.y === point.y));

    // Save results in memory
    room.memory.openSpaces = room.memory.openSpaces || {};
    room.memory.openSpaces[pointKey] = openSpaces.map(pos => ({ x: pos.x, y: pos.y }));

    return openSpaces;
}

// Cashing open mining positions
function cacheRoomMiningPositions(room) {
    room.memory.miningPositions = {};

    const sources = room.find(FIND_SOURCES);
    sources.forEach(source => {
        const openSpaces = findOpenSpacesAround(room, source.pos);
        room.memory.miningPositions[source.id] = openSpaces.map(pos => ({ x: pos.x, y: pos.y }));
    });
}



function placeExtensions(room) {
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (!spawn) return;

    const openSpaces = findOpenSpacesAround(room, spawn.pos);
    openSpaces.forEach(pos => {
        const constructionSites = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y);
        const structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
        if (constructionSites.length === 0 && structures.length === 0) {
            room.createConstructionSite(pos.x, pos.y, STRUCTURE_EXTENSION);
            new RoomVisual(room.name).circle(pos.x, pos.y, {radius: 0.35, fill: 'transparent', stroke: 'blue'});
        }
    });
}

function placeContainers(room) {
    // Place containers at energy sources
    const sources = room.find(FIND_SOURCES);
    sources.forEach(source => {
        const containerPos = findOpenSpacesAround(room, source.pos)[0];
        if (containerPos) {
            room.createConstructionSite(containerPos.x, containerPos.y, STRUCTURE_CONTAINER);
            new RoomVisual(room.name).circle(containerPos.x, containerPos.y, {radius: 0.35, fill: 'transparent', stroke: 'orange'});
        }
    });

    // Place a container near the controller
    if (room.controller) {
        const controllerPos = findOpenSpacesAround(room, room.controller.pos)[0];
        if (controllerPos) {
            room.createConstructionSite(controllerPos.x, controllerPos.y, STRUCTURE_CONTAINER);
            new RoomVisual(room.name).circle(controllerPos.x, controllerPos.y, {radius: 0.35, fill: 'transparent', stroke: 'orange'});
        }
    }
}

module.exports = { 
    placeExtensions,
    placeContainers,
    findOpenSpacesAround,
    cacheRoomMiningPositions,
};
