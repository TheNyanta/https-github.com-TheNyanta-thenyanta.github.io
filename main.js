function startGame() {
    myGameArea.editor = false;
    myGameArea.init();
    myGameArea.start();
}

function startEditor() {
    myGameArea.editor = true;
    myGameArea.init()
    myGameArea.start();
}

var myGameArea = {
    canvas: document.createElement("canvas"),
    tileset: document.createElement("canvas"),
    debug: false, // Global Variable for debugging
    showExtra: false,
    // Map Editor Variables
    activeCanvas: undefined,
    tiletype: 1,
    tileCollisionType: 0,
    currentLayer: 0,
    drawingOn: false,
    // The data of the game: When creating new spritesheets/maps/components it will be saved as a string
    // If you start the engine again and feed it this data it will be the same game data as before
    data: "",
    // Init
    init: function () {
        // Game canvas
        this.canvas.width = 600;
        this.canvas.height = 400;
        this.canvas.id = "game";
        this.context = this.canvas.getContext("2d");

        // Tileset canvas
        this.tileset.width = 0;
        this.tileset.height = 0;
        this.tileset.id = "tileset";
        this.tilecontext = this.tileset.getContext("2d");

        // Pause game if not selected
        document.active = true;
        window.addEventListener('focus', function (e) {
            document.active = true;
        });
        window.addEventListener('blur', function (e) {
            document.active = false;
        });

        this.minWidth = 1600;
        this.minHeight = 900;

        this.frameNo = 0;
        this.gameSequence = false;

        this.keys = [];

        // To only fire a single event on enter / mousedown / touchdown
        this.eventReady = false;
        this.enter = false;
        this.mousedown = false;
        this.touchdown = false;

        //this.canvas.style.cursor = "none"; //hide the original cursor

        // "Cache" Map on an hidden canvas
        this.panorama = document.createElement('canvas');
        this.cgx1 = this.panorama.getContext("2d");

        this.background = document.createElement('canvas');
        this.cgx2 = this.background.getContext("2d");

        this.foreground = document.createElement('canvas');
        this.cgx3 = this.foreground.getContext("2d");

        // Camera
        this.gameCamera = new function () {
            this.x = 0;
            this.y = 0;

            this.disableControls = false;
            this.disableMouse = false;

            this.setTarget = function (target) {
                this.target = target;
            }

            this.update = function () {
                // Follow target
                if (this.target != undefined) {
                    this.x = this.target.x - myGameArea.canvas.width / 2;
                    this.y = this.target.y - myGameArea.canvas.height / 2;
                    // Check if it key control is allowed
                    if (!this.disableControls && !myGameArea.gameSequence) {
                        // Listen to keys: "Else if" to limit movement in only one direction at the same time (no diagonal moving)
                        if (myGameArea.keys[38] || myGameArea.keys[87])
                            this.target.speedY = -this.target.speed;
                        else if (myGameArea.keys[40] || myGameArea.keys[83])
                            this.target.speedY = this.target.speed;
                        else if (myGameArea.keys[37] || myGameArea.keys[65])
                            this.target.speedX = -this.target.speed;
                        else if (myGameArea.keys[39] || myGameArea.keys[68])
                            this.target.speedX = this.target.speed;
                        else if (!this.disableMouse) {
                            // Move direction = To current mousemove/touch position
                            if (myGameArea.mousedown || myGameArea.touchdown) {
                                if (Math.abs(myGameArea.x + this.x - this.target.x - this.target.offset_x) >= Math.abs(myGameArea.y + this.y - this.target.y - this.target.offset_y)) {
                                    if (this.target.x + this.target.offset_x < myGameArea.x + this.x - 4)
                                        this.target.speedX += this.target.speed;
                                    else if (this.target.x + this.target.offset_x > myGameArea.x + this.x + 4)
                                        this.target.speedX -= this.target.speed;
                                } else {
                                    if (this.target.y + this.target.offset_y < myGameArea.y + this.y - 4)
                                        this.target.speedY += this.target.speed;
                                    else if (this.target.y + this.target.offset_y > myGameArea.y + this.y + 4)
                                        this.target.speedY -= this.target.speed;
                                }
                                /*
                                // Move direction = Difference between clicked and current mousemove/touch position
                                if (Math.abs(myGameArea.x - myGameArea.clickdownX) > Math.abs(myGameArea.y - myGameArea.clickdownY)) {
                                    if (myGameArea.x < myGameArea.clickdownX - 4)
                                        this.speedX -= this.speed;
                                    else if (myGameArea.x > myGameArea.clickdownX + 4)
                                        this.speedX += this.speed;
                                } else {
                                    if (myGameArea.y < myGameArea.clickdownY - 4)
                                        this.speedY -= this.speed;
                                    else if (myGameArea.y > myGameArea.clickdownY + 4)
                                        this.speedY += this.speed;
                                }*/

                            }
                        }
                    }
                }

                // Keep camera view inside the map
                if (this.x < 0) this.x = 0;
                if (this.x > maps.data[maps.currentMap].width - myGameArea.canvas.width) this.x = maps.data[maps.currentMap].width - myGameArea.canvas.width;
                if (this.y < 0) this.y = 0;
                if (this.y > maps.data[maps.currentMap].height - myGameArea.canvas.height) this.y = maps.data[maps.currentMap].height - myGameArea.canvas.height;

                // Camera (0,0) if map smaller than canvas
                if (maps.data[maps.currentMap].width - myGameArea.canvas.width < 0) this.x = 0;
                if (maps.data[maps.currentMap].height - myGameArea.canvas.height < 0) this.y = 0;
            }
        }

        // Init Camera Target
        this.gameCamera.setTarget(character);
        // Disable Mouse Control in Editor Mode
        if (myGameArea.editor) myGameArea.gameCamera.disableMouse = true;

        // Initalize Maps
        for (i = 0, l = maps.data.length; i < l; i++) {
            maps.data[i].loadLayers(layers1[i], layers2[i], layers3[i], layersC[i]);
            //this.minWidth = Math.min(this.minWidth, maps.data[i].mapWidth * maps.data[i].tileset.spriteWidth);
            //this.minHeight = Math.min(this.minHeight, maps.data[i].mapHeight * maps.data[i].tileset.spriteHeight);
        }

        // Smallest map
        //this.canvas.width = this.minWidth;
        //this.canvas.height = this.minHeight;

        // Draw the first or current map onto the cached canvas'
        maps.data[maps.currentMap].drawCache();
        if (myGameArea.editor) {
            // Draw Tileset
            maps.data[maps.currentMap].drawTileset();

            // Collision setup
            myGameArea.tileCollisions = [false, false, false, false];

            // Editor Mode Buttons
            var myGameButtons =
                '<div class="w3-container w3-padding-64">' +
                '<button class="w3-button w3-green" id="layer1Button" onclick="layerButton(0)">Layer 1</button>' +
                '<button class="w3-button w3-blue" id="layer2Button" onclick="layerButton(1)">Layer 2</button>' +
                '<button class="w3-button w3-blue" id="layer3Button" onclick="layerButton(2)">Layer 3</button>' +
                '<button class="w3-button w3-blue" id="layerCButton" onclick="layerButton(3)">Collision Layer</button><br>' +
                '<span class="w3-button w3-yellow">Change Tileset</span>' +
                '<input class="w3-button w3-yellow" type="string" id="tilesetFile" onchange="loadImage(value)" value="/Assets/Image/xyz.png"><br>' +
                '<button class="w3-button w3-red" id="drawButton" onclick="drawButton()">Drawing Off</button>' +
                '<button class="w3-button w3-red" id="debugButton" onclick="debugButton()">Debug Off</button>' +
                '<button class="w3-button w3-red" id="guiButton" onclick="guiButton()">GUI Off</button>' +
                '<br>' +
                '<span class="w3-button w3-orange" id="activeCanvas">Off Canvas</span>' +
                '<span class="w3-button w3-orange" id="canvasXY"></span>' +
                '<br>' +
                '<span class="w3-button w3-yellow">Selected Tile</span>' +
                '<span class="w3-button w3-yellow" id="selectedTile"></span>' +
                '<span class="w3-button w3-pink">Clicked Tile</span>' +
                '<span class="w3-button w3-pink" id="clickedXY"></span>' +
                '<br>' +
                '<span class="w3-button w3-orange">Selected Collision</span>' +
                '<span class="w3-button w3-red" id="collisionUpButton" onclick="collisionButton(0)">Up</span>' +
                '<span class="w3-button w3-red" id="collisionDownButton" onclick="collisionButton(1)">Down</span>' +
                '<span class="w3-button w3-red" id="collisionLeftButton" onclick="collisionButton(2)">Left</span>' +
                '<span class="w3-button w3-red" id="collisionRightButton" onclick="collisionButton(3)">Right</span>' +
                '</div>';
        } else {
            // Game Mode Buttons
            var myGameButtons =
                '<div class="w3-container w3-padding-64">' +
                '<button class="w3-button w3-green" onclick="enterFullscreen()">Fullscreen</button>' +
                '<button class="w3-button w3-red" id="debugButton" onclick="debugButton()">Debug Off</button>' +
                '<button class="w3-button w3-red" id="guiButton" onclick="guiButton()">GUI Off</button>' +
                '<br>' +
                '<button class="w3-button w3-blue" onclick="myGameArea.gameCamera.setTarget(character)">Control Boy</button>' +
                '<button class="w3-button w3-blue" onclick="myGameArea.gameCamera.setTarget(girl)">Control Girl</button>' +
                '</div>';
        }

        document.getElementById("startEditor").insertAdjacentHTML('afterend', myGameButtons);

        // Replace Start Button with Canvas
        document.getElementById("startGame").parentElement.replaceChild(this.canvas, document.getElementById("startGame"));
        // Delete Start Editor Button
        document.getElementById("startEditor").parentNode.removeChild(document.getElementById("startEditor"));
        // Insert tileset canvas after game canvas if editor mode
        if (myGameArea.editor) this.canvas.after(this.tileset);

        window.requestAnimationFrame = window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (f) {
                return setTimeout(f, 1000 / 60)
            }; // simulate calling code 60 

        window.cancelAnimationFrame = window.cancelAnimationFrame ||
            window.mozCancelAnimationFrame ||
            function (requestID) {
                clearTimeout(requestID)
            }; //fall back

        // OnCanvas
        this.onCanvas = function (x, y, canvas) {
            if (x >= canvas.getBoundingClientRect().x &&
                x <= canvas.getBoundingClientRect().x + canvas.width &&
                y >= canvas.getBoundingClientRect().y &&
                y <= canvas.getBoundingClientRect().y + canvas.height) return true;
            return false;
        }

        // INITIALIZE USER INPUT
        // Customize context menu on right click if canvas
        window.addEventListener('contextmenu', function (e) {
            if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                console.log("Default context menu prevent");
                e.preventDefault();
                //toggleMenuOn();
                //positionMenu(e);
            } else {
                console.log("Default context menu");
                //taskItemInContext = null;
                //toggleMenuOff();
            }
        })
        // Keydown
        window.addEventListener('keydown', function (e) {
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
            if (myGameArea.printkeyCode) console.log(e.keyCode);
            // Enter key
            if (e.keyCode == 13) myGameArea.enter = true;
            // no scrolling on arrow keys
            if ([37, 38, 39, 40].indexOf(e.keyCode) > -1) e.preventDefault();
        })
        // Keyup
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
            if (e.keyCode == 13) myGameArea.enter = false;
        })
        if (myGameArea.editor) {
            // Mouse down
            window.addEventListener('mousedown', function (e) {
                myGameArea.mousedown = true;
                if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                    myGameArea.clickdownX = Math.floor(e.clientX - myGameArea.canvas.getBoundingClientRect().x);
                    myGameArea.clickdownY = Math.floor(e.clientY - myGameArea.canvas.getBoundingClientRect().y);
                    e.preventDefault();
                    maps.data[maps.currentMap].clickedTile(myGameArea.clickdownX, myGameArea.clickdownY);
                } else if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.tileset)) {
                    myGameArea.clickdownX = Math.floor(e.clientX - myGameArea.tileset.getBoundingClientRect().x);
                    myGameArea.clickdownY = Math.floor(e.clientY - myGameArea.tileset.getBoundingClientRect().y);
                    e.preventDefault();
                    maps.data[maps.currentMap].clickedTile(myGameArea.clickdownX, myGameArea.clickdownY);
                } else {
                    myGameArea.clickdownX = undefined;
                    myGameArea.clickdownY = undefined;
                }
            })
            // Mouse up
            window.addEventListener('mouseup', function (e) {
                myGameArea.mousedown = false;

                if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                    myGameArea.clickupX = e.clientX - myGameArea.canvas.getBoundingClientRect().x;
                    myGameArea.clickupY = e.clientY - myGameArea.canvas.getBoundingClientRect().y;
                } else if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.tileset)) {
                    myGameArea.clickupX = e.clientX - myGameArea.tileset.getBoundingClientRect().x;
                    myGameArea.clickupY = e.clientY - myGameArea.tileset.getBoundingClientRect().y;
                } else {
                    myGameArea.activeCanvas = undefined;
                    myGameArea.clickupX = undefined;
                    myGameArea.clickupY = undefined;
                }
            })
            // Mouse move
            window.addEventListener('mousemove', function (e) {
                if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                    myGameArea.activeCanvas = 0;
                    document.getElementById("activeCanvas").innerHTML = "Game";
                    myGameArea.x = Math.floor(e.clientX - myGameArea.canvas.getBoundingClientRect().x);
                    myGameArea.y = Math.floor(e.clientY - myGameArea.canvas.getBoundingClientRect().y);
                    document.getElementById("canvasXY").innerHTML = "[" + myGameArea.x + " | " + myGameArea.y + "]";
                } else if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.tileset)) {
                    myGameArea.activeCanvas = 1;
                    document.getElementById("activeCanvas").innerHTML = "Tileset";
                    myGameArea.x = Math.floor(e.clientX - myGameArea.tileset.getBoundingClientRect().x);
                    myGameArea.y = Math.floor(e.clientY - myGameArea.tileset.getBoundingClientRect().y);
                    document.getElementById("canvasXY").innerHTML = "[" + myGameArea.x + " | " + myGameArea.y + "]";
                } else {
                    myGameArea.activeCanvas = undefined;
                    document.getElementById("activeCanvas").innerHTML = "Off Canvas";
                    document.getElementById("canvasXY").innerHTML = "[" + e.clientX + " | " + e.clientY + "]";
                    myGameArea.x = undefined;
                    myGameArea.y = undefined;
                }
            })
            // Touch start
            window.addEventListener('touchstart', function (e) {
                myGameArea.touchdown = true;

                if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                    myGameArea.clickdownX = e.clientX - myGameArea.canvas.getBoundingClientRect().x;
                    myGameArea.clickdownY = e.clientY - myGameArea.canvas.getBoundingClientRect().y;
                    e.preventDefault();
                } else if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.tileset)) {
                    myGameArea.clickdownX = e.clientX - myGameArea.tileset.getBoundingClientRect().x;
                    myGameArea.clickdownY = e.clientY - myGameArea.tileset.getBoundingClientRect().y;
                    e.preventDefault();
                } else {
                    activeCanvas = undefined;
                    myGameArea.clickdownX = undefined;
                    myGameArea.clickdownY = undefined;
                }
            })
            // Touch end
            window.addEventListener('touchend', function (e) {
                myGameArea.touchdown = false;
                if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                    myGameArea.clickupX = e.clientX - myGameArea.canvas.getBoundingClientRect().x;
                    myGameArea.clickupY = e.clientY - myGameArea.canvas.getBoundingClientRect().y;
                } else if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.tileset)) {
                    myGameArea.clickupX = e.clientX - myGameArea.tileset.getBoundingClientRect().x;
                    myGameArea.clickupY = e.clientY - myGameArea.tileset.getBoundingClientRect().y;
                } else {
                    activeCanvas = undefined;
                    myGameArea.clickdownX = undefined;
                    myGameArea.clickdownY = undefined;
                }
            })
            // Touch move
            window.addEventListener('touchmove', function (e) {
                if (myGameArea.onCanvas(e.touches[0].clientX, e.touches[0].clientY, myGameArea.canvas)) {
                    activeCanvas = 0;
                    myGameArea.x1 = Math.floor(e.touches[0].clientX - myGameArea.canvas.getBoundingClientRect().x);
                    myGameArea.y1 = Math.floor(e.touches[0].clientY - myGameArea.tileset.getBoundingClientRect().y);
                    e.preventDefault();
                } else {
                    myGameArea.x1 = undefined;
                    myGameArea.y1 = undefined;
                }
                if (myGameArea.onCanvas(e.touches[0].clientX, e.touches[0].clientY, myGameArea.tileset)) {
                    activeCanvas = 1;
                    myGameArea.x2 = Math.floor(e.touches[0].clientX - myGameArea.tileset.getBoundingClientRect().x);
                    myGameArea.y2 = Math.floor(e.touches[0].clientY - myGameArea.tileset.getBoundingClientRect().y);
                    e.preventDefault();
                } else {
                    myGameArea.x2 = undefined;
                    myGameArea.y2 = undefined;
                }
            })
        } else {
            // Mouse down
            window.addEventListener('mousedown', function (e) {
                myGameArea.mousedown = true;
                if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                    myGameArea.clickdownX = e.clientX - myGameArea.canvas.getBoundingClientRect().x;
                    myGameArea.clickdownY = e.clientY - myGameArea.canvas.getBoundingClientRect().y;
                    e.preventDefault();
                }
            })
            // Mouse up
            window.addEventListener('mouseup', function (e) {
                myGameArea.mousedown = false;
                if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                    myGameArea.clickupX = e.clientX - myGameArea.canvas.getBoundingClientRect().x;
                    myGameArea.clickupY = e.clientY - myGameArea.canvas.getBoundingClientRect().y;
                }
            })
            // Mouse move
            window.addEventListener('mousemove', function (e) {
                if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                    myGameArea.x = Math.floor(e.clientX - myGameArea.canvas.getBoundingClientRect().x);
                    myGameArea.y = Math.floor(e.clientY - myGameArea.canvas.getBoundingClientRect().y);
                } else {
                    myGameArea.x = undefined;
                    myGameArea.y = undefined;
                }
            })
            // Touch start
            window.addEventListener('touchstart', function (e) {
                myGameArea.touchdown = true;
                if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                    myGameArea.clickdownX = e.clientX - myGameArea.canvas.getBoundingClientRect().x;
                    myGameArea.clickdownY = e.clientY - myGameArea.canvas.getBoundingClientRect().y;
                    e.preventDefault();
                }
            })
            // Touch end
            window.addEventListener('touchend', function (e) {
                myGameArea.touchdown = false;
                if (myGameArea.onCanvas(e.clientX, e.clientY, myGameArea.canvas)) {
                    myGameArea.clickupX = e.clientX - myGameArea.canvas.getBoundingClientRect().x;
                    myGameArea.clickupY = e.clientY - myGameArea.canvas.getBoundingClientRect().y;
                }
            })
            // Touch move
            window.addEventListener('touchmove', function (e) {
                if (myGameArea.onCanvas(e.touches[0].clientX, e.touches[0].clientY, myGameArea.canvas)) {
                    myGameArea.x = Math.floor(e.touches[0].clientX - myGameArea.canvas.getBoundingClientRect().x);
                    myGameArea.y = Math.floor(e.touches[0].clientY - myGameArea.tileset.getBoundingClientRect().y);
                    e.preventDefault();
                } else {
                    myGameArea.x = undefined;
                    myGameArea.y = undefined;
                }
            })
        }
    },

    start: function () {

        function gameLoop() {
            requestAnimationFrame(gameLoop);
            if (document.active)
                updateGameArea();
        }

        gameLoop();
    },

    stop: function () {

    },

    clear: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

/**
 * Updates the current map with all it's components
 * TODO: Clean up - structure; for-loop length as var in the loop BUT care it must not change will the loop runs EVENTS that change map / delete objects
 */
function update() {
    // While myGameArea.gameSequence == true all components will stop moving (i.e. used for menus, dialogs,...)
    if (!myGameArea.gameSequence) {
        // For components that can start an interacted
        for (var i = 0; i < maps.data[maps.currentMap].components.length; i++)
            // The controlled component can acted with other component
            if (maps.data[maps.currentMap].components[i] == myGameArea.gameCamera.target)
                for (var j = 0; j < maps.data[maps.currentMap].components.length; j++) maps.data[maps.currentMap].components[i].updateInteraction(maps.data[maps.currentMap].components[j]);

        // Update the movement of all components on the current map (this also resolves tileCollision)
        if (!myGameArea.transition)
            for (var i = 0; i < maps.data[maps.currentMap].components.length; i++) maps.data[maps.currentMap].components[i].updateMovement();

        // Check each combination pair of components on the current map for component-component-collision
        for (var i = 0; i < maps.data[maps.currentMap].components.length; i++)
            for (var j = i + 1; j < maps.data[maps.currentMap].components.length; j++)
                if (maps.data[maps.currentMap].components[i].componentCollision != undefined)
                    maps.data[maps.currentMap].components[i].componentCollision(maps.data[maps.currentMap].components[j]);

        // Update the position of all components on the current map
        for (var i = 0, l = maps.data[maps.currentMap].components.length; i < l; i++) maps.data[maps.currentMap].components[i].updatePosition();
    }
}

/**
 * Draws the canvas
 * Zero it clears the canvas
 * First it draws the background
 * Second it draws the objects
 * Third it draws the foreground
 * Four it draws the gui
 */
function draw() {
    // Draw map transition
    if (myGameArea.transition) blackTransition();
    // Draw map
    else {
        // Clear the canvas
        myGameArea.context.clearRect(0, 0, myGameArea.canvas.width, myGameArea.canvas.height);
        // Draw Background
        maps.data[maps.currentMap].drawBackground();
        // Sorts the array after it's y value so that components with bigger y are drawn later
        maps.data[maps.currentMap].components.sort(function (a, b) {
            return (a.y > b.y) ? 1 : ((b.y > a.y) ? -1 : 0);
        });
        // Draw Objects of the current map
        for (var i = 0, l = maps.data[maps.currentMap].components.length; i < l; i++) maps.data[maps.currentMap].components[i].draw(myGameArea.context);
        // Draw Foreground
        maps.data[maps.currentMap].drawForeground();
    }
    // Draw extras
    if (myGameArea.showExtra) {
        extraGuiRect();
        showTime();
        updateFPS();
        showFPS();
        showPosition(character);
    }
}

/**
 * Updates the canvas
 * This is the core function of the game
 */
function updateGameArea() {
    myGameArea.frameNo += 1;

    // Redraw caches' on map change + map switch transition
    if (maps.currentMap != maps.nextMap) {
        maps.currentMap = maps.nextMap;
        maps.data[maps.currentMap].drawCache();
        if (myGameArea.editor != undefined) maps.data[maps.currentMap].drawTileset();
        setTimeout(function () {
            myGameArea.transition = false;
        }, 400);
    }

    // Update camera
    myGameArea.gameCamera.update();
    // Update game
    update();    
    // Draw game
    draw();

    // Draw dialog
    if (dialogs.currentDialog != undefined) {
        myGameArea.gameSequence = true;
        dialogs.currentDialog.update();
    } else myGameArea.gameSequence = false;

    // Simple hardcoded sound player for jukebox
    myHarp.play(Math.round(Math.random()));
}