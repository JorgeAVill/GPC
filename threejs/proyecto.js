var sphereShape, sphereBody, world, physicsMaterial, walls=[], balls=[], ballMeshes=[], boxes=[], boxMeshes=[],mostro;

var camera, scene, renderer;
var geometry, material, mesh;
var controls,time = Date.now();
var theta = 0;
var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );
var path = "images/";
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if ( havePointerLock ) {

    var element = document.body;

    var pointerlockchange = function ( event ) {

        if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

            controls.enabled = true;

            blocker.style.display = 'none';

        } else {

            controls.enabled = false;

            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';

            instructions.style.display = '';

        }

    }

    var pointerlockerror = function ( event ) {
        instructions.style.display = '';
    }

    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

    instructions.addEventListener( 'click', function ( event ) {
        instructions.style.display = 'none';

        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

        if ( /Firefox/i.test( navigator.userAgent ) ) {

            var fullscreenchange = function ( event ) {

                if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {

                    document.removeEventListener( 'fullscreenchange', fullscreenchange );
                    document.removeEventListener( 'mozfullscreenchange', fullscreenchange );

                    element.requestPointerLock();
                }

            }

            document.addEventListener( 'fullscreenchange', fullscreenchange, false );
            document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );

            element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

            element.requestFullscreen();

        } else {

            element.requestPointerLock();

        }

    }, false );

} else {

    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

}

initCannon();
init();
animate();



function initCannon(){
    // ------MUNDO----------
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    var solver = new CANNON.GSSolver();

    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRelaxation = 4;

    // ------Iteraciones del mundo-------
    solver.iterations = 7;
    solver.tolerance = 0.1;
    var split = true;
    if(split)
        world.solver = new CANNON.SplitSolver(solver);
    else
        world.solver = solver;

    //------Gravedad del mundo--------
    world.gravity.set(0,-20,0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // ------------Material Físico------------
    physicsMaterial = new CANNON.Material("slipperyMaterial");
    var physicsContactMaterial = new CANNON.ContactMaterial(physicsMaterial,
                                                            physicsMaterial,
                                                            0.0, // friction coefficient
                                                            0.3  // restitution
                                                            );
    //------------Material Físico en el Mundo-------------
    world.addContactMaterial(physicsContactMaterial);

    //-------------Cuerpo------------
    var mass = 5, radius = 1.3;
    sphereShape = new CANNON.Sphere(radius);
    sphereBody = new CANNON.Body({ mass: mass });
    sphereBody.addShape(sphereShape);
    sphereBody.position.set(0,5,0);
    sphereBody.linearDamping = 0.9;
    world.add(sphereBody);

    //--------------Plano----------
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0),-Math.PI/2);
    world.add(groundBody);
}

function init() {

    //--------------Cámara-----------
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

    //-------------Escena-------------
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog( 0x000000, 0, 500 );
    texture = new THREE.TextureLoader().load(path+'night.jpg');

    //-------------Luz ambiental---------
    var ambient = new THREE.AmbientLight( 0x111111 );
    scene.add( ambient );

    //-----------Luz Focal---------------
    light = new THREE.SpotLight( 0xffffff );
    light.position.set( 10, 40, 10 );
    light.target.position.set( 0, 0, 0 );
    light.castShadow = true;
    light.shadow.CameraFar = 20; 
    light.shadow.mapSize.width = 2*512;
    light.shadow.mapSize.Height = 2*512;
    scene.add( light );


    //-------------Controles------------
    controls = new PointerLockControls( camera , sphereBody );                
    scene.add( controls.getObject() );

    //-------------Suelo----------------
    geometry = new THREE.PlaneGeometry( 70, 70, 50, 50 );
    geometry.applyMatrix( new THREE.Matrix4().makeRotationX(-Math.PI / 2 ) );
    var texturasuelo = new THREE.TextureLoader().load(path+'suelojpg.jpg');
    texturasuelo.wrapS = THREE.RepeatWrapping;
    texturasuelo.wrapT = THREE.RepeatWrapping;
    texturasuelo.repeat.set( 4, 4 );
    var materialsuelo = new THREE.MeshLambertMaterial({map:texturasuelo} );
    mesh = new THREE.Mesh( geometry, materialsuelo );
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add( mesh );

    //------------Renderer------------
    renderer = new THREE.WebGLRenderer();
    renderer.shadowMapEnabled = true;
    renderer.shadowMap.Type = THREE.PCFSoftShadowMap;
    renderer.shadowMapSoft = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( scene.fog.color, 1 );
    document.body.appendChild( renderer.domElement );

    //------------Evento------------
    window.addEventListener( 'resize', onWindowResize, false )

    //------------TRAMPOLÍN--------------
        //----------Base Trampolín-----------
    var halfExtents = new CANNON.Vec3(3,10,0.2);
    var boxShape = new CANNON.Box(halfExtents);
    var boxGeometry = new THREE.BoxGeometry(halfExtents.x*2,halfExtents.y*2,halfExtents.z*2);
    var x = -5;
    var y = 5;
    var z = -10;
    var angle = Math.PI / 2;
    var boxBody = new CANNON.Body({ mass: 1 });
    

    var texturamadera = new THREE.TextureLoader().load(path+'wood512.jpg');
    var materialmadera = new THREE.MeshLambertMaterial({map:texturamadera} );
    var boxMesh = new THREE.Mesh( boxGeometry, materialmadera );
    boxBody.quaternion.setFromEuler(90*Math.PI/180,0,90*Math.PI/180);
    boxMesh.rotation.x = 90*Math.PI/ 180;
    boxMesh.rotation.z = 90*Math.PI/ 180;
    world.add(boxBody);
    scene.add(boxMesh);
    boxBody.position.set(x,y,z);
    boxMesh.position.set(x,y,z);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxes.push(boxBody);
    boxMeshes.push(boxMesh);
    boxBody.addShape(boxShape);

        //----------Cilindro Trampolín---------
    var texturamadera = new THREE.TextureLoader().load(path+'barril.jpg');
    var materialmadera = new THREE.MeshLambertMaterial({map:texturamadera} );
    size = 2;
    var cylinderShape = new CANNON.Cylinder(size,size,3*size,100);
    var q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1,0,0),Math.PI / 2);
    var cylindergeometry = new THREE.CylinderGeometry(size,size,2*size,64);
    var cilindro = new THREE.Mesh( cylindergeometry, materialmadera );
    cylinderShape.transformAllPoints(new CANNON.Vec3(),q);
    var cylinderBody = new CANNON.Body({ mass: 1 });
    cylinderBody.quaternion.setFromEuler(0,90*Math.PI/180,90*Math.PI/180);
    cylinderBody.addShape(cylinderShape);
    cylinderBody.position.set(-5,2,-10);
    world.add(cylinderBody);
    scene.add(cilindro);
    boxes.push(cylinderBody);
    boxMeshes.push(cilindro);



    //-----------Cubos_en_grupo-----------
    var texture = new THREE.TextureLoader().load( path+'crate.gif' );
    var matcubo = new THREE.MeshBasicMaterial( { map: texture } );
    var size = 1;
    var box = new CANNON.Box(new CANNON.Vec3(size,size,size));
    convexShape = box.convexPolyhedronRepresentation;
    var mass = 10;
    for(var i=0; i<3; i++){
        for(var j=0; j<3; j++){
            var cajageom = new THREE.BoxGeometry(size*2,size*2,size*2);
            var caja = new THREE.Mesh(cajageom,matcubo);
            caja.castShadow = true;
            caja.receiveShadow = true;
            var boxbody = new CANNON.Body({ mass: 1 });
            boxbody.addShape(convexShape);
            boxbody.position.set(10+2*size*i+0.01,2*size*j + size*1.2,-15);
            world.add(boxbody);
            scene.add(caja);
            boxes.push(boxbody);
            boxMeshes.push(caja);
        }
    }

    // ----------------Caja_Libre----------
    var cajageom = new THREE.BoxGeometry(size*2,size*2,size*2);
    var caja = new THREE.Mesh(cajageom,matcubo);
    caja.castShadow = true;
    caja.receiveShadow = true;
    var boxbody = new CANNON.Body({ mass: 1 });
    boxbody.addShape(convexShape);
    boxbody.position.set(-20+2*size+0.01,2*size + size*1.2,-15);
    world.add(boxbody);
    scene.add(caja);
    boxes.push(boxbody);
    boxMeshes.push(caja);

    // ----------------Caja_Libre----------
    var cajageom = new THREE.BoxGeometry(size*2,size*2,size*2);
    var caja = new THREE.Mesh(cajageom,matcubo);
    caja.castShadow = true;
    caja.receiveShadow = true;
    var boxbody = new CANNON.Body({ mass: 1 });
    boxbody.addShape(convexShape);
    boxbody.position.set(-20+2*size+0.01,2*size + size*1.2,5);
    world.add(boxbody);
    scene.add(caja);
    boxes.push(boxbody);
    boxMeshes.push(caja);


    //-------------Cilindros Libres--------------
    var texturamadera = new THREE.TextureLoader().load(path+'barril.jpg');
    var materialmadera = new THREE.MeshLambertMaterial({map:texturamadera} );
    size = 2;
    var cylinderShape = new CANNON.Cylinder(size,size,3*size,100);
    var q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1,0,0),Math.PI / 2);
    var cylindergeometry = new THREE.CylinderGeometry(size,size,2*size,64);
    var cilindro = new THREE.Mesh( cylindergeometry, materialmadera );
    cylinderShape.transformAllPoints(new CANNON.Vec3(),q);
    var cylinderBody = new CANNON.Body({ mass: 1 });
    cylinderBody.quaternion.setFromEuler(0,90*Math.PI/180,90*Math.PI/180);
    cylinderBody.addShape(cylinderShape);
    cylinderBody.position.set(5,2,10);
    world.add(cylinderBody);
    scene.add(cilindro);
    boxes.push(cylinderBody);
    boxMeshes.push(cilindro);


    //-------------Cilindros Libres--------------
    var texturamadera = new THREE.TextureLoader().load(path+'barril.jpg');
    var materialmadera = new THREE.MeshLambertMaterial({map:texturamadera} );
    size = 2;
    var cylinderShape = new CANNON.Cylinder(size,size,3*size,100);
    var q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1,0,0),Math.PI / 2);
    var cylindergeometry = new THREE.CylinderGeometry(size,size,2*size,64);
    var cilindro = new THREE.Mesh( cylindergeometry, materialmadera );
    cylinderShape.transformAllPoints(new CANNON.Vec3(),q);
    var cylinderBody = new CANNON.Body({ mass: 1 });
    cylinderBody.quaternion.setFromEuler(0,90*Math.PI/180,90*Math.PI/180);
    cylinderBody.addShape(cylinderShape);
    cylinderBody.position.set(-20,2,-10);
    world.add(cylinderBody);
    scene.add(cilindro);
    boxes.push(cylinderBody);
    boxMeshes.push(cilindro);


    //------------Muros---------------
    tamaño = new CANNON.Vec3(30,5,3);
    mate = new THREE.MeshLambertMaterial( { color: 0xddd } ); 
    var boxForma = new CANNON.Box(tamaño);
    var boxGeom = new THREE.BoxGeometry(tamaño.x*2,tamaño.y*2,tamaño.z*2);
    var x = 0;
    var y = 5;
    var z = -20;
    var boxCuerpo = new CANNON.Body({ mass: 0 });
    var texturapared = new THREE.TextureLoader().load(path+'wall2.jpg');
    var materialpared = new THREE.MeshLambertMaterial({map:texturapared} );
    var boxMalla = new THREE.Mesh( boxGeom, materialpared );
    world.add(boxCuerpo);
    scene.add(boxMalla);
    boxCuerpo.position.set(x,y,z);
    boxMalla.position.set(x,y,z);
    boxMalla.castShadow = true;
    boxMalla.receiveShadow = true;
    boxCuerpo.addShape(boxForma);
    boxes.push(boxCuerpo);
    boxMeshes.push(boxMalla);
    

    // izquierda
    tamaño = new CANNON.Vec3(20,5,3);
    var boxForma = new CANNON.Box(tamaño);
    var boxGeom = new THREE.BoxGeometry(tamaño.x*2,tamaño.y*2,tamaño.z*2);
    var x = -29;
    var y = 5;
    var z = 0;
    var boxCuerpo = new CANNON.Body({ mass: 0 });
    var boxMalla = new THREE.Mesh( boxGeom, materialpared );
    boxCuerpo.quaternion.setFromEuler(0,-90*Math.PI/180,0);
    boxMalla.rotation.y = -90*Math.PI/ 180;
    world.add(boxCuerpo);
    scene.add(boxMalla);
    boxCuerpo.position.set(x,y,z);
    boxMalla.position.set(x,y,z);
    boxMalla.castShadow = true;
    boxMalla.receiveShadow = true;
    boxCuerpo.addShape(boxForma);
    boxes.push(boxCuerpo);
    boxMeshes.push(boxMalla);


    var x = 20;
    var y = 5;
    var z = 0;
    var boxCuerpo = new CANNON.Body({ mass:0 });
    var boxMalla = new THREE.Mesh( boxGeom, materialpared );
    boxCuerpo.quaternion.setFromEuler(0,-90*Math.PI/180,0);
    boxMalla.rotation.y = -90*Math.PI/ 180;
    world.add(boxCuerpo);
    scene.add(boxMalla);
    boxCuerpo.position.set(x,y,z);
    boxMalla.position.set(x,y,z);
    boxMalla.castShadow = true;
    boxMalla.receiveShadow = true;
    boxCuerpo.addShape(boxForma);
    boxes.push(boxCuerpo);
    boxMeshes.push(boxMalla);

    tamaño = new CANNON.Vec3(29,5,3);
    var boxForma = new CANNON.Box(tamaño);
    var boxGeom = new THREE.BoxGeometry(tamaño.x*2,tamaño.y*2,tamaño.z*2);
    var x = 0;
    var y = 5;
    var z = 20;
    var boxCuerpo = new CANNON.Body({ mass: 0 });
    var boxMalla = new THREE.Mesh( boxGeom, materialpared );
    world.add(boxCuerpo);
    scene.add(boxMalla);
    boxCuerpo.position.set(x,y,z);
    boxMalla.position.set(x,y,z);
    boxMalla.castShadow = true;
    boxMalla.receiveShadow = true;
    boxCuerpo.addShape(boxForma);
    boxes.push(boxCuerpo);
    boxMeshes.push(boxMalla);
    
    //---------Cubo_Grande_para_fondo---------
    var paredes = [ path+'right.jpg',path+'left.jpg',
        path+'top.jpg',path+'bottom.jpg',
        path+'front.jpg',path+'back.jpg'
    ];
    var mapaEntorno = new THREE.CubeTextureLoader().load(paredes);
    mapaEntorno.format = THREE.RGBFormat;
    var shader = THREE.ShaderLib.cube;
    shader.uniforms.tCube.value = mapaEntorno;
    var matparedes = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        dephtWrite: false,
        side: THREE.BackSide
    });
    
    var habitacion = new THREE.Mesh( new THREE.CubeGeometry(1000,1000,1000),matparedes);
    scene.add(habitacion);

}



function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var dt = 1/60;
function animate() {
    requestAnimationFrame( animate );

    if(controls.enabled){
        world.step(dt);

        // Update ball positions
        for(var i=0; i<balls.length; i++){
            ballMeshes[i].position.copy(balls[i].position);
            ballMeshes[i].quaternion.copy(balls[i].quaternion);
        }

        // Update box positions
        for(var i=0; i<boxes.length; i++){
            boxMeshes[i].position.copy(boxes[i].position);
            boxMeshes[i].quaternion.copy(boxes[i].quaternion);
        }
    }

    controls.update( Date.now() - time );
    renderer.render( scene, camera );
    time = Date.now();

}

