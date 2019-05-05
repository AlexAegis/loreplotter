import { Shader } from 'three';

export const atmosphereShader: Shader = {
	uniforms: {},
	vertexShader: `
	uniform vec3 viewVector;
	uniform float c;
	uniform float p;
	varying float intensity;
	void main()
	{
		vec3 vNormal = normalize( normalMatrix * normal );
		vec3 vNormalView = normalize( normalMatrix * viewVector );
		intensity = pow( c - dot(vNormal, vNormalView), p );

		gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	}`,
	fragmentShader: `uniform vec3 glowColor;
	varying float intensity;
	void main()
	{
		vec3 glow = glowColor * intensity;
		gl_FragColor = vec4( glow, 1.0 );
	}`
};