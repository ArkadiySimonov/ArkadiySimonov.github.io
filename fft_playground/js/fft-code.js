/**
 * Original work is from:
 * @author David Li / http://david.li/waves/
 * @author Aleksandr Albert / http://www.routter.co.tt
 * @author jbouny / https://github.com/fft-ocean
 *
 * can be found here: https://github.com/jbouny/fft-ocean
 
 * Modified:
 * @author Arkadiy 
 */

navigator.getUserMedia = 
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;



const sz = 512;

FFTCamera = function initAndRunFFT() {
    this.setupCamera();
    
    this.px=10;
    this.py=0;
    
    var BaseParams = {
		format: THREE.RGBAFormat,
		stencilBuffer: false,
		depthBuffer: false,
		premultiplyAlpha: false,
		type: THREE.FloatType
	};
    
	var LinearClampParams = JSON.parse(JSON.stringify(BaseParams));
	LinearClampParams.minFilter = LinearClampParams.magFilter = THREE.LinearFilter ;
	LinearClampParams.wrapS = LinearClampParams.wrapT = THREE.ClampToEdgeWrapping ;
	
	var NearestClampParams = JSON.parse(JSON.stringify(BaseParams));
	NearestClampParams.minFilter = NearestClampParams.magFilter = THREE.NearestFilter ;
	NearestClampParams.wrapS = NearestClampParams.wrapT = THREE.ClampToEdgeWrapping ;
	
	var NearestRepeatParams = JSON.parse(JSON.stringify(BaseParams));
	NearestRepeatParams.minFilter = NearestRepeatParams.magFilter = THREE.NearestFilter ;
	NearestRepeatParams.wrapS = NearestRepeatParams.wrapT = THREE.RepeatWrapping ;
	
	var LinearRepeatParams = JSON.parse(JSON.stringify(BaseParams));
	LinearRepeatParams.minFilter = LinearRepeatParams.magFilter = THREE.LinearFilter ;
	LinearRepeatParams.wrapS = LinearRepeatParams.wrapT = THREE.RepeatWrapping ;
    
    this.resolution = sz;
    
    this.pingTransformFramebuffer = new THREE.WebGLRenderTarget(this.resolution, this.resolution, NearestRepeatParams);
	this.pongTransformFramebuffer = new THREE.WebGLRenderTarget(this.resolution, this.resolution, NearestRepeatParams);
    
    this.videoTexture = new THREE.Texture( this.video, NearestRepeatParams); //, 
    this.videoTexture.minFilter = THREE.LinearFilter;
//this.videoTexture.magFilter = THREE.LinearFilter;
//this.videoTexture.format = THREE.RGBFormat;

    this.spectrumFramebuffer = new THREE.WebGLRenderTarget(this.resolution, this.resolution, NearestRepeatParams);
    this.ftFrameBuffer = new THREE.WebGLRenderTarget(this.resolution, this.resolution, NearestRepeatParams);
    
    this.renderer = new THREE.WebGLRenderer({canvas: document.getElementById('cnv')});
    this.renderer.setSize(sz, sz);
	this.renderer.clearColor( 0xffffff );
	
	this.scene = new THREE.Scene();
	
	// Enable necessary extensions
	this.renderer.context.getExtension('OES_texture_float');
	this.renderer.context.getExtension('OES_texture_float_linear');
    
    // 0 - The vertex shader used in all of the simulation steps
	var fullscreeenVertexShader = THREE.ShaderLib["ocean_sim_vertex"];
		
	// 1 - Horizontal wave vertices used for FFT
	var oceanHorizontalShader = THREE.ShaderLib["ocean_subtransform"];
	var oceanHorizontalUniforms = THREE.UniformsUtils.clone(oceanHorizontalShader.uniforms);
	this.materialOceanHorizontal = new THREE.ShaderMaterial({
		uniforms: oceanHorizontalUniforms,
		vertexShader: fullscreeenVertexShader.vertexShader,
		fragmentShader: "#define HORIZONTAL\n"+oceanHorizontalShader.fragmentShader
	});
    
	this.materialOceanHorizontal.uniforms.u_transformSize = { type: "f", value: this.resolution };
	this.materialOceanHorizontal.uniforms.u_subtransformSize = { type: "f", value: null };
	this.materialOceanHorizontal.uniforms.u_input = { type: "t", value: null };
	this.materialOceanHorizontal.depthTest = false;
	
	// 2 - Vertical wave vertices used for FFT
	var oceanVerticalShader = THREE.ShaderLib["ocean_subtransform"];
	var oceanVerticalUniforms = THREE.UniformsUtils.clone(oceanVerticalShader.uniforms);
	this.materialOceanVertical = new THREE.ShaderMaterial({
		uniforms: oceanVerticalUniforms,
		vertexShader: fullscreeenVertexShader.vertexShader,
		fragmentShader: oceanVerticalShader.fragmentShader
	});
	this.materialOceanVertical.uniforms.u_transformSize = { type: "f", value: this.resolution };
	this.materialOceanVertical.uniforms.u_subtransformSize = { type: "f", value: null };
	this.materialOceanVertical.uniforms.u_input = { type: "t", value: null };
	this.materialOceanVertical.depthTest = false;
    
    this.materialOceanHorizontal.blending = 0;
	this.materialOceanVertical.blending = 0;
    
    // Create the simulation plane
	this.screenQuad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ) );
	this.scene.add(this.screenQuad);
    
	this.oceanCamera = new THREE.OrthographicCamera(); //camera.clone();
    this.oceanCamera.position.z = 1;
}


FFTCamera.prototype.renderSpectrumFFT = function() {

    
    
	// GPU FFT using Stockham formulation
	var iterations = Math.log2( this.resolution ) * 2; // log2
	
	
    
//    this.scene.overrideMaterial = this.materialOceanVertical;
//	var subtransformProgram = this.materialOceanVertical;
	
	
	// Processus 0-N
	// material = materialOceanHorizontal
	// 0 : material( spectrumFramebuffer ) > pingTransformFramebuffer
	
	// i%2==0 : material( pongTransformFramebuffer ) > pingTransformFramebuffer
	// i%2==1 : material( pingTransformFramebuffer ) > pongTransformFramebuffer
	
	// i == N/2 : material = materialOceanVertical
	
	// i%2==0 : material( pongTransformFramebuffer ) > pingTransformFramebuffer
	// i%2==1 : material( pingTransformFramebuffer ) > pongTransformFramebuffer
	
	// N-1 : materialOceanVertical( pingTransformFramebuffer / pongTransformFramebuffer ) > displacementMapFramebuffer
	
	var frameBuffer;
	var inputBuffer;
    
//    var onePoint = new THREE.ShaderMaterial({
//        uniforms: {
//		  "u_pos": { type: "v2", value: [(this.px+0.5)/512, (this.py+0.5)/512] },
//        },
//        vertexShader:   THREE.ShaderLib['ocean_sim_vertex'].vertexShader,
//        fragmentShader: THREE.ShaderLib['point'].fragmentShader
//    });
//    
//    this.scene.overrideMaterial = onePoint;
//    this.renderer.render(this.scene, this.oceanCamera, this.spectrumFramebuffer);
    
    
    //TODO: find error somewhere here. 
    //otherwise sort of works
    
    
    if( this.video.readyState === this.video.HAVE_ENOUGH_DATA ){
        this.videoTexture.needsUpdate = true;
    }


    this.spectrumFramebuffer = {texture:this.videoTexture};
    frameBuffer=this.spectrumFramebuffer;
    
    this.scene.overrideMaterial = this.materialOceanHorizontal;
	var subtransformProgram = this.materialOceanHorizontal;
    
	for (var i = 0; i < iterations; i++) {
		if (i === 0) {
			inputBuffer = this.spectrumFramebuffer;
			frameBuffer = this.pingTransformFramebuffer ;
		} 
		else if (i === iterations - 1) {
			inputBuffer = ((iterations % 2 === 0)? this.pingTransformFramebuffer : this.pongTransformFramebuffer) ;
            frameBuffer = this.ftFrameBuffer;
//            frameBuffer = undefined;
		}
		else if (i % 2 === 1) {
			inputBuffer = this.pingTransformFramebuffer;
			frameBuffer = this.pongTransformFramebuffer ;
		}
		else {
			inputBuffer = this.pongTransformFramebuffer;
			frameBuffer = this.pingTransformFramebuffer ;
		}
		
		if (i === iterations / 2) {
			subtransformProgram = this.materialOceanVertical;
			this.scene.overrideMaterial = this.materialOceanVertical;
		}
		
		subtransformProgram.uniforms.u_input.value = inputBuffer.texture;
		
		subtransformProgram.uniforms.u_subtransformSize.value = Math.pow(2, (i % (iterations / 2) + 1 ));
		this.renderer.render(this.scene, this.oceanCamera, frameBuffer);
	}
    
    var selectRedMaterial = new THREE.ShaderMaterial({
        uniforms: {u_input: { type: "t", value: frameBuffer.texture }},
        vertexShader:   THREE.ShaderLib['ocean_sim_vertex'].vertexShader,
        fragmentShader: THREE.ShaderLib['bypass'].fragmentShader
    })
    
    this.scene.overrideMaterial = selectRedMaterial;
    this.renderer.render(this.scene, this.oceanCamera);
};

FFTCamera.prototype.renderPoint = function() {
    var redMaterial = new THREE.ShaderMaterial({
        uniforms: {
		  "u_pos": { type: "v2", value: [(10+0.5)/512, (10+0.5)/512] },
        },
        vertexShader:   THREE.ShaderLib['ocean_sim_vertex'].vertexShader,
        fragmentShader: THREE.ShaderLib['point'].fragmentShader
    });
    
    this.scene.overrideMaterial = redMaterial;
    this.renderer.render(this.scene, this.oceanCamera);
}

FFTCamera.prototype.checkDirective = function() {
    var material = new THREE.ShaderMaterial({
        vertexShader:   THREE.ShaderLib['ocean_sim_vertex'].vertexShader,
        fragmentShader: THREE.ShaderLib['defineDirectiveCheck'].fragmentShader
    });
    
    this.scene.overrideMaterial = material;
    this.renderer.render(this.scene, this.oceanCamera);
}

FFTCamera.prototype.setupCamera = function () {
    this.video = document.createElement('video');//('FFTVideo');
    this.video.width = 512;
    this.video.height = 512;
    
    
    document.body.appendChild(this.video);
    this.videoCanvas = document.getElementById('VideoCanvas');
//    videoFFTCanvas = document.getElementById('FFTVideoCanvas');

    this.video.addEventListener('play', oneStep, false); //timerCallback
    
    var cvideo = this.video;
    

    navigator.getUserMedia(
        {video:true, audio:false},
        function(stream) {
            cvideo.src = URL.createObjectURL(stream);
            cvideo.play();
        },
        function (error) {
            alert(JSON.stringify(error, null, '\t'));
        });

}


var camera = new FFTCamera();
//camera.checkDirective();
//camera.renderPoint();
camera.renderSpectrumFFT();


function oneStep() {
    camera.px+=1;
    camera.px=camera.px%512;
    camera.renderSpectrumFFT();
    setTimeout(function () {
        requestAnimationFrame(oneStep);    
    },
                10);
    
}
//oneStep();



var DEMO = {
    ms_Renderer : null,
	ms_Camera : null,
	ms_Scene : null,

    
    initialize : function (){

        this.ms_Renderer = new THREE.WebGLRenderer({canvas: document.getElementById('cnv')});
        this.ms_Renderer.context.getExtension( 'OES_texture_float' );
        this.ms_Renderer.context.getExtension( 'OES_texture_float_linear' );
        this.ms_Renderer.setClearColor( 0x000000 );
        
        this.ms_Scene = new THREE.Scene();
        
		this.ms_Camera = new THREE.PerspectiveCamera( 55.0, WINDOW.ms_Width / WINDOW.ms_Height, 0.5, 1000000 );
		this.ms_Camera.position.set( 0, 350, 800 );
        this.ms_Camera.lookAt( new THREE.Vector3() );        
        
        // Initialize Ocean
		var gsize = 512;
		var res = 512;
		var gres = 256;
		var origx = -gsize / 2;
		var origz = -gsize / 2;
		this.ms_Ocean = new THREE.Ocean( this.ms_Renderer, this.ms_Camera, this.ms_Scene,
		{
			INITIAL_SIZE : 200.0,
			INITIAL_WIND : [ 10.0, 10.0 ],
			INITIAL_CHOPPINESS : 3.6,
			CLEAR_COLOR : [ 1.0, 1.0, 1.0, 0.0 ],
			SUN_DIRECTION : this.ms_MainDirectionalLight.position.clone(),
			OCEAN_COLOR: new THREE.Vector3( 0.35, 0.4, 0.45 ),
			SKY_COLOR: new THREE.Vector3( 10.0, 13.0, 15.0 ),
			EXPOSURE : 0.15,
			GEOMETRY_RESOLUTION: gres,
			GEOMETRY_SIZE : gsize,
			RESOLUTION : res
} );
    }
}

