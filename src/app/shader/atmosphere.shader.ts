import { Shader } from 'three';

export const atmosphereShader: Shader = {
	uniforms: {},
	vertexShader: [
		'varying vec3 vNormal;',
		'void main() {',
		'vNormal = normalize( normalMatrix * normal );',
		'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
		'}'
	].join('\n'),
	fragmentShader: [
		'varying vec3 vNormal;',
		'void main() {',
		'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
		'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
		'}'
	].join('\n')
};
