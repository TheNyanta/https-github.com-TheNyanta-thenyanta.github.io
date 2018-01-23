// All script that need to be loaded
var scriptsToLoad = ['game.js','astar.js','constants.js','camera.js','utility.js','animate.js','component.js','control.js','map.js','collision.js','data.js'];
scriptsToLoad.forEach(function(src) {
    var script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.getElementById("gameScripts").appendChild(script);
});