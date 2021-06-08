import * as THREE from '../node_modules/three/build/three.module.js';
import {OrbitControls} from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {THREEx} from './threex.domevents.js';
import { InteractionManager } from '../node_modules/three.interactive/build/three.interactive.module.js';

const PUMPJACK_PATHNAME = 'content/pumpjack2.glb'
const ACTIVE_LOCATIONS = 'content/positions_normalized_wellstatus.csv'


// function vertexShader() {
//     return `
//     precision highp float;

//     uniform mat4 projectionMatrix;
//     uniform mat4 modelViewMatrix;

//     attribute vec3 position;
//     attribute vec3 offset;
//     attribute vec4 color;

//     varying vec3 vPosition;
//     varying vec4 vColor;

//     void main(){
//         vPosition = offset * max(abs( 0.2 ), 1.0) + position;
        
//         vColor = color;

//         gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );

//     }    
//     `
// }

// function fragmentShader() {
//     return `
//     precision highp float;


//     varying vec3 vPosition;
//     varying vec4 vColor;

//     void main() {

//         vec4 color = vec4( vColor );

//         gl_FragColor = color;

//     }
//     `
// }

function instanceStandardMaterial() {
    const instanceMaterial = new THREE.MeshStandardMaterial({color:0xffffff});
    instanceMaterial.onBeforeCompile = function ( shader ) {
        shader.vertexShader = `  
            attribute vec3 instanceOffset;
            attribute float instanceOpacity;
            varying float vInstanceOpacity;
        ` + shader.vertexShader;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            [
                'vec3 transformed = vec3( position + instanceOffset );',
                'vInstanceOpacity = instanceOpacity;',

            ].join( '\n' )
        );

        // shader.fragmentShader = `
        //     varying float vInstanceOpacity;
        // ` + shader.fragmentShader;

        // shader.fragmentShader = shader.fragmentShader.replace(
        //     '#include <color_fragment>',
        //     [
        //         '#include <color_fragment>',
        //         'diffuseColor.a = vInstanceOpacity;',
        //     ].join( '\n' )
        //   );

      };
    return instanceMaterial;
}

function instanceCustomDistanceMaterial() {
    var myCustomDistanceMaterial = new THREE.MeshDistanceMaterial({
        depthPacking: THREE.RGBADepthPacking,
        alphaTest: 0.5
      });

    // app specific instancing shader code (only on vertex shader)
    myCustomDistanceMaterial.onBeforeCompile = shader => {
        // add instanced attribute to beginning
        shader.vertexShader = `  
            attribute vec3 instanceOffset;
        ` + shader.vertexShader;
        // modify 'transformed' variable with attribute
        shader.vertexShader = shader.vertexShader.replace(
          "#include <project_vertex>",
          `
          transformed = instanceOffset + transformed;
          #include <project_vertex>
          `
        );
      };

    return myCustomDistanceMaterial;
}

function instanceCustomDepthMaterial() {
    var myCustomDepthMaterial = new THREE.MeshDepthMaterial({
        depthPacking: THREE.RGBADepthPacking,
        alphaTest: 0.5
      });

    // app specific instancing shader code (only on vertex shader)
    myCustomDepthMaterial.onBeforeCompile = shader => {
        // add instanced attribute to beginning
        shader.vertexShader = `  
            attribute vec3 instanceOffset;
        ` + shader.vertexShader;
        // modify 'transformed' variable with attribute
        shader.vertexShader = shader.vertexShader.replace(
          "#include <project_vertex>",
          `
          transformed = instanceOffset + transformed;
          #include <project_vertex>
          `
        );
      };

    return myCustomDepthMaterial;
}

let camera, scene, renderer, controls;


init().catch( function ( err ) {

    console.error( err );

} );

async function init() {
/// Scene and Camera
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xcccccc );
    scene.fog = new THREE.FogExp2( 0xcccccc, 0.0015);
    //scene.fog = new THREE.Fog(0xcccccc, 1,2);
    //console.log(scene.fog);

    const perspective = 800;
    const fov = 180*(2*Math.atan(innerHeight/2/perspective))/Math.PI;
    camera = new THREE.PerspectiveCamera( fov, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.set( -501, 250, -200 );
    const start_cam_point = new THREE.Vector3(0, 0, 0);
    camera.lookAt(start_cam_point);
    //camera.rotation.y = 90 * Math.PI / 180;

/// Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    renderer.shadowCameraNear = 0.1;
    renderer.shadowCameraFar = camera.far;
    renderer.shadowCameraFov = 50;
    renderer.shadowMapBias = 0.0039;
    renderer.shadowMapDarkness = 0.5;
    renderer.shadowMapWidth = 2048;
    renderer.shadowMapHeight = 2048;
    document.body.appendChild(renderer.domElement);

/// Controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;

    controls.screenSpacePanning = false;

    controls.minDistance = 10;
    controls.maxDistance = 1000;
    const start_v = new THREE.Vector3(0,1,0);
    controls.target = start_v;

    controls.maxPolarAngle = Math.PI / 2;

/// Lights

    const dirLightFrustumSize = 1500;
    const west_target = new THREE.Object3D();
    west_target.position.set(0,0,500);
    scene.add(west_target);
    const east_target = new THREE.Object3D();
    east_target.position.set(0,0,100);
    scene.add(east_target);

    const dirLight1 = new THREE.DirectionalLight( 0xffffff, 0.8 );
    dirLight1.position.set( 0, 500, 0 );
    dirLight1.target = west_target;
    // dirLight1.target.position.set(0,0,100);
    dirLight1.castShadow = true;
    dirLight1.shadow.camera.far = 1000;
    dirLight1.shadow.camera.left = -dirLightFrustumSize; // or whatever value works for the scale of your scene
    dirLight1.shadow.camera.right = dirLightFrustumSize;
    dirLight1.shadow.camera.top = dirLightFrustumSize;
    dirLight1.shadow.camera.bottom = -dirLightFrustumSize;
    dirLight1.shadow.mapSize.x = 16384;
    dirLight1.shadow.mapSize.y = 16384;
    scene.add( dirLight1 );

    const dirLight2 = new THREE.DirectionalLight( 0xb8c9ff, .1 );
    dirLight2.position.set( 0, 500, 0 );
    dirLight2.target = east_target;
    //dirLight2.castShadow = true;
    // dirLight2.shadow.camera.far = 1000;
    // dirLight2.shadow.camera.left = -dirLightFrustumSize; // or whatever value works for the scale of your scene
    // dirLight2.shadow.camera.right = dirLightFrustumSize;
    // dirLight2.shadow.camera.top = dirLightFrustumSize;
    // dirLight2.shadow.camera.bottom = -dirLightFrustumSize;
    // dirLight2.shadow.mapSize.x = 8192;
    // dirLight2.shadow.mapSize.y = 8192;
    scene.add( dirLight2 );


    const plight = new THREE.PointLight( 0xffffff , 10, 100 );
    plight.position.set( 0, 1, 0 );
    plight.castShadow = true;
    //scene.add(plight);

    const ambientLight = new THREE.AmbientLight( 0xb8c9ff , 0.2);
    scene.add( ambientLight );

/// Geometry and Materials
    // ground
    const planeGeometry = new THREE.PlaneGeometry(1400,1400);
    const texture_floor = new THREE.TextureLoader().load('/content/southmap.png');
    const mesh_floor = new THREE.Mesh( planeGeometry, new THREE.MeshBasicMaterial({map:texture_floor}) );
    const mesh_shadowcatcher = new THREE.Mesh( planeGeometry, new THREE.ShadowMaterial({opacity: 0.5}) );

    mesh_floor.rotation.set(- Math.PI / 2, 0, - Math.PI / 2);
    mesh_floor.position.y = -0.03;

    const texture_modern_income = new THREE.TextureLoader().load('/content/modern_income.png');
    const mesh_modern_income = new THREE.Mesh( planeGeometry, new THREE.MeshBasicMaterial({map:texture_modern_income}));

    mesh_modern_income.rotation.set(- Math.PI / 2, 0, - Math.PI / 2);
    mesh_modern_income.position.y = -0.04;
    var objHidden = true;
    mesh_modern_income.visible = false;
    mesh_floor.visible = true;
    mesh_modern_income.frustumCulled = false;

    mesh_shadowcatcher.rotation.set(- Math.PI / 2, 0, - Math.PI / 2);
    mesh_shadowcatcher.position.y = mesh_floor.position.y;
    mesh_shadowcatcher.receiveShadow = true;
    mesh_shadowcatcher.frustumCulled = false;

    //scene.add(mesh_modern_income);
    scene.add( mesh_floor );
    scene.add(mesh_shadowcatcher);

    document.getElementById("hideShow").addEventListener("click", function(){
        if(objHidden) {
            objHidden = false;
            // code to show object
            mesh_floor.visible = false;
            mesh_modern_income.visible = true;
        } else {
            objHidden = true;
            mesh_floor.visible = true;
            mesh_modern_income.visible = false;
        }});
 
   
//click events
    // const interactionManager = new InteractionManager(
    //     renderer,
    //     camera,
    //     renderer.domElement
    // );
    // const domEvents = new THREEx.DomEvents(camera, renderer.domElement);

    // const unclicked_color = new THREE.Color(0x505643);
    // const clicked_color = new THREE.Color(0x00ff00)
    // const cube_geo = new THREE.BoxGeometry(10,10,10);
    // const cube_mat = new THREE.MeshPhongMaterial({color: unclicked_color});
    // const cube_start = new THREE.Mesh(cube_geo, cube_mat);
    // cube_start.name = 'start_scene';
    // cube_start.position.set(-500, 70, -200);
    // scene.add(cube_start);

    // const cube_signalhill = new THREE.Mesh(cube_geo, cube_mat);
    // cube_signalhill.position.set(-10, 70, 550);
    // scene.add(cube_signalhill);

    // domEvents.addEventListener(cube_start, 'click', event => {
    //     if (cube_start.material.color === unclicked_color){
    //         cube_start.material.color = clicked_color;
    //         startPanelIn();
    //     }
    //     else{
    //         cube_start.material.color = unclicked_color;
    //         // controls.target = new THREE.Vector3(-500, 1, -200);
    //         // camera.position.set( -501, 250, -200 );
    //         // camera.lookAt(start_cam_point);
    //     }
    // });

    // // domEvents.addEventListener(mesh_floor, 'click', event => {
    // //     if (cube_start.material.color === clicked_color){
    // //         cube_start.material.color = unclicked_color
    // //         startPanelOut();
    // //     }
    // // });

    // domEvents.addEventListener(cube_signalhill, 'click', event => {
    //     if (cube_signalhill.material.color === clicked_color){
    //     cube_signalhill.material.color = unclicked_color;
    //     }
    //     else{
    //         cube_signalhill.material.color = clicked_color;
    //     }

    // })


//Pumpjack data positions/shader 3d models
    let results;

    const csv_data = [ Papa.parse(ACTIVE_LOCATIONS, {
        dynamicTyping: true,
        download: true,
        header: true,
        comments: "*=",
        complete: function(data) {
            results = data.data;
            load_pumpjacks(results);
        }
        }
    )];

    async function load_pumpjacks(pumpjack_data){
        const gltfLoader = new GLTFLoader();

        const [ gltf ] = await Promise.all( [
            gltfLoader.loadAsync( PUMPJACK_PATHNAME ),
        ] );

        // environment
        var cubeMapOptions = {
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            magFilter: THREE.LinearFilter
        };

        // attributes
        const vector = new THREE.Vector4();
        const instancesTotal = pumpjack_data.length;
        var instances = instancesTotal;
        var instancesOpaque = 0;
        var instancesTransparent = 0;
        const positions = [];
        const offsets = [];
        const colors = [];
        const offsetsTransparent = [];
        const colorsTransparent = [];
        const opacities = [];
        positions.push( 0, 5, 0 );
        positions.push( 1, 0, 0 );

        for ( let i = 0; i < instances; i++ )
        {
            // offsets
            const spreadx = 915;
            const spreadz = 1940;
            var offset = [ spreadx*(pumpjack_data[i].latitude - 0.592), 0, spreadz*(pumpjack_data[i].longitude - 0.356) ];

            var wellstatus = pumpjack_data[i].wellstatus;
            
            var color = (0.0,0.0,0.0);
            var opacity = 0.0;

            switch(wellstatus){
                case "Plugged": 
                    color = [0.0,0.0,0.0];
                    offset.y -= -0.005;
                    opacity = 0.06;
                    break;
                case "Canceled":
                    color = [0.0,0.0,0.0];
                    offset.y -= -0.005;
                    break;
                case "Idle": 
                    color = [0.6,0.4,0.2];
                    opacity = 1.0;
                    break;
                case "Active": 
                    color = [0.1,0.1,0.1];
                    offset.y -= -0.0025;
                    opacity = 1.0;
                    break;
                case "New": 
                    color = [1.0, 0.0, 0.0];
                    opacity = 1.0;
                    break;
                case "Unknown": 
                    color = [1.0, 1.0, 0.0];
                    offset.y -= -0.005;
                    opacity = 1.0;
                    break;
                default: 
                    color = [ 0.0, 0.0, 1.0];
                    offset.y -= -0.0075;
                    opacity = 1.0;
                    break;
            }

            if (opacity >= 1.0) {
                offsets.push(...offset);
                colors.push(...color);
                instancesOpaque++;
            }
            else if (opacity > 0.0) {
                offsetsTransparent.push(...offset);
                colorsTransparent.push(...color);
                opacities.push(opacity);
                instancesTransparent++;
            }

        }

        const scaleFactor = 1000; 
        gltf.scene.scale.multiplyScalar(scaleFactor);
        const gltfMesh = gltf.scene.children[0];
        const gltfMeshTransparent = gltfMesh.clone();

        const gltfBufferGeometry = gltfMesh.geometry;
        const gltfBufferGeometryTransparent = gltfMeshTransparent.geometry;
        
        const instancedBufferGeometry = new THREE.InstancedBufferGeometry();
        instancedBufferGeometry.index = gltfBufferGeometry.index;
        instancedBufferGeometry.instanceCount = instancesOpaque;
        instancedBufferGeometry.maxInstancedCount = instancesOpaque;
        instancedBufferGeometry.setAttribute('position', gltfBufferGeometry.getAttribute('position'), 3);
        instancedBufferGeometry.setAttribute('normal', gltfBufferGeometry.getAttribute('normal'), 3);
        instancedBufferGeometry.setAttribute('uv', gltfBufferGeometry.getAttribute('uv'), 2);
        instancedBufferGeometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ));
        instancedBufferGeometry.setAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 3 ) );

        const instancedBufferGeometryTransparent = new THREE.InstancedBufferGeometry();
        instancedBufferGeometryTransparent.index = gltfBufferGeometryTransparent.index;
        instancedBufferGeometryTransparent.instanceCount = instancesTransparent;
        instancedBufferGeometryTransparent.maxInstancedCount = instancesTransparent;
        instancedBufferGeometryTransparent.setAttribute('position', gltfBufferGeometryTransparent.getAttribute('position'), 3);
        instancedBufferGeometryTransparent.setAttribute('normal', gltfBufferGeometryTransparent.getAttribute('normal'), 3);
        instancedBufferGeometryTransparent.setAttribute('uv', gltfBufferGeometryTransparent.getAttribute('uv'), 2);
        instancedBufferGeometryTransparent.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute( new Float32Array( offsetsTransparent ), 3 ));
        instancedBufferGeometry.setAttribute( 'instanceOpacity', new THREE.InstancedBufferAttribute( new Float32Array( opacities ), 1 ) );


        const instanceMaterial = instanceStandardMaterial();
        instanceMaterial.vertexColors = true;
        instanceMaterial.transparent = false;
        instanceMaterial.depthTest = true;
        instanceMaterial.depthWrite = true;

        const instanceMaterialTransparent = instanceStandardMaterial();
        instanceMaterialTransparent.vertexColors = true;
        instanceMaterialTransparent.transparent = true;
        instanceMaterialTransparent.depthTest = true;
        instanceMaterialTransparent.depthWrite = false;
        instanceMaterialTransparent.opacity = 0.1;


        const instanceMesh = gltfMesh;
        instanceMesh.geometry = instancedBufferGeometry;
        instanceMesh.material = instanceMaterial;
        instanceMesh.castShadow = true;
        instanceMesh.receiveShadow = true;
        instanceMesh.customDistanceMaterial = instanceCustomDistanceMaterial();
        instanceMesh.customDepthMaterial = instanceCustomDepthMaterial();
        instanceMesh.frustumCulled = false;

        const instanceMeshTransparent = gltfMeshTransparent;
        instanceMeshTransparent.geometry = instancedBufferGeometryTransparent;
        instanceMeshTransparent.material = instanceMaterialTransparent;
        instanceMeshTransparent.castShadow = false;
        instanceMeshTransparent.receiveShadow = false;
        instanceMeshTransparent.customDistanceMaterial = instanceCustomDistanceMaterial();
        instanceMeshTransparent.customDepthMaterial = instanceCustomDepthMaterial();
        instanceMeshTransparent.frustumCulled = false;
        
        scene.add(instanceMesh, instanceMeshTransparent);
    }


/// Resize window and GUI
    window.addEventListener( 'resize', onWindowResize )

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }


}



var animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    render();
};

function render() {
    renderer.render(scene, camera);
}

animate();

