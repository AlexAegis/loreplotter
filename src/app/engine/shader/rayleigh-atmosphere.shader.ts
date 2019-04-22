import { Shader } from 'three';

export const atmosphereShader: Shader = {
	uniforms: {},
	vertexShader: `
		attribute vec3 sampleDir;
		varying vec3 vDir;
		varying vec2 vUv;
		void main() {
			vUv = uv;
			vDir = sampleDir;
			gl_Position = projectionMatrix *
				modelViewMatrix * vec4( position, 1.0 );
		}`,
	fragmentShader: `
		vec3 oolambda4 = vec3(
		1.0 / pow( 0.650, 4. ),		// 650nm red
		1.0 / pow( 0.570, 4. ),		// 570nm green
		1.0 / pow( 0.475, 4. )		// 475nm blue
		);

		uniform float rayleigh_scale_depth;
		uniform float mie_scale_depth;

		const float pi = 3.141592654;
		uniform float k_rayleigh, k_mie;
		float k_rayleigh_4pi = k_rayleigh * 4.0 * pi,
			k_mie_4pi = k_mie * 4.0 * pi;

		const float E_sun = 15.0;
		const float g = 0.75;

		const int nsamples = 4, nout_samples = 10;
		uniform float atmos_radius, planet_radius;
		uniform vec3 planet_pos;
		uniform vec3 camera_pos;
		uniform vec3 sun;

		struct Collision {
			bool hit;
			float t1, t2;
		};

		Collision ray_to_sphere( vec3 start,
			vec3 dir, float radius ) {

			float b = 2.0 * dot( start, dir );
			float c = dot( start, start ) - radius * radius;

			float det = b*b - 4.0 * c;
			if( det < 0. )
				return Collision( false, 0., 0. );

			float sqdet = sqrt(det);
			float t2 = 0.5 * ( -b + sqdet );
			return Collision( t2 > 0., 0.5 * ( -b - sqdet ), t2 );
		}

		float phase( float cosangle, float g ) {
			return 1.5 * (1. - g*g) / (2. + g*g) *
				(1. + cosangle*cosangle) /
				pow( 1. + g*g - 2. * g * cosangle, 1.5 );
		}


		vec3 out_scatter( vec3 pos, vec3 dir ) {
			Collision planet_inter = ray_to_sphere(pos, dir, planet_radius);
			if( planet_inter.hit ) return vec3( 1000.0, 1000.0, 1000.0 );

			Collision atmos_inter = ray_to_sphere( pos, dir, atmos_radius );
			vec3 end = pos + dir * atmos_inter.t2;
			vec3 step = ( end - pos ) / float(nout_samples);
			float step_dist = length( step );
			vec3 sample = pos + step * 0.5;

			vec3 result = vec3( 0. );
			for( int i = 0; i < nout_samples; ++i ) {
				float height = length( sample ) - planet_radius;
				result += step_dist *
					(k_rayleigh_4pi * oolambda4 *
						exp( -height / rayleigh_scale_depth ) +
					k_mie_4pi * vec3( 1., 1., 1. ) *
						exp( -height / mie_scale_depth ) );
				sample += step;
			}

			return result;
		}

		vec4 atmos_sample( vec3 pos, vec3 dir ) {
			Collision planet_inter = ray_to_sphere(pos, dir, planet_radius);
			Collision atmos_inter = ray_to_sphere( pos, dir, atmos_radius );

			if( !planet_inter.hit && !atmos_inter.hit )    discard;
			float start_t = 0.0;
			if( atmos_inter.t1 > 0. )    start_t = atmos_inter.t1;

			float end_t = atmos_inter.t2;
			if( planet_inter.hit )      end_t = planet_inter.t1;

			vec3 start = pos + dir * start_t;
			vec3 end = pos + dir * end_t;
			vec3 step = ( end - start ) / float(nsamples);
			float step_dist = length( step );
			vec3 sample = start + step * 0.5;

			vec3 rayleigh_integral = vec3(0.), mie_integral = vec3(0.);
			for( int i = 0; i < nsamples; ++i ) {
				float height = length( sample ) - planet_radius;
				vec3 loss_from_sun = out_scatter( sample, sun );
				vec3 loss_to_camera = out_scatter( sample, -dir );
				vec3 scale = exp( -loss_from_sun - loss_to_camera );
				rayleigh_integral += step_dist * scale *
					exp( -height / rayleigh_scale_depth );
				mie_integral += step_dist * scale *
					exp( -height / mie_scale_depth );
				sample += step;
			}

			float cosangle = dot( sun, dir );
			return vec4(
				phase( cosangle, 0.0 ) * rayleigh_integral *
					oolambda4 * k_rayleigh * E_sun +
				phase( cosangle, g ) * mie_integral * k_mie * E_sun,
				1.0 );
		}

		varying vec3 vDir;
		varying vec2 vUv;
		uniform sampler2D planet;

		void main() {
			vec3 dir = normalize( vDir );
			vec3 offpos = camera_pos - planet_pos;
			Collision planet_inter = ray_to_sphere(
				offpos, dir, planet_radius );
			vec4 planet_color = texture2D( planet, vUv );
			float inter = planet_inter.t1 - 0.001;
			vec3 scatter = out_scatter( offpos + dir * inter, -dir );
			vec4 atten = vec4( exp( -scatter ), 1.0 );

			gl_FragColor = 1.*atmos_sample( offpos, dir ) +
				planet_color * atten;
		}`
};
