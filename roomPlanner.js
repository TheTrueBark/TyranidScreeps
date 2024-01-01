class RoomScanner {
    constructor(room) {
        this.room = room;
        this.visual = new RoomVisual(room.name);
    }

    scan() {
        // Scan Sources
        const sources = this.room.find(FIND_SOURCES);
        this.visualizeSources(sources);

        // Scan Controller
        const controller = this.room.controller;
        this.visualizeController(controller);

        // Additional scanning can be implemented as needed
    }

    visualizeSources(sources) {
        sources.forEach(source => {
            this.visual.circle(source.pos, {fill: 'yellow', radius: 0.5});
            this.visual.text('Source', source.pos.x, source.pos.y + 1, {align: 'center', color: 'yellow'});
        });
    }

    visualizeController(controller) {
        if (controller) {
            this.visual.circle(controller.pos, {fill: 'green', radius: 0.5});
            this.visual.text('Controller', controller.pos.x, controller.pos.y + 1, {align: 'center', color: 'green'});
        }
    }
}

// If using a class
module.exports = RoomScanner;

