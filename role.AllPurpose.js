const { findOpenSpacesAround } = require("./structurePlanner");

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

// They are called "Changeling" as a creep
function runChangeling(creep) {
    const minersPresent = _.filter(Game.creeps, c => c.memory.role === 'miner' && c.room.name === creep.room.name).length >= 2;

    if (!minersPresent) {
        if (creep.memory.working && creep.store.getFreeCapacity() === 0) {
            // Full of energy, deliver it
            const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType === STRUCTURE_SPAWN ||
                                s.structureType === STRUCTURE_EXTENSION ||
                                s.structureType === STRUCTURE_TOWER) &&
                                s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (target) {
                if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
        } else {
            // Mine from the closest source
            const source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
            if (source && creep.harvest(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
            creep.memory.working = creep.store.getFreeCapacity() === 0;
        }
    } else {
        // Miners are present, switch to hauling behavior
        runHauler(creep);
    }
}


// This is called "Ripper" as a creep
function runMiner(creep) {
    // Ensure creep has a mining position claimed
    if (!creep.memory.miningPosition) {
        creep.memory.miningPosition = claimMiningPosition(creep.room, creep.pos);
    }

    // Move to the mining position
    const miningPos = new RoomPosition(creep.memory.miningPosition.x, creep.memory.miningPosition.y, creep.room.name);
    if (!creep.pos.isEqualTo(miningPos)) {
        creep.moveTo(miningPos);
    } else {
        const source = miningPos.findClosestByRange(FIND_SOURCES);
        if (source) {
            creep.harvest(source);
        }
    }
}

function positionToString(pos) {
    return pos.x + "," + pos.y;
}


function claimMiningPosition(room, currentPos) {
    if (!room.memory.miningPositions) {
        // Ensure mining positions are cached
        cacheRoomMiningPositions(room);
    }

    for (const sourceId in room.memory.miningPositions) {
        for (const pos of room.memory.miningPositions[sourceId]) {
            const posKey = positionToString(pos);
            if (!room.memory.claimedMiningPositions || !room.memory.claimedMiningPositions[posKey]) {
                room.memory.claimedMiningPositions = room.memory.claimedMiningPositions || {};
                room.memory.claimedMiningPositions[posKey] = true;
                return new RoomPosition(pos.x, pos.y, room.name);
            }
        }
    }
    return new RoomPosition(currentPos.x, currentPos.y, room.name);
}



function releaseMiningPositions(room) {
    for (const name in Memory.creeps) {
        if (!Game.creeps[name] && Memory.creeps[name].role === 'miner') {
            const pos = Memory.creeps[name].miningPosition;
            if (pos && room.memory.claimedMiningPositions && room.memory.claimedMiningPositions[pos]) {
                delete room.memory.claimedMiningPositions[pos];
            }
            delete Memory.creeps[name];  // Clean up dead creep memory
        }
    }
}

// This is called "Termagant" as a creep
function runHauler(creep) {
    // Switch state based on energy capacity
    if (creep.memory.working && creep.store.getFreeCapacity() === 0) {
        // Set to deliver energy
        creep.memory.working = false;
    } else if (!creep.memory.working && creep.store[RESOURCE_ENERGY] === 0) {
        // Set to collect energy
        creep.memory.working = true;
    }

    if (!creep.memory.working) {
        // Deliver energy to the spawn, extensions, or towers
        const target = creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
            filter: s => (s.structureType === STRUCTURE_SPAWN ||
                          s.structureType === STRUCTURE_EXTENSION ||
                          s.structureType === STRUCTURE_TOWER) &&
                         s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        });
        if (target && creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    } else {
        // Collect the largest dropped energy source
        const droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
        const largestSource = _.max(droppedEnergy, 'amount');

        if (largestSource && largestSource.amount && creep.pickup(largestSource) === ERR_NOT_IN_RANGE) {
            creep.moveTo(largestSource);
        }
    }
}


// This is called "Warrior" as a screep
function runUpgrader(creep) {
    if (creep.store[RESOURCE_ENERGY] === 0) {
        // Collect energy logic...
        collectEnergy(creep);
    } else {
        // Prioritize building specific structures
        const priorityTypes = [STRUCTURE_EXTENSION, STRUCTURE_CONTAINER, STRUCTURE_ROAD];
        let target = null;
        
        for (const type of priorityTypes) {
            target = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES, {
                filter: (s) => s.structureType === type
            });
            if (target) break;
        }

        // If no priority structures, find any construction site
        target = target || creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);

        if (target) {
            if (creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        } else if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
    }
}

// Energy Collection Containers > Dropped > Miner
function collectEnergy(creep) {
    let source;

    // Try to collect from containers first
    source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: s => s.structureType === STRUCTURE_CONTAINER &&
                     s.store[RESOURCE_ENERGY] > 0
    });

    // If no container with energy, look for dropped resources
    if (!source) {
        source = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES, {
            filter: r => r.resourceType === RESOURCE_ENERGY
        });
    }

    // If no dropped energy, take directly from a miner
    if (!source) {
        source = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: c => c.memory.role === 'miner' && 
                         c.store[RESOURCE_ENERGY] > 0
        });
    }

    if (source) {
        if (source instanceof Resource) {
            if (creep.pickup(source) === ERR_NOT_IN_RANGE) {
                creep.moveTo(source);
            }
        } else if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE || 
                   creep.harvest(source) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
    }
}

// This is called "Hormagaunt" as a creep
function runRepairman(creep) {
    if (creep.store[RESOURCE_ENERGY] === 0) {
        // Collect energy from containers
        const source = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType === STRUCTURE_CONTAINER &&
                         s.store[RESOURCE_ENERGY] > 0
        });
        if (source && creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
        }
    } else {
        // Repair damaged structures
        const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.hits < s.hitsMax
        });
        if (target && creep.repair(target) === ERR_NOT_IN_RANGE) {
            creep.moveTo(target);
        }
    }
}


module.exports = {
    runChangeling,
    runCreep,
    runMiner,
    runHauler,
    runUpgrader,
    runRepairman,
    releaseMiningPositions,

}