import { Shader } from 'three';

export const atmosphereShader: Shader = {
	uniforms: {},
	vertexShader: `
		varying vec3 vNormal;
		void main() {
			vNormal = normalize( normalMatrix * normal );
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,
	fragmentShader: `
		varying vec3 vNormal;
		void main() {
			float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 2.0 );
			gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;
		}`
};
