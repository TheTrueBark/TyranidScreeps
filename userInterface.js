function displaySpawnStatus(spawn) {
    const visual = new RoomVisual(spawn.room.name);
    const statusText = `Current Action: ${spawn.spawning ? `Spawning ${Game.creeps[spawn.spawning.name].memory.role}` : 'Idle'}`;
    visual.text(statusText, spawn.pos.x + 1, spawn.pos.y, {align: 'left', color: 'white', font: 0.5});
}

module.exports = {
    displaySpawnStatus,
}