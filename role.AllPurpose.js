function runCreep(creep) {
    switch (creep.memory.role) {
        case 'miner':
            runMiner(creep);
            break;
        case 'hauler':
            runHauler(creep);
            break;
        case 'upgrader':
            runUpgrader(creep);
            break;
        case 'repairman':
            runRepairman(creep);
            break;
    }
}

function runMiner(creep) {
    // Miner behavior implementation
}

function runHauler(creep) {
    // Hauler behavior implementation
}

// ... Implement runUpgrader and runRepairman similarly

function claimMiningPosition(source) {
    // Logic to claim an available spot next to the source
}

function releaseMiningPosition(position) {
    // Logic to release the spot when the miner dies or is repurposed
}
