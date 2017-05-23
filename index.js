
var gl;
var score = 0;
var scoreElement;
var scoreNode;
var timeElement;
var timeNode;
var start = false;
var stop = false;
var k=0;

function initGL(canvas)
{
    try
    {
        gl = canvas.getContext("experimental-webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }

    scoreElement = document.getElementById("score");
    timeElement = document.getElementById("time");

    scoreNode = document.createTextNode("");
    timeNode = document.createTextNode("");

    scoreElement.appendChild(scoreNode);
    timeElement.appendChild(timeNode);

    scoreNode.nodeValue = 0;
    timeNode.nodeValue = 0;

}

function getShader(gl, id)
{
   try {
            gl = canvas.getContext("experimental-webgl");
            gl.viewportWidth = canvas.width;
            gl.viewportHeight = canvas.height;
        } catch (e) {
        }
        if (!gl) {
            alert("Could not initialise WebGL, sorry :-(");
        }
    }


    function getShader(gl, id) {
        var shaderScript = document.getElementById(id);
        if (!shaderScript) {
            return null;
        }

        var str = "";
        var k = shaderScript.firstChild;
        while (k) {
            if (k.nodeType == 3) {
                str += k.textContent;
            }
            k = k.nextSibling;
        }

        var shader;
        if (shaderScript.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (shaderScript.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        } else {
            return null;
        }

        gl.shaderSource(shader, str);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert(gl.getShaderInfoLog(shader));
            return null;
        }

        return shader;
}

var shaderProgram;

function initShaders() {
   var fragmentShader = getShader(gl, "shader-fs");
        var vertexShader = getShader(gl, "shader-vs");

        shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert("Could not initialise shaders");
        }

        gl.useProgram(shaderProgram);

        shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
        gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

        shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

        shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
        gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

        shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
        shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
        shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
        shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
        shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
        shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
        shaderProgram.pointLightingColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingColor");
}

function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
}

var neheTexture;
var mudTexture;
var earthColorMapTexture;
var earthSpecularMapTexture;

function initTexture() {

    earthColorMapTexture = gl.createTexture();
    earthColorMapTexture.image = new Image();
    earthColorMapTexture.image.onload = function () {
        handleLoadedTexture(earthColorMapTexture)
    }
    earthColorMapTexture.image.src = "Anh.jpg";
    mudTexture = gl.createTexture();
    mudTexture.image = new Image();
    mudTexture.image.onload = function () {
        handleLoadedTexture(mudTexture)
    }

    mudTexture.image.src = "go1.jpg";

    neheTexture = gl.createTexture();
    neheTexture.image = new Image();
    neheTexture.image.onload = function () {
        handleLoadedTexture(neheTexture)
    }

    neheTexture.image.src = "crate.gif";
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}
function setMatrixUniforms(){
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
   
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var currentlyPressedKeys = {};

function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}

function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}

var x_circle = 0;// bien di chuyen qua cau 
var y_circle = 0;


var xPos = 0;
var yPos = 0;
var zPos = 0;

var speed = 0;

function handleKeys() {
    if (currentlyPressedKeys[37]) { //Left cursor
		if(x_circle>-3){
		k= 1;
        x_circle -= 0.04;
		}
    }
    if (currentlyPressedKeys[39]) { //right cursor
		if(x_circle<3){
			k=1;
        x_circle += 0.04;
		}
    }
    if (currentlyPressedKeys[38]) { //up cursor
		if(y_circle>-3){
			k=2;
        y_circle -= 0.04;
		}
    }
    if (currentlyPressedKeys[40]) { //down cursor
		if(y_circle<3){
        y_circle += 0.04;
		k=2;
		}
    }

    if (currentlyPressedKeys[87]) {
        // Up cursor key or W
        speed = 0.05;
    } else if (currentlyPressedKeys[83]) {
        // Down cursor key
        speed = -0.05;
    } else {
        speed = 0;
    }
}

var cubeVertexPositionBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;
var cubeVertexNormalBuffer;

var sphereVertexNormalBuffer;
var sphereVertexTextureCoordBuffer;
var sphereVertexPositionBuffer;
var sphereVertexIndexBuffer;

function initBuffers() {
    // cycle
    var latitudeBands = 100;
    var longitudeBands = 100;
    var radius = 0.2;

    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
    for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);

            normalData.push(x);
            normalData.push(y);
            normalData.push(z);
            textureCoordData.push(u);
            textureCoordData.push(v);
            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);
        }
    }

    var indexData = [];
    for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }

    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = normalData.length / 3;

    sphereVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
    sphereVertexTextureCoordBuffer.itemSize = 2;
    sphereVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = vertexPositionData.length / 3;

    sphereVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
    sphereVertexIndexBuffer.itemSize = 1;
    sphereVertexIndexBuffer.numItems = indexData.length;

    //cube
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    var vertices = [
      // Front face
      -0.1, -0.1, 0.1,
       0.1, -0.1, 0.1,
       0.1, 0.1, 0.1,
      -0.1, 0.1, 0.1,

      // Back face
      -0.1, -0.1, -0.1,
      -0.1, 0.1, -0.1,
       0.1, 0.1, -0.1,
       0.1, -0.1, -0.1,

      // Top face
      -0.1, 0.1, -0.1,
      -0.1, 0.1, 0.1,
       0.1, 0.1, 0.1,
       0.1, 0.1, -0.1,

      // Bottom face
      -0.1, -0.1, -0.1,
       0.1, -0.1, -0.1,
       0.1, -0.1, 0.1,
      -0.1, -0.1, 0.1,

      // Right face
       0.1, -0.1, -0.1,
       0.1, 0.1, -0.1,
       0.1, 0.1, 0.1,
       0.1, -0.1, 0.1,

      // Left face
      -0.1, -0.1, -0.1,
      -0.1, -0.1, 0.1,
      -0.1, 0.1, 0.1,
      -0.1, 0.1, -0.1
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 24;

    cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    var textureCoords = [
      // Front face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Back face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,

      // Top face
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,

      // Bottom face
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,

      // Right face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,

      // Left face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = 24;

    //cube vertex indices
    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndices = [
        0, 1, 2, 0, 2, 3,    // Front face
        4, 5, 6, 4, 6, 7,    // Back face
        8, 9, 10, 8, 10, 11,  // Top face
        12, 13, 14, 12, 14, 15, // Bottom face
        16, 17, 18, 16, 18, 19, // Right face
        20, 21, 22, 20, 22, 23   // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 36;

    //cube vertex normal
    cubeVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    var vertexNormals = [
        // Front face
         0.0, 0.0, 1.0,
         0.0, 0.0, 1.0,
         0.0, 0.0, 1.0,
         0.0, 0.0, 1.0,

        // Back face
         0.0, 0.0, -1.0,
         0.0, 0.0, -1.0,
         0.0, 0.0, -1.0,
         0.0, 0.0, -1.0,

        // Top face
         0.0, 1.0, 0.0,
         0.0, 1.0, 0.0,
         0.0, 1.0, 0.0,
         0.0, 1.0, 0.0,

        // Bottom face
         0.0, -1.0, 0.0,
         0.0, -1.0, 0.0,
         0.0, -1.0, 0.0,
         0.0, -1.0, 0.0,

        // Right face
         1.0, 0.0, 0.0,
         1.0, 0.0, 0.0,
         1.0, 0.0, 0.0,
         1.0, 0.0, 0.0,

        // Left face
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    cubeVertexNormalBuffer.itemSize = 3;
    cubeVertexNormalBuffer.numItems = 24;
}

var worldVertexPositionBuffer = null;
var worldVertexTextureCoordBuffer = null;

function handleLoadedWorld(data) {
    var lines = data.split("\n");
    var vertexCount = 0;
    var vertexPositions = [];
    var vertexTextureCoords = [];
    for (var i in lines) {
        var vals = lines[i].replace(/^\s+/, "").split(/\s+/);
        if (vals.length == 5 && vals[0] != "//") {
            // It is a line describing a vertex; get X, Y and Z first
            vertexPositions.push(parseFloat(vals[0]));
            vertexPositions.push(parseFloat(vals[1]));
            vertexPositions.push(parseFloat(vals[2]));

            // And then the texture coords
            vertexTextureCoords.push(parseFloat(vals[3]));
            vertexTextureCoords.push(parseFloat(vals[4]));

            vertexCount += 1;
        }
    }

    worldVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
    worldVertexPositionBuffer.itemSize = 3;
    worldVertexPositionBuffer.numItems = vertexCount;

    worldVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexTextureCoords), gl.STATIC_DRAW);
    worldVertexTextureCoordBuffer.itemSize = 2;
    worldVertexTextureCoordBuffer.numItems = vertexCount;
}

function loadWorld() {
    var request = new XMLHttpRequest();
    request.open("GET", "world.txt");
    request.onreadystatechange = function () {
        if (request.readyState == 4) {
            handleLoadedWorld(request.responseText);
        }
    }
    request.send();
}

var xRot = 0;
var yRot = 0;
var zRot = 0;
var earthAngle = 180;

function sqr(k){return k*k;}

function distance(x1,y1,x2,y2){
	return Math.sqrt(sqr(x1-x2) + sqr(y1-y2));
}

var cube = [];
var lock = [];
function initCube() {
    for (var i = 0; i < 360; i += 36) {
        cube.push([2 * Math.sin(degToRad(i)), 2 * Math.cos(degToRad(i))]);
        lock.push(false);
    }
}
var count = 10;
function CheckInteract(){
    for (var i = 0 ; i < cube.length; i++) {
        if (x_circle >= cube[i][0] - 0.2 && x_circle <= cube[i][0] + 0.2 && y_circle >= cube[i][1] - 0.2 && y_circle <= cube[i][1] + 0.2) {
            cube.splice(i, 1);
                score += 100;
                scoreNode.nodeValue = score;
                count--;
            
        }
	}
	if (count == 0) stop = true;
}

function drawScene()
{    
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    gl.uniform1i(shaderProgram.useLightingUniform, false);
    
    mat4.identity(mvMatrix);

    mat4.rotate(mvMatrix, degToRad(30 + y_circle * 4), [1, 0, 0]);
    mat4.rotate(mvMatrix, degToRad(0 + x_circle * 4), [0, 1, 0]);
	mat4.rotate(mvMatrix, degToRad(0), [0,0,1]);

    // scene
    
    mat4.translate(mvMatrix, [0, -6, -7]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, mudTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, worldVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, worldVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, worldVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, worldVertexPositionBuffer.numItems);

    //light
    var lighting = document.getElementById("lighting").checked;
    gl.uniform1i(shaderProgram.useLightingUniform, lighting);
    if (lighting) {
        gl.uniform3f(//anh sang moi truong 
                   shaderProgram.ambientColorUniform,
                   parseFloat(0.1),
                   parseFloat(0.1),
                   parseFloat(0.1)
               );

        gl.uniform3f(// vi tri dat nguon sang
            shaderProgram.pointLightingLocationUniform,
            parseFloat(-5.0),
            parseFloat(5.0),
            parseFloat(10.0)
        );

        gl.uniform3f(// mau cua diem 
            shaderProgram.pointLightingColorUniform,
            parseFloat(0.8),
            parseFloat(0.8),
            parseFloat(0.8)
        );
    }

    // cycle
    mvPushMatrix();
    mat4.translate(mvMatrix, [x_circle, 0.2, y_circle]);
    drawCycle();
    mvPopMatrix();
    
    mat4.translate(mvMatrix, [0, 0.2, 0]);

    
	//alert(cube.length);
    for (var i =0 ; i < cube.length; i++) {
        mvPushMatrix();
		mat4.translate(mvMatrix, [cube[i][0], 0.0, cube[i][1]]);        
        drawCube();
		mvPopMatrix();
    }    
}


function drawCycle() {
    mvPushMatrix();
	if(k==1){
	mat4.rotate(mvMatrix, degToRad(-x_circle*180), [0, 0, 1]);
	}
	else if (k==2)
	mat4.rotate(mvMatrix, degToRad(y_circle * 180), [1, 0, 0]);
	else{
		mat4.rotate(mvMatrix, degToRad(-x_circle*180), [0, 0, 1]);
		mat4.rotate(mvMatrix, degToRad(y_circle * 180), [1, 0, 0]);
	}

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, earthColorMapTexture);
    gl.uniform1i(shaderProgram.colorMapSamplerUniform, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, earthSpecularMapTexture);
    gl.uniform1i(shaderProgram.specularMapSamplerUniform, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, sphereVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, sphereVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix();
}

function drawCube() {
    
    mvPushMatrix();
    mat4.rotate(mvMatrix, degToRad(xRot), [1, 0, 0]);
    mat4.rotate(mvMatrix, degToRad(yRot), [0, 1, 0]);
    mat4.rotate(mvMatrix, degToRad(zRot), [0, 0, 1]); 

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, neheTexture);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix();
}

var lastTime = 0;
var joggingAngle = 0;


var clock = 0;
var fix = new Date().getTime();
var currentTime = 0;
function animate()
{    
    var timeNow = new Date().getTime();
    if ((x_circle != 0 || y_circle != 0) && stop != true) {
        clock = (timeNow - fix) / 1000;
        timeNode.nodeValue = clock.toFixed(2);
        currentTime = clock;
    }
    else {
        timeNode.nodeValue = currentTime.toFixed(2);
    }

    if (lastTime != 0)
    {
        clock += 1;
        var elapsed = timeNow - lastTime;
        xRot += (90 * elapsed) / 1000.0;
        yRot += (90 * elapsed) / 1000.0;
        zRot += (90 * elapsed) / 1000.0;

        if (speed != 0) {
            xPos -= Math.sin(degToRad(yaw)) * speed * elapsed;
            zPos -= Math.cos(degToRad(yaw)) * speed * elapsed;

            joggingAngle += elapsed * 0.6; // 0.6 "fiddle factor" - makes it feel more realistic :-)
            yPos = Math.sin(degToRad(joggingAngle)) / 20 + 0.4
        }
        
    }
    lastTime = timeNow;
    
}

function tick() {
    requestAnimFrame(tick);    
    handleKeys();
    drawScene();
    animate();
    CheckInteract();    
}

function webGLStart() {
    var canvas = document.getElementById("lesson10-canvas");

    initGL(canvas);
    initShaders();
    initBuffers();
    initTexture();
    loadWorld();
	initCube();

    gl.clearColor(0.0, 0.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}
