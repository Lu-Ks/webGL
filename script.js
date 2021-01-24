//var iro = require("@jaames/iro");

function loadText(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.overrideMimeType("text/plain");
    xhr.send(null);
    if(xhr.status === 200)
        return xhr.responseText;
    else {
        return null;
    }
}

var colorPicker = new iro.ColorPicker("#color-picker-container");

// variables globales du programme;
const canvas = document.getElementById("dawin-webgl");
let canvasH;
let canvasW;
let canvasClick = false;

let gl; //contexte
let program; //shader program
let pointsPositions = []; //Position des points sur le canvas
let colorsArray = []; //Couleur a chaque points du canvas
let buffer, pos, size, color, bufferColor, perspective, rotation, translation;
let pMatrix = mat4.create(); //matrice perspection
let sMatrix = mat4.identity(mat4.create()); //matrice de scale
let tMatrix = mat4.identity(mat4.create()); //matrice de translation
let rMatrix = mat4.identity(mat4.create()); //matrice de rotation

let rangeRotateX = document.querySelector("#rotateX");
let rangeRotateY = document.querySelector("#rotateY");
let rangeRotateZ = document.querySelector("#rotateZ");

let rangeTranslateX = document.querySelector("#translateX");
let rangeTranslateY = document.querySelector("#translateY");
let rangeTranslateZ = document.querySelector("#translateZ");

let rangeFOV = document.querySelector("#fov");
let rangeScale = document.querySelector("#zoom");

let parts = document.querySelectorAll(".part");
let colorValue = document.querySelector(".colorValue");
let select = [false, false, false, false, false, false];
let selectPart = false;
let selectAll = document.querySelector("#selectAll");
let allPart = false;

let currentPos = {
    rotateX : 0.00,
    rotateY : 0.00,
    rotateZ : 0.00,
    translateX : 0.00,
    translateY : 0.00,
    translateZ : 0.00,
    fov: 75,
    scale: 1.0
};

function initContext() {
    canvasW = canvas.clientWidth;
    canvasH = canvas.clientHeight;
    gl = canvas.getContext("webgl");
    if (!gl) {
        console.log("ERREUR : echec chargement du contexte");
        return;
    }
    canvas.width = canvas.clientWidth;

    canvas.height = canvas.clientHeight;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
    mat4.perspective(pMatrix, currentPos.fov * Math.PI / 180, canvasW/canvasH, 0.1, 100.0);
}

//Initialisation des shaders et du program
function initShaders() {
    const TOP = -0.5;
    const BOT = 0.5;
    const LEFT = -0.5;
    const RIGHT = 0.5;
    const FRONT = 0.5;
    const BACK = -0.5;

    const OPACITY = 1;

    pointsPositions = [ 
        //X    Y    Z
        //TRIANGLE 1 partie arriere haut gauche
        TOP, LEFT, BACK,    //haut gauche derriere
        BOT, LEFT, BACK,    //bas gauche derriere
        TOP, RIGHT, BACK,   //haut droite derriere

        //TRIANGLE 2 partie arriere bas droite
        BOT, RIGHT, BACK,   //bas droite derriere
        BOT, LEFT, BACK,    //bas gauche derriere
        TOP, RIGHT, BACK,   //haut droite derriere

        //TRIANGLE 3 partie droite haut
        BOT, RIGHT, FRONT,  //bas droite devant
        TOP, RIGHT, FRONT,  //haut droite devant
        TOP, RIGHT, BACK,   //haut droite derriere

        //TRIANGLE 4 partie droite bas
        BOT, RIGHT, FRONT,  //bas droite devant
        TOP, RIGHT, BACK,   //haut droite derriere
        BOT, RIGHT, BACK,   //bas droite derriere

        //TRIANGLE 5 partie gauche bas
        TOP, LEFT, FRONT,   //haut gauche devant
        BOT, LEFT, FRONT,  //bas gauche devant
        TOP, LEFT, BACK,   //haut gauche derriere

        //TRIANGLE 6 partie gauche haut
        TOP, LEFT, BACK,   //haut gauche derriere
        BOT, LEFT, BACK,  //haut gauche devant
        BOT, LEFT, FRONT,  //bas gauche devant

        //TRIANGLE 7 partie haut devant
        TOP, LEFT, FRONT,  //haut gauche devant
        TOP, RIGHT, BACK,  //haut droite fond
        TOP, RIGHT, FRONT, //haut droite devant

        //TRIANGLE 8 partie haut derriere
        TOP, LEFT, FRONT,  //haut gauche devant
        TOP, RIGHT, BACK, //haut droite devant
        TOP, LEFT, BACK, //haut gauche fond
        
        //TRIANGLE 9 partie bas devant
        BOT, RIGHT, FRONT,  //bas droite devant
        BOT, LEFT, FRONT, //bas gauche devant
        BOT, RIGHT, BACK, //bas droite derriere

        //TRIANGLE 10 partie bas derriere
        BOT, RIGHT, BACK, //bas droite derriere
        BOT, LEFT, FRONT, //bas gauche devant
        BOT, LEFT, BACK,  //bas gauche derriere

        //TRIANGLE 11 partie devant haut gauche
        TOP, LEFT, FRONT,   //haut gauche devant
        BOT, LEFT, FRONT,  //bas gauche devant
        TOP, RIGHT, FRONT,    //haut droite devant

        //TRIANGLE 12 partie devant bas droite
        BOT, RIGHT, FRONT,   //bas droite devant
        TOP, RIGHT, FRONT,    //haut droite devant
        BOT, LEFT, FRONT  //bas gauche devant
    ];

    colors = Array.from({length: 7}, () => Math.random());

    colorsArray = [
        //TRIANGLE 1 arriere
        colors[1], colors[3], colors[5], OPACITY,
        colors[1], colors[3], colors[5], OPACITY,
        colors[1], colors[3], colors[5], OPACITY,

        //TRIANGLE 2 arriere 
        colors[1], colors[3], colors[5], OPACITY,
        colors[1], colors[3], colors[5], OPACITY,
        colors[1], colors[3], colors[5], OPACITY,

        //TRIANGLE 3 droite
        colors[2], colors[3], colors[4], OPACITY,
        colors[2], colors[3], colors[4], OPACITY,
        colors[2], colors[3], colors[4], OPACITY,

        //TRIANGLE 4 droite
        colors[2], colors[3], colors[4], OPACITY,
        colors[2], colors[3], colors[4], OPACITY,
        colors[2], colors[3], colors[4], OPACITY,

        //TRIANGLE 5 gauche 
        colors[1], colors[5], colors[0], OPACITY,
        colors[1], colors[5], colors[0], OPACITY,
        colors[1], colors[5], colors[0], OPACITY,

        //TRIANGLE 6 gauche 
        colors[1], colors[5], colors[0], OPACITY,
        colors[1], colors[5], colors[0], OPACITY,
        colors[1], colors[5], colors[0], OPACITY,
        
        //TRIANGLE 7 haut
        colors[2], colors[1], colors[6], OPACITY,
        colors[2], colors[1], colors[6], OPACITY,
        colors[2], colors[1], colors[6], OPACITY,

        //TRIANGLE 8 haut
        colors[2], colors[1], colors[6], OPACITY,
        colors[2], colors[1], colors[6], OPACITY,
        colors[2], colors[1], colors[6], OPACITY,

        //TRIANGLE 9 bas
        colors[3], colors[6], colors[2], OPACITY,
        colors[3], colors[6], colors[2], OPACITY,
        colors[3], colors[6], colors[2], OPACITY,

        //TRIANGLE 10 bas
        colors[3], colors[6], colors[2], OPACITY,
        colors[3], colors[6], colors[2], OPACITY,
        colors[3], colors[6], colors[2], OPACITY,

        //TRIANGLE 11 devant
        colors[4], colors[1], colors[0], OPACITY,
        colors[4], colors[1], colors[0], OPACITY,
        colors[4], colors[1], colors[0], OPACITY,

        //TRIANGLE 12 devant
        colors[4], colors[1], colors[0], OPACITY,
        colors[4], colors[1], colors[0], OPACITY,
        colors[4], colors[1], colors[0], OPACITY,
    ]


    const FRAGMENT_SOURCE = loadText("fragment.glsl");
    const VERTEX_SOURCE = loadText("vertex.glsl");

    const FRAGMENT = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(FRAGMENT, FRAGMENT_SOURCE);
    gl.compileShader(FRAGMENT);

    const VERTEX = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(VERTEX, VERTEX_SOURCE);
    gl.compileShader(VERTEX);

    gl.getShaderParameter(FRAGMENT, gl.COMPILE_STATUS);
    gl.getShaderParameter(VERTEX, gl.COMPILE_STATUS);

    if (!gl.getShaderParameter(FRAGMENT, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(FRAGMENT));
    }

    if (!gl.getShaderParameter(VERTEX, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(VERTEX));
    }

    program = gl.createProgram();
    gl.attachShader(program, FRAGMENT);
    gl.attachShader(program, VERTEX);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Could not initialise shaders");
    }
    gl.useProgram(program);

}

function setPartCube(){
    parts.forEach((e, i)=> {
        e.style.height = e.offsetWidth+"px";
        switch(e.children[0].innerHTML){
            case "BACK":
                e.style.background = "rgb(" + colorsArray[0] * 255 + "," + colorsArray[1] * 255 + "," + colorsArray[2] * 255 + ")";
                break;
            case "TOP":
                e.style.background = "rgb(" + colorsArray[24] * 255 + "," + colorsArray[25] * 255 + "," + colorsArray[26] * 255 + ")";
                break;
            case "LEFT":
                e.style.background = "rgb(" + colorsArray[72] * 255 + "," + colorsArray[73] * 255 + "," + colorsArray[74] * 255 + ")";
                break;
            case "RIGHT":
                e.style.background = "rgb(" + colorsArray[96] * 255 + "," + colorsArray[97] * 255 + "," + colorsArray[98] * 255 + ")";
                break;
            case "FRONT":
                e.style.background = "rgb(" + colorsArray[120] * 255 + "," + colorsArray[121] * 255 + "," + colorsArray[122] * 255 + ")";
                break;
            case "DOWN":
                e.style.background = "rgb(" + colorsArray[48] * 255 + "," + colorsArray[49] * 255 + "," + colorsArray[50]*255 + ")";
                break;
        }
    })
}

function toggleSelected(elem) {
    select[elem.dataset.id] = !select[elem.dataset.id];

    if (elem.classList.toggle("selected")){
        setColorPicker(elem.style.background);
        if (select[0] && select[1] && select[2] && select[3] && select[4] && select[5]){
            allPart = true;
            selectAll.checked = true;
        }
    } else {
        if (allPart) {
            allPart = false;
            selectAll.checked = false;
        }
    }
}

function setColorPicker(e){
    let val = e.slice(0, e.length - 1).split("(")[1].split(",");
    //update colorpicker
    selectPart = true;
    colorPicker.color.rgb = { r : +val[0], g: +val[1], b: +val[2]};
}

//Evenement souris
function initEvents() {
    parts.forEach((e) => {
        e.addEventListener("click", (event) => {
            toggleSelected(event.target);
        });
    });

    selectAll.addEventListener("change", (e)=>{

        if (e.target.checked) {
            allPart = true;
            parts.forEach((part) => {
                if(!part.classList.contains("selected")){
                    toggleSelected(part);
                }
            })
        }else {
            allPart = false;
            parts.forEach((part) => {
                if (part.classList.contains("selected")) {
                    toggleSelected(part);
                }
            });
        }
    });

    colorPicker.on("color:change", function (color, changes) {
        colorValue.innerHTML = color.hexString;
        if(!selectPart){
            refreshColor(color.rgb);
        }else{
            selectPart = false
        }
    });

    rangeRotateX.addEventListener("input", (e) => {
        mat4.rotateX(rMatrix, rMatrix, +(e.target.valueAsNumber - currentPos.rotateX).toFixed(2));
        currentPos.rotateX = e.target.valueAsNumber;
        refreshBuffers();
    });
    
    rangeRotateY.addEventListener("input", (e) => {
        mat4.rotateY(rMatrix, rMatrix, +(e.target.valueAsNumber - currentPos.rotateY).toFixed(2));
        currentPos.rotateY = e.target.valueAsNumber;
        refreshBuffers();
    });

    rangeRotateZ.addEventListener("input", (e) => {
        mat4.rotateZ(rMatrix, rMatrix, +(e.target.valueAsNumber - currentPos.rotateZ).toFixed(2));
        currentPos.rotateZ = e.target.valueAsNumber;
        refreshBuffers();
    });

    rangeTranslateX.addEventListener("input", (e) => {
        mat4.translate(tMatrix, tMatrix, [0, +(e.target.valueAsNumber - currentPos.translateX).toFixed(2), 0]);
        currentPos.translateX = e.target.valueAsNumber;
        refreshBuffers();
    });

    rangeTranslateY.addEventListener("input", (e) => {
        mat4.translate(tMatrix, tMatrix, [+(e.target.valueAsNumber - currentPos.translateY).toFixed(2), 0, 0]);
        currentPos.translateY = e.target.valueAsNumber;
        refreshBuffers();
    });

    rangeTranslateZ.addEventListener("input", (e) => {
        mat4.translate(tMatrix, tMatrix, [0, 0, +(e.target.valueAsNumber - currentPos.translateZ).toFixed(2)]);
        currentPos.translateZ = e.target.valueAsNumber;
        refreshBuffers();
    });

    rangeScale.addEventListener("input", (e) => {
        mat4.scale(sMatrix, sMatrix, [1 + (e.target.valueAsNumber - currentPos.scale), 1 + (e.target.valueAsNumber - currentPos.scale), 1 + (e.target.valueAsNumber - currentPos.scale)]);
        currentPos.scale = e.target.valueAsNumber;
        refreshBuffers();
    });

    rangeFOV.addEventListener("input", (e) => {

        mat4.perspective(pMatrix, e.target.valueAsNumber * Math.PI / 180, canvasW/canvasH, 0.1, 100.0);
        mat4.translate(pMatrix, pMatrix, [0, 0, -2]);
        currentPos.fov = e.target.valueAsNumber;
        refreshBuffers();
    });

    document.querySelector("#reset").addEventListener("click", () => {
        resetPosition();
    })

    document.addEventListener("keydown", (e) => {
        e.preventDefault();
        switch(e.code){
            case "KeyD": //D
                mat4.rotateY(rMatrix, rMatrix, 0.1);
                break;
            case "KeyS": //S
                mat4.rotateX(rMatrix, rMatrix, 0.1);
                break;
            case "KeyA": //Q
                mat4.rotateY(rMatrix, rMatrix, -0.1);
                break;
            case "KeyQ": //A
                mat4.rotateZ(rMatrix, rMatrix, 0.1);
                break;
            case "KeyZ": //Z
                mat4.rotateX(rMatrix, rMatrix, -0.1);
                break;
            case "KeyE": //Q
                mat4.rotateZ(rMatrix, rMatrix, -0.1);
                break;
        }
        refreshBuffers();
    });

    canvas.addEventListener("mousedown", () => {
        canvasClick = true;
    });
    
    canvas.addEventListener("mouseup", () => {
        canvasClick = false;
    });

    canvas.addEventListener("mouseleave", () => {
        canvasClick = false;
    });
    
    canvas.addEventListener("mousemove", (e) => {
        if(canvasClick){
            mat4.rotateX(rMatrix, rMatrix, e.movementY / 100);
            mat4.rotateY(rMatrix, rMatrix, e.movementX / 100);
            refreshBuffers();
        }
    });

}
function rotationY(rotation){
    mat4.rotateY(rMatrix, rMatrix, (((rotation - 50) / 10) - currentPos).toFixed(2));
    currentPos = ((rotation - 50) / 10);
}

//Initialisation des buffers
function initBuffers() {
    buffer = gl.createBuffer();
    bufferColor = gl.createBuffer();
    pos = gl.getAttribLocation(program, "position");
    color = gl.getAttribLocation(program, "color");
    perspective = gl.getUniformLocation(program, "perspective");
    translation = gl.getUniformLocation(program, "translation");
    rotation = gl.getUniformLocation(program, "rotation");
    scale = gl.getUniformLocation(program, "scale");
    size = 3;

    gl.enableVertexAttribArray(pos);
    gl.enableVertexAttribArray(color);
    mat4.translate(pMatrix, pMatrix, [0, 0, -2]);

    refreshBuffers()
}

function refreshBuffers() {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointsPositions), gl.STATIC_DRAW)
    gl.vertexAttribPointer(pos, size, gl.FLOAT, true, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsArray), gl.STATIC_DRAW)
    gl.vertexAttribPointer(color, 4, gl.FLOAT, true, 0, 0);
    gl.uniformMatrix4fv(translation, false, tMatrix);
    gl.uniformMatrix4fv(rotation, false, rMatrix);
    gl.uniformMatrix4fv(perspective, false, pMatrix);
    gl.uniformMatrix4fv(scale, false, sMatrix);
    draw();
}

function refreshColor(color) {
    //back =  0; top = 24; left = 72; right = 96; front = 120; down = 48;
    if(select[0]){
        //changer la partie top
        replaceColor(color, 24, allPart);
    }
    if(select[1]){
        //changer la partie left
        replaceColor(color, 72, allPart);
    }
    if(select[2]){
        //changer la partie front
        replaceColor(color, 120, allPart);
    }
    if(select[3]){
        //changer la partie right
        replaceColor(color, 96, allPart);
    }
    if(select[4]){
        //changer la partie down
        replaceColor(color, 48, allPart);
    }
    if(select[5]){
        //changer la partie back
        replaceColor(color, 0, allPart);
    }
    setPartCube();
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsArray), gl.STATIC_DRAW);
    draw();
}

function replaceColor(color, index, allPart){
    let alt = Math.floor(Math.random() * 50);
    for (i = 0; i < 24; i = i + 4) {
        if (allPart) {
            colorsArray[index + i] = color.r / (255 + alt);
            colorsArray[index + 1 + i] = color.g / (255 + alt);
        } else {
            colorsArray[index + i] = color.r / 255;
            colorsArray[index + 1 + i] = color.g / 255;
        }
        colorsArray[index+2 + i] = color.b / 255;
    }
}

function resetPosition(){
    mat4.rotateZ(rMatrix, rMatrix, -currentPos.rotateZ)
    mat4.rotateY(rMatrix, rMatrix, -currentPos.rotateY)
    mat4.rotateX(rMatrix, rMatrix, -currentPos.rotateX)
    mat4.translate(tMatrix, tMatrix, [-currentPos.translateX, -currentPos.translateY, -currentPos.translateZ]);
    currentPos.rotateX = 0.0;
    currentPos.rotateY = 0.0;
    currentPos.rotateZ = 0.0;
    currentPos.translateX = 0.0;
    currentPos.translateY = 0.0;
    currentPos.translateZ = 0.0;
    updateRange();
    refreshBuffers();
}

function updateRange(){
    rangeRotateX.value = currentPos.rotateX;
    rangeRotateY.value = currentPos.rotateY;
    rangeRotateZ.value = currentPos.rotateZ;
    rangeTranslateX.value = currentPos.translateX;
    rangeTranslateY.value = currentPos.translateY;
    rangeTranslateZ.value = currentPos.translateZ;
}

//Fonction permettant le dessin dans le canvas
function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, pointsPositions.length/size);
}


function main() {
    initContext();
    initShaders();
    initBuffers();
    initEvents();
    setPartCube();
}
