/*
=============================================================================================
 Name        :  prog3_Dapprich.js
 Author      :  Cole Dapprich
 Version     :  1.0
 Course      :  CSCE 4230.001
 Description :  This JavaScript program, in collaboration with prog3_Dapprich.html, uses
				WebGL, 2 ModelView matrices, a triangle strip, and a triangle fan to draw a
				triangle, a square, and a hexagon, rotating them in various interesting ways.
				Built using prog2_Dapprich and Matsuda's RotatingTriangle_withButtons as a
				template.
 Copyright   :  © 2017 CDSoftworks ( AMDG )
=============================================================================================
*/

"use strict";

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  'gl_Position = u_ModelMatrix * a_Position;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
	'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +	
	'void main() {\n' +
	'gl_FragColor = u_FragColor;\n' +
	'}\n';

// Global variables
var ANGLE_STEP = 0.0;
var PREV_ANGLE_STEP = 0.0;
var pointSz = 0.05;
var bobRad = 0.1;
var halfBobRad = 0.05;
var bobDia = 0.2;
var len = 0.01;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  
  // Get the storage location of u_FragColor
    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 0);

  // Get storage location of u_ModelMatrix - matrix for bob and wire
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
  
  // Get storage location of u_ModelMatrix2 - matrix for anchor
	var u_ModelMatrix2 = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	if (!u_ModelMatrix2) { 
	console.log('Failed to get the storage location of u_ModelMatrix');
	return;
	}

  // Current rotation angle
  var currentAngle = 0.0;
  
  // Model matrices
  var modelMatrix = new Matrix4(); // bob and wire
  var modelMatrix2 = new Matrix4(); // anchor

  var anchorColor = [0.0,  1.0,  0.0,  1.0]; // green  
  var bobColor = [0.0,  0.0,  1.0,  1.0]; // blue
  var wireColor = [1.0,  0.0,  0.0,  1.0]; // red
  
  //wire vertices
  var wireVerts = [ pointSz, 	pointSz, 	0.0,
					-pointSz,	pointSz,	0.0,  	
					pointSz,	-pointSz, 	0.0 ];

  // use triangle fan to find bob vertices - starting at center of hexagon and going clockwise
  var bobVerts = [
		-1, 			-len - bobRad,					0.0,
		-1,				-len - bobDia,					0.0,
		bobRad - 1,		-len - (bobRad + halfBobRad),	0.0,
		bobRad - 1,		-len - halfBobRad,				0.0, 
		-1,				-len,							0.0,
		-bobRad - 1,	-len - halfBobRad,				0.0,
		-bobRad - 1,	-len - (bobRad + halfBobRad),	0.0,
		-1,				-len - bobDia,					0.0
	];
	
	var anchorVerts = [
		pointSz, 	pointSz, 	0.0,
		-pointSz,	pointSz,	0.0,  	
		pointSz,	-pointSz, 	0.0,
		-pointSz,	-pointSz,	0.0
	];
	
	// get a_Position
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if(a_Position < 0) {
		console.log('Failed to get the storage location of a_Position');
		return -1;
	}
	gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
	
  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
	
	// draw bob
	drawMove(gl, currentAngle, modelMatrix, u_ModelMatrix, u_FragColor, wireColor, bobColor, wireVerts, bobVerts);
	
	// draw wire
	drawMove2(gl, currentAngle, modelMatrix, u_ModelMatrix, u_FragColor, wireColor, bobColor, wireVerts, bobVerts);
	
	// draw anchor
	drawStatic(gl, currentAngle, modelMatrix2, u_ModelMatrix2, u_FragColor, anchorColor, anchorVerts);
	
	requestAnimationFrame(tick, canvas);   // Request that the browser calls tick
  };
  tick(); // loop
}

function initVertexBuffers(gl) {
  var n = 4;   // The number of vertices

  // Create a buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  
  // Assign the buffer object to a_Position variable
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  
  if(a_Position < 0) {
	console.log('Failed to get the storage location of a_Position');
	return -1;
  }
	
	// Enable the assignment to a_Position variable
	gl.enableVertexAttribArray(a_Position);	//only need to enable once
	
	return n;
}

// draw the anchor
function drawStatic(gl, currentAngle, modelMatrix, u_ModelMatrix, u_FragColor, color, anchorVerts) {
	// set rotation matrix
	modelMatrix.setRotate(currentAngle, 1, -1, 1);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements); 
	
	// set color
	gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
	
	// Write data into the buffer object
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array (anchorVerts), gl.STATIC_DRAW);
	
	//draw square with triangle strip
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// draw the bob
function drawMove(gl, currentAngle, modelMatrix, u_ModelMatrix, u_FragColor, color1, color2, wireVerts, bobVerts) {
	// Set the rotation matrix
	modelMatrix.setRotate(currentAngle, 0, 1, -1);
	modelMatrix.translate(currentAngle / 500, 0, 0);
	
	// Pass the rotation matrix to the vertex shader
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
	
	// Clear <canvas>
	gl.clear(gl.COLOR_BUFFER_BIT);
	
	// get a_Position
	var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
	if(a_Position < 0) {
	  console.log('Failed to get the storage location of a_Position');
	  return -1;
	}
	
	// set bob color
	gl.uniform4f(u_FragColor, color2[0], color2[1], color2[2], color2[3]);

	// pass vertices to buffer
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array (bobVerts), gl.STATIC_DRAW);
	
	// pass vertex attributes to WebGL
	gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
	
	//draw bob
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 8);	//8 vertices
}

// draw wire
function drawMove2(gl, currentAngle, modelMatrix, u_ModelMatrix, u_FragColor, color1, color2, wireVerts, bobVerts) {
	// set rotation matrix
	modelMatrix.translate(0.5, 0.5, 0.5);
	modelMatrix.setRotate(currentAngle, 1, 0, 1);
	modelMatrix.translate(-0.5, -0.5, -0.5);
	gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements); 
	
	// set color
	gl.uniform4f(u_FragColor, color1[0], color1[1], color1[2], color1[3]);
	
	// Write data into the buffer object
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array (wireVerts), gl.STATIC_DRAW);
	
	//draw square with triangle strip
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
}

// Global variable storing the last time that this function was called
var g_last = Date.now();

// update positions, angles, and g_last
function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}


// toggle the animation on/off - called when "ON/OFF" button is clicked
function start_stop() {
  if (ANGLE_STEP == 0)
  {
	if (PREV_ANGLE_STEP == 0)
	{
		ANGLE_STEP = 90.0;
	}
	else
	{
	  ANGLE_STEP = PREV_ANGLE_STEP;
	}
  }
  
  else
  {
	PREV_ANGLE_STEP = ANGLE_STEP;
	ANGLE_STEP = 0.0;
  }
}

// set angular velocity to 75 - called when "SLOW" button is clicked
function slow() {
  ANGLE_STEP = 45.0;
}

// set angular velocity to 100 - called when "MED" button is clicked
function med() {
  ANGLE_STEP = 90.0;
}

// set angular velocity to 125 - called when "FAST" button is clicked
function fast() {
  ANGLE_STEP = 180.0;
}