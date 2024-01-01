function cleanUpMemory() {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name]) {
            delete Memory.creeps[name]; // Delete memory of non-existing creeps
        }
    }
}

module.exports = {
    cleanUpMemory,
}