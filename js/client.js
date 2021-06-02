import * as THREE from '../node_modules/three/build/three.module.js';
import {OrbitControls} from '../node_modules/three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {THREEx} from './threex.domevents.js';
import { InteractionManager } from '../node_modules/three.interactive/build/three.interactive.module.js';

const PUMPJACK_PATHNAME = 'content/pumpjack2.glb'
const ACTIVE_LOCATIONS = 'content/positions_normalized_wellstatus.csv'


function vertexShader() {
    return `
    precision highp float;

    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;

    attribute vec3 position;
    attribute vec3 offset;
    attribute vec4 color;

    varying vec3 vPosition;
    varying vec4 vColor;

    void main(){
        vPosition = offset * max(abs( 0.2 ), 1.0) + position;
        
        vColor = color;

        gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );

    }    
    `
}

function fragmentShader() {
    return `
    precision highp float;


    varying vec3 vPosition;
    varying vec4 vColor;

    void main() {

        vec4 color = vec4( vColor );

        gl_FragColor = color;

    }
    `
}

let camera, scene, renderer, controls;


init().catch( function ( err ) {

    console.error( err );

} );

async function init() {
/// Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

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
    const dirLight1 = new THREE.DirectionalLight( 0xffffff );
    dirLight1.position.set( 1, 1, 1 );
    scene.add( dirLight1 );

    const dirLight2 = new THREE.DirectionalLight( 0x002288 );
    dirLight2.position.set( - 1, - 1, - 1 );
    scene.add( dirLight2 );

    const ambientLight = new THREE.AmbientLight( 0x222222 );
    scene.add( ambientLight );

/// Geometry and Materials
    // ground
    const texture_floor = new THREE.TextureLoader().load('/content/southmap.png');
    const mesh_floor = new THREE.Mesh( new THREE.PlaneGeometry(1400,1400), new THREE.MeshBasicMaterial({map:texture_floor}) );
    //console.log(mesh_floor);
    mesh_floor.rotation.x = - Math.PI / 2;
    mesh_floor.rotation.z = - Math.PI / 2

    const texture_modern_income = new THREE.TextureLoader().load('/content/modern_income.png');
    const mesh_modern_income = new THREE.Mesh( new THREE.PlaneGeometry(1400, 1400), new THREE.MeshBasicMaterial({map:texture_modern_income}));

    mesh_modern_income.rotation.x = - Math.PI / 2;
    mesh_modern_income.rotation.z = - Math.PI / 2
    mesh_modern_income.position.y = -0.01;
    var objHidden = true;
    mesh_modern_income.visible = false;
    mesh_floor.visible = true;
    mesh_modern_income.frustumCulled = false;

    scene.add(mesh_modern_income);
    scene.add( mesh_floor );

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
        const instances = pumpjack_data.length;
        const positions = [];
        const offsets = [];
        const colors = [];
        positions.push( 0, 5, 0 );
        positions.push( 1, 0, 0 );

        for ( let i = 0; i < instances; i++ )
        {
            // offsets
            const spreadx = 915;
            const spreadz = 1940;
            offsets.push( spreadx*(pumpjack_data[i].latitude - 0.592), 0, spreadz*(pumpjack_data[i].longitude - 0.356) );
            var wellstatus = pumpjack_data[i].wellstatus

            switch(wellstatus){
                case "Idle": colors.push(0.6,0.4,0.2,1);
                    break;
                case "Active": colors.push(0.0,0.0,0.0,1.0);
                    break;
                case "Plugged": colors.push(0.0,0.0,0.0,0.06);
                    break;
                case "New": colors.push(1.0, 0.0, 0.0, 1.0);
                    break;
                case "Canceled": colors.push(0.0, 0.0, 0.0, 0.0);
                    break;
                case "Unknown": colors.push(1.0, 1.0, 0.0, 1.0);
                    break;
                default: colors.push( 0.0, 0.0, 1, 1.0);
            }

        }

        const scaleFactor = 1000; 
        gltf.scene.scale.multiplyScalar(scaleFactor);
        const gltfMesh = gltf.scene.children[0];
        const gltfBufferGeometry = gltfMesh.geometry;

        const instancedBufferGeometry = new THREE.InstancedBufferGeometry();
        instancedBufferGeometry.index = gltfBufferGeometry.index;
        instancedBufferGeometry.instanceCount = instances;
        instancedBufferGeometry.setAttribute('position', gltfBufferGeometry.getAttribute('position'), 3);
        instancedBufferGeometry.setAttribute('normal', gltfBufferGeometry.getAttribute('normal'), 3);
        instancedBufferGeometry.setAttribute('uv', gltfBufferGeometry.getAttribute('uv'), 2);
        instancedBufferGeometry.setAttribute('offset', new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3 ));
        instancedBufferGeometry.setAttribute( 'color', new THREE.InstancedBufferAttribute( new Float32Array( colors ), 4 ) );

        const instanceMaterial = new THREE.RawShaderMaterial( {

            vertexShader: vertexShader(),
            fragmentShader: fragmentShader(),
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false

        } );

        const instanceMesh = gltfMesh;
        instanceMesh.geometry = instancedBufferGeometry;
        instanceMesh.material = instanceMaterial;
        instanceMesh.frustumCulled = false;
        
        scene.add( instanceMesh);
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

