function shouldPlanRoads(room) {
    // Check for RCL level
    if (room.controller.level < 2) {
        return false;
    }

    // Check for periodic execution
    const currentTick = Game.time;
    const lastRunTick = Memory.rooms[room.name].lastRoadPlanningTick || 0;
    if (currentTick - lastRunTick < 5000 && room.controller.level === Memory.rooms[room.name].lastRoadPlanningRCL) {
        return false;
    }

    // Update last run information
    Memory.rooms[room.name].lastRoadPlanningTick = currentTick;
    Memory.rooms[room.name].lastRoadPlanningRCL = room.controller.level;

    return true;
}

function planRoads(room) {
    if (!shouldPlanRoads(room)) return;

    const spawns = room.find(FIND_MY_SPAWNS);
    const sources = room.find(FIND_SOURCES);
    const controller = room.controller;

    const pathsToBuild = [];

    sources.forEach(source => {
        spawns.forEach(spawn => {
            const path = room.findPath(spawn.pos, source.pos, { ignoreCreeps: true, swampCost: 2 });
            pathsToBuild.push(path);
        });
    });

    if (controller) {
        spawns.forEach(spawn => {
            const path = room.findPath(spawn.pos, controller.pos, { ignoreCreeps: true, swampCost: 2 });
            pathsToBuild.push(path);
        });
    }

    pathsToBuild.forEach(path => {
        path.forEach(step => {
            const pos = new RoomPosition(step.x, step.y, room.name);
    
            // Check for existing structures or construction sites
            const structures = pos.lookFor(LOOK_STRUCTURES);
            const isObstructed = structures.some(s => 
                s.structureType !== STRUCTURE_ROAD && 
                s.structureType !== STRUCTURE_CONTAINER);
    
            // Check for sources or controller at the position
            const isSourceOrController = pos.lookFor(LOOK_SOURCES).length > 0 || 
                                         pos.isEqualTo(controller.pos);
    
            if (isObstructed || isSourceOrController || pos.lookFor(LOOK_CONSTRUCTION_SITES).length) {
                return; // Skip this position
            }
    
            room.createConstructionSite(pos, STRUCTURE_ROAD);
            new RoomVisual(room.name).circle(pos, {radius: 0.3, fill: 'transparent', stroke: 'yellow'});
        });
    });
    
}

module.exports = { planRoads };
