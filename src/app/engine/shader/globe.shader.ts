import { Shader } from 'three';
import * as THREE from 'three';

export const globeShader: Shader = {
	uniforms: { texture: { value: THREE.ImageUtils.loadTexture(`../../assets/world.jpg`) } },
	vertexShader: `
		varying vec3 vNormal;
		varying vec2 vUv;
		void main() {
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			vNormal = normalize( normalMatrix * normal );
			vUv = uv;
		}
	`,
	fragmentShader: `
		uniform sampler2D texture;
		varying vec3 vNormal;
		varying vec2 vUv;
		void main() {
			vec3 diffuse = texture2D( texture, vUv ).xyz;
			float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.2, 1.0 ) );
			vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 0.8 );
			gl_FragColor = vec4( diffuse + atmosphere, 0.6 );
		}
	`
};
