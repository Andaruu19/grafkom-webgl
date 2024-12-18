function main() {
  var canvas = document.getElementById("myCanvas");
  var gl = canvas.getContext("webgl");

  // Check if WebGL is successfully initialized
  if (!gl) {
    alert("WebGL is not supported or failed to initialize.");
    return;
  }

  var vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  var vertexShaderCode = document.getElementById("vertexShaderCode").text;

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderCode);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(
      "Vertex shader failed to compile: ",
      gl.getShaderInfoLog(vertexShader)
    );
    return;
  }

  var fragmentShaderCode = `
        precision mediump float;
        varying vec3 vPosition;
        varying vec3 vColor;
        varying vec3 vNormal;
        uniform vec3 uAmbientColor;
        uniform float uAmbientIntensity;
        uniform vec3 uDiffuseColor;
        uniform vec3 uDiffusePosition;
        uniform mat3 uNormal;
        uniform vec3 uViewerPosition;

        void main() {
            vec3 ambient = vColor * uAmbientColor * uAmbientIntensity;
            
            vec3 lightPos = uDiffusePosition;
            vec3 vlight = normalize(lightPos - vPosition);
            vec3 normalizedNormal = normalize(uNormal * vNormal);
            
            float cosTheta = dot(normalizedNormal, vlight);
            vec3 diffuse = vec3(0.0, 0.0, 0.0);
            if (cosTheta > 0.0) {
                float diffuseIntensity = cosTheta;
                diffuse = vColor * uDiffuseColor * diffuseIntensity;
            }

            vec3 reflector = reflect(-vlight, normalizedNormal);
            vec3 normalizedReflector = normalize(reflector);
            vec3 normalizedViewer = normalize(uViewerPosition - vPosition);
            float cosPhi = dot(normalizedReflector, normalizedViewer);
            vec3 specular = vec3(0.0, 0.0, 0.0);
            if (cosPhi > 0.0) {
                float shininessConstant = 100.0;
                float specularIntensity = pow(cosPhi, shininessConstant);
                specular = vColor * uDiffuseColor * specularIntensity;
            }

            vec3 phong = ambient + diffuse + specular;
            gl_FragColor = vec4(phong, 1.0);
        }
    `;

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderCode);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(
      "Fragment shader failed to compile: ",
      gl.getShaderInfoLog(fragmentShader)
    );
    return;
  }

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  var aPos = gl.getAttribLocation(program, "aPosition");
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aPos);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  var aColor = gl.getAttribLocation(program, "aColor");
  gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aColor);

  // Add normal buffer setup
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  var aNormal = gl.getAttribLocation(program, "aNormal");
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(aNormal);

  // Add lighting uniforms
  var camera = [0.0, 0.0, 5.0];
  var uViewerPosition = gl.getUniformLocation(program, "uViewerPosition");
  gl.uniform3fv(uViewerPosition, camera);

  var uAmbientColor = gl.getUniformLocation(program, "uAmbientColor");
  gl.uniform3fv(uAmbientColor, [0.1, 0.1, 0.1]);
  var uAmbientIntensity = gl.getUniformLocation(program, "uAmbientIntensity");
  gl.uniform1f(uAmbientIntensity, 0.3);
  var uDiffuseColor = gl.getUniformLocation(program, "uDiffuseColor");
  gl.uniform3fv(uDiffuseColor, [1.0, 1.0, 1.0]);
  var uDiffusePosition = gl.getUniformLocation(program, "uDiffusePosition");
  gl.uniform3fv(uDiffusePosition, [2.0, 2.0, 0.0]);
  var uNormal = gl.getUniformLocation(program, "uNormal");

  var angle = 0;
  function render(time) {
    if (!freeze) {
      angle += 0.01;
    }

    // Get the rotation matrix
    var sa = Math.sin(angle);
    var ca = Math.cos(angle);
    var forMatrix = new Float32Array([
      1.0,
      0.0,
      0.0,
      0.0,
      0.0,
      ca,
      -sa,
      0.0,
      0.0,
      sa,
      ca,
      0.0,
      0.0,
      0.0,
      0.0,
      1.0,
    ]);

    // Set the model matrix
    var uFormMatrix = gl.getUniformLocation(program, "uFormMatrix");
    gl.uniformMatrix4fv(uFormMatrix, false, forMatrix);

    // Calculate and set the normal matrix
    var normalMatrix = new Float32Array([
      1.0,
      0.0,
      0.0,
      0.0,
      ca,
      -sa,
      0.0,
      sa,
      ca,
    ]);
    gl.uniformMatrix3fv(uNormal, false, normalMatrix);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clearDepth(1.0);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    window.requestAnimationFrame(render);
  }

  render(1);
}
