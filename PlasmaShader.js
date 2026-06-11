// PlasmaShader.js - Three.js shader helper

// Create plasma shader material
function createPlasmaShaderMaterial() {
  const uniforms = {
    u_time: { value: 0 },
    u_res:  { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
  };
  
  return new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: DEFAULT_VS,
    fragmentShader: DEFAULT_FS,
    side: THREE.DoubleSide
  });
}

// Update shader time
function updateShaderTime(material, time) {
  if (material && material.uniforms && material.uniforms.u_time) {
    material.uniforms.u_time.value = time / 1000;
  }
}

// Default vertex shader
const DEFAULT_VS = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

// Default fragment shader (ocean waves)
const DEFAULT_FS = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_res;
  varying vec2  vUv;
  void main(){
    vec2 uv = gl_FragCoord.xy / u_res;
    float t = u_time * 0.8;
    float wave = 0.0;
    for(int i=1;i<=5;i++){
      float fi=float(i);
      wave += sin(uv.x*fi*4.0 + t*fi*0.5 + cos(uv.y*fi*2.0+t)) / fi;
    }
    float c = (wave + 1.5) / 3.0;
    gl_FragColor = vec4(c, c, c, 1.0);
  }`;
