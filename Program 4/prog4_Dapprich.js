/*
=============================================================================================
 Name        :  prog4_Dapprich.js
 Author      :  Cole Dapprich
 Version     :  1.0
 Course      :  CSCE 4230.001
 Description :  This JavaScript program, in collaboration with prog4_Dapprich.html, uses 
                WebGL, a triangle mesh, Gouraud shading and lighting, and a depth buffer to
                display the graph of a bivariate function. Built using Matsuda's
                LightedCube_animation as a template.
 Copyright   :  © 2017 CDSoftworks ( AMDG )
=============================================================================================
*/

"use strict";

// using k = 10

function bivariate(x, y) // the given bivariate function
{
    var z = .5 * Math.exp(-.04 * Math.sqrt(Math.pow((80 * x - 40), 2) + Math.pow((90 * y - 45), 2))) *
                 Math.cos(0.15 * Math.sqrt(Math.pow((80 * x - 40), 2) + Math.pow((90 * y - 45), 2)));
    return z;
}

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform vec3 u_LightDirection;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  vec4 normal = u_NormalMatrix * a_Normal;\n' +
  '  float nDotL = max(dot(u_LightDirection, normalize(normal.xyz)), 0.0);\n' +
  '  v_Color = vec4(a_Color.xyz * nDotL, a_Color.a);\n' + 
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

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

  // Initialize vertex buffers
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  
  // Set the clear color and enable the depth test
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables and so on
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  if (!u_MvpMatrix || !u_NormalMatrix || !u_LightDirection) { 
    console.log('Failed to get the storage location');
    return;
  }

  var vpMatrix = new Matrix4();   // View projection matrix
  
  // Calculate the view projection matrix
  vpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  vpMatrix.lookAt(3, 3, 7, 0, 0, 0, 0, 1, 0);
  
  // Set the light direction (in the world coordinate)
  var lightDirection = new Vector3([0.5, 3.0, 4.0]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);
  
  var currentAngle = 0.0;  // Current rotation angle
  var modelMatrix = new Matrix4();  // Model matrix
  var mvpMatrix = new Matrix4();    // Model view projection matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals

  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle

    // Calculate the model matrix
    modelMatrix.setRotate(currentAngle, 0, 1, 0); // Rotate around the y-axis
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the function
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(tick, canvas); // Request that the browser ?calls tick
  };
  tick();
}

function draw(gl, n, angle, vpMatrix, u_MvpMatrix, u_NormalMatrix) {
}

function initVertexBuffers(gl) {
  // array declarations
  var triVerts = new Array(); // vertices for each triangle
  var vertices = new Float32Array(121*3); // array of vertices passed to WebGL
  var triInds = new Array(); // indices for each triangle
  var indices = new Uint16Array(200 * 3); // array of indices passed to WebGL
  var vertNorms = new Array(); // normals for each vertex
  var normals = new Float32Array(121*3); // array of normals passed to WebGL
  
  // triArray initializations
  for (var i = 0; i < 121; i++) {
    triVerts[i] = new Array(); // array for storing each triangle's coordinates (x, y, z)
    for (var j = 0; j < 3; j++) {
      triVerts[i][j] = 0; // initialize to 0
    }
  }
  for (var i = 0; i < 200; i++) {
    triInds[i] = new Array();
    for (var j = 0; j < 3; j++) {
      triInds[i][j] = 0;
    }
  }
  for (var i = 0; i < 121; i++) {
    vertNorms[i] = new Array();
    for(var j = 0; j < 3; j++) {
      vertNorms[i][j] = 0;
    }
  }

  calculateVertices(triVerts, vertices);
  calculateIndices(triInds, indices);
  calculateNormals(triVerts, triInds, vertNorms, normals);
  
  // store colors
  var colors = new Float32Array(121*3);
  for(var i = 0; i <= colors.length; i+=3) {
    colors[i + 0] = 1.0;
    colors[i + 1] = 0.0;
    colors[i + 2] = 0.0;
  }

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function calculateVertices(triVerts, vertices) {
  var h = 1.0/10.0;
  var index = 0;
  var x, y;
  for(var i = 0; i <= 10; i++) {
    y = i * h;
    for(var j = 0; j <= 10; j++) {
      x = j * h;
      triVerts[index][0] = x;
      triVerts[index][1] = y;
      triVerts[index][2] = bivariate(x, y);
      index++;
    }
  }
  
  // push triVerts onto vertices
  var counter = 0;
  for (var i = 0; i < 121; i++) {
    for (var j = 0; j < 3; j++) {
      vertices[counter] = triVerts[i][j];
      counter++;
    }
  }
}

function calculateIndices(triInds, indices) {
  var index = 0;
  var index2 = 0;
  var counter = 0;
  for (var i = 1; i <= 10; i++) {
    for (var j = 1; j <= 10; j++) {
      index2 = i * (10 + 1) + j;

      triInds[index][0] = index2 - 10 - 2;
      triInds[index][1] = index2 - 10 - 1;
      triInds[index][2] = index2;
      triInds[index + 1][0] = index2 - 10 - 2;
      triInds[index + 1][1] = index2;
      triInds[index + 1][2] = index2 - 1;

      index += 2;
    }
  }
  
  // push triInds onto indices
  var counter = 0;
  for (var i = 0; i < 200; i++) {
    for (var j = 0; j < 3; j++) {
      indices[counter] = triInds[i][j];
      counter++;
    }
  }
}

function normalize(arr) {
  var v = arr;
  var c = v[0], d = v[1], e = v[2], g = Math.sqrt(c * c + d * d + e *e);
  if(g){
    if(g == 1)
      return v;
   } else {
      v[0] = 0; v[1] = 0; v[2] = 0;
      return v;
   }
   g = 1/g;
   v[0] = c*g; v[1] = d*g; v[2] = e*g;
   return v;
}

function calculateNormals(triVerts, triInds, vertNorms, normals) {
  for (var index = 0; index < 200; index++) {
        var i1 = triInds[index][0];
        var i2 = triInds[index][1];
        var i3 = triInds[index][2];
        var tempNormals = new Array(3);
        tempNormals[0] = (triVerts[i2][1]-triVerts[i1][1]) * (triVerts[i3][2]-triVerts[i1][2]) -
                         (triVerts[i2][2]-triVerts[i1][2]) * (triVerts[i3][1]-triVerts[i1][1]);

        tempNormals[1] = (triVerts[i2][2]-triVerts[i1][2]) * (triVerts[i3][0]-triVerts[i1][0]) -
                         (triVerts[i2][0]-triVerts[i1][0]) * (triVerts[i3][2]-triVerts[i1][2]);

        tempNormals[2] = (triVerts[i2][0]-triVerts[i1][0]) * (triVerts[i3][1]-triVerts[i1][1]) -
                         (triVerts[i2][1]-triVerts[i1][1]) * (triVerts[i3][0]-triVerts[i1][0]);
        
        normalize(tempNormals);
        for (var i = 0; i < 3; i++) {
            vertNorms[i1][i] += tempNormals[i];
            vertNorms[i2][i] += tempNormals[i];
            vertNorms[i3][i] += tempNormals[i];
        }
  }

  for (var index = 0; index < 121; index++) {
    normalize(vertNorms[index]);
  }
  
  var counter = 0;
  for (var i = 0; i < 121; i++) {
    for (var j = 0; j < 3; j++) {
      normals[counter] = vertNorms[i][j];
      counter++;
    }
  }
}

function initArrayBuffer(gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

// Rotation angle (degrees/second)
var ANGLE_STEP = 30.0;
// Last time that this function was called
var g_last = Date.now();
function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}