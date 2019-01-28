//var iro = require("@jaames/iro");

function loadText(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
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
let canvas;
let canvasH;
let canvasW;

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
    canvas = document.getElementById('dawin-webgl');
    canvasW = canvas.clientWidth;
    canvasH = canvas.clientHeight;
    gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('ERREUR : echec chargement du contexte');
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
    let top = -0.5;
    let bot = 0.5;
    let left = -0.5;
    let right = 0.5;
    let front = 0.5;
    let back = -0.5;
                       //X    Y   Z
    pointsPositions = [ //TRIANGLE 1 partie arriere haut gauche
                        top, left, back,    //haut gauche derriere
                        bot, left, back,    //bas gauche derriere
                        top, right, back,   //haut droite derriere

                        //TRIANGLE 2 partie arriere bas droite
                        bot, right, back,   //bas droite derriere
                        bot, left, back,    //bas gauche derriere
                        top, right, back,   //haut droite derriere

                        //TRIANGLE 3 partie droite haut
                        bot, right, front,  //bas droite devant
                        top, right, front,  //haut droite devant
                        top, right, back,   //haut droite derriere

                        //TRIANGLE 4 partie droite bas
                        bot, right, front,  //bas droite devant
                        top, right, back,   //haut droite derriere
                        bot, right, back,   //bas droite derriere

                        //TRIANGLE 5 partie gauche bas
                        top, left, front,   //haut gauche devant
                        bot, left, front,  //bas gauche devant
                        top, left, back,   //haut gauche derriere

                        //TRIANGLE 6 partie gauche haut
                        top, left, back,   //haut gauche derriere
                        bot, left, back,  //haut gauche devant
                        bot, left, front,  //bas gauche devant

                        //TRIANGLE 7 partie haut devant
                        top, left, front,  //haut gauche devant
                        top, right, back,  //haut droite fond
                        top, right, front, //haut droite devant

                        //TRIANGLE 8 partie haut derriere
                        top, left, front,  //haut gauche devant
                        top, right, back, //haut droite devant
                        top, left, back, //haut gauche fond
                        
                        //TRIANGLE 9 partie bas devant
                        bot, right, front,  //bas droite devant
                        bot, left, front, //bas gauche devant
                        bot, right, back, //bas droite derriere

                        //TRIANGLE 10 partie bas derriere
                        bot, right, back, //bas droite derriere
                        bot, left, front, //bas gauche devant
                        bot, left, back,  //bas gauche derriere

                        //TRIANGLE 11 partie devant haut gauche
                        top, left, front,   //haut gauche devant
                        bot, left, front,  //bas gauche devant
                        top, right, front,    //haut droite devant

                        //TRIANGLE 12 partie devant bas droite
                        bot, right, front,   //bas droite devant
                        top, right, front,    //haut droite devant
                        bot, left, front  //bas gauche devant
    ];
   
    color1 = Math.random();
    color2 = Math.random();
    color3 = Math.random();
    color4 = Math.random();
    color5 = Math.random();
    color6 = Math.random();
    color7 = Math.random();

    colorsArray = [
                    //TRIANGLE 1 arriere
                    color1, color3, color5, 1,
                    color1, color3, color5, 1,
                    color1, color3, color5, 1,

                    //TRIANGLE 2 arriere 
                    color1, color3, color5, 1,
                    color1, color3, color5, 1,
                    color1, color3, color5, 1,

                    //TRIANGLE 3 droite
                    color2, color3, color4, 1,
                    color2, color3, color4, 1,
                    color2, color3, color4, 1,

                    //TRIANGLE 4 droite
                    color2, color3, color4, 1,
                    color2, color3, color4, 1,
                    color2, color3, color4, 1,

                    //TRIANGLE 5 gauche 
                    color1, color5, color7, 1,
                    color1, color5, color7, 1,
                    color1, color5, color7, 1,

                    //TRIANGLE 6 gauche 
                    color1, color5, color7, 1,
                    color1, color5, color7, 1,
                    color1, color5, color7, 1,
                    
                    //TRIANGLE 7 haut
                    color2, color1, color6, 1,
                    color2, color1, color6, 1,
                    color2, color1, color6, 1,

                    //TRIANGLE 8 haut
                    color2, color1, color6, 1,
                    color2, color1, color6, 1,
                    color2, color1, color6, 1,

                    //TRIANGLE 9 bas
                    color3, color6, color2, 1,
                    color3, color6, color2, 1,
                    color3, color6, color2, 1,

                    //TRIANGLE 10 bas
                    color3, color6, color2, 1,
                    color3, color6, color2, 1,
                    color3, color6, color2, 1,

                    //TRIANGLE 11 devant
                    color4, color1, color7, 1,
                    color4, color1, color7, 1,
                    color4, color1, color7, 1,

                    //TRIANGLE 12 devant
                    color4, color1, color7, 1,
                    color4, color1, color7, 1,
                    color4, color1, color7, 1
    ]


    var fragmentSource = loadText('fragment.glsl');
    var vertexSource = loadText('vertex.glsl');

    var fragment = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragment, fragmentSource);
    gl.compileShader(fragment);

    var vertex = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertex, vertexSource);
    gl.compileShader(vertex);

    gl.getShaderParameter(fragment, gl.COMPILE_STATUS);
    gl.getShaderParameter(vertex, gl.COMPILE_STATUS);

    if (!gl.getShaderParameter(fragment, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(fragment));
    }

    if (!gl.getShaderParameter(vertex, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(vertex));
    }

    program = gl.createProgram();
    gl.attachShader(program, fragment);
    gl.attachShader(program, vertex);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log("Could not initialise shaders");
    }
    gl.useProgram(program);

}


//Evenement souris
function initEvents() {

    colorPicker.on("color:change", function (color, changes) {
        // Log the color's hex RGB value to the dev console
        console.log(color.rgb);
    });


    rangeRotateX.addEventListener("input", (e) => {/* 
        console.log("Rotation de : ", (e.target.valueAsNumber - currentPos.rotateX));
        console.log("Nouvelle rotation actuelle : " + (e.target.valueAsNumber));
        console.log(typeof +(e.target.valueAsNumber - currentPos.rotateX).toFixed(2)); */
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
        console.log("Scale de : ", ((1 + (e.target.valueAsNumber-currentPos.scale))));
        console.log("Nouveau scale actuel : " + (e.target.valueAsNumber));
        console.log(typeof +(e.target.valueAsNumber - currentPos.scale).toFixed(2));
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

    document.querySelector("#reset").addEventListener('click', () => {
        console.log(currentPos);
        resetPosition();
    })
    document.addEventListener("keydown", (e) => {
        //console.log(e.keyCode);
        e.preventDefault();
        switch(e.keyCode){
            case 68: //D
                mat4.rotateY(rMatrix, rMatrix, 0.1);
                break;
            case 83: //S
                mat4.rotateX(rMatrix, rMatrix, 0.1);
                break;
            case 81: //Q
                mat4.rotateY(rMatrix, rMatrix, -0.1);
                break;
            case 65: //A
                mat4.rotateZ(rMatrix, rMatrix, 0.1);
                break;
            case 90: //Z
                mat4.rotateX(rMatrix, rMatrix, -0.1);
                break;
            case 69: //Q
                mat4.rotateZ(rMatrix, rMatrix, -0.1);
                break;
        }
        refreshBuffers();
    })
}
function rotationY(rotation){
    mat4.rotateY(rMatrix, rMatrix, (((rotation - 50) / 10) - currentPos).toFixed(2));
    currentPos = ((rotation - 50) / 10);
}
//TODO
//Fonction initialisant les attributs pour l'affichage (position et taille)
function initAttributes() {
    
}


//TODO
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

//TODO
//Mise a jour des buffers : necessaire car les coordonnees des points sont ajoutees a chaque clic
function refreshBuffers() {
    //console.log(pointsPositions);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pointsPositions), gl.STATIC_DRAW)
    gl.vertexAttribPointer(pos, size, gl.FLOAT, true, 0, 0)
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferColor);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorsArray), gl.STATIC_DRAW)
    gl.vertexAttribPointer(color, 4, gl.FLOAT, true, 0, 0);
    //mat4.translate(pMatrix, pMatrix, [0, 0, -2]);
    //mat4.rotateZ(rMatrix, rMatrix, 2);
    gl.uniformMatrix4fv(translation, false, tMatrix);
    gl.uniformMatrix4fv(rotation, false, rMatrix);
    gl.uniformMatrix4fv(perspective, false, pMatrix);
    gl.uniformMatrix4fv(scale, false, sMatrix);
    draw();
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

//TODO
//Fonction permettant le dessin dans le canvas
function draw() {
    console.log("draw")
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, pointsPositions.length/size);
}


function main() {
    initContext();
    initShaders();
    initBuffers();
    initAttributes();
    initEvents();
    //draw();
}
