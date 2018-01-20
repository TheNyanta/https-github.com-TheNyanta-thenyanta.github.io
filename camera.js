function camera(target, x, y) {
    this.target = target;
    this.x = x;
    this.y = y;
    
    this.update = function() {
        // Follow target
        if (this.target != undefined) {
            this.x = this.target.x - myGameArea.canvas.width/2;
            this.y = this.target.y - myGameArea.canvas.height/2;
        }
        // Keep inside the map
        if (this.x < 0)
            this.x = 0;
        if (this.x > maps[mapID].mapWidth * maps[mapID].tileWidth-myGameArea.canvas.width)
            this.x = maps[mapID].mapWidth * maps[mapID].tileWidth-myGameArea.canvas.width;
        if (this.y < 0)
            this.y = 0;
        if (this.y > maps[mapID].mapHeight * maps[mapID].tileHeight-myGameArea.canvas.height)
            this.y = maps[mapID].mapHeight * maps[mapID].tileHeight-myGameArea.canvas.height;
    }
}