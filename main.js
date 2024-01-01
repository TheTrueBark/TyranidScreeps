const RoomScanner = require('./roomPlanner'); // Adjust the path as needed
const planRoads = require("./roadPlanner");

module.exports.loop = function () {
    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName];
        if (room.controller && room.controller.my) {
            const scanner = new RoomScanner(room);
            scanner.scan();
            planRoads(room);
        }
    }
}