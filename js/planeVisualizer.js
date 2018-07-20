
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

camera.position.set(0, 2, 2);  // reorientated camera vieing
camera.up.set(0, 0, 1);
camera.lookAt(new THREE.Vector3(0, 0, 0))

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var geometry = new THREE.BoxGeometry( 1, 1, 1 );
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );
var controls = new THREE.OrbitControls( camera );
var children = new THREE.Object3D();

var isDown = false;
var selectedObj_index;
var selectedObj_color = null;  // TODO create class

var getPlaneCorners_interval; // loop to get updated corners from server

function onMouseDown(event) {
	event.preventDefault();
	console.log("clicked");
	isDown = true;

	event.preventDefault();
	var mouseVector = new THREE.Vector3();
	mouseVector.x = 2 * (event.clientX / window.innerWidth) - 1;
	mouseVector.y = 1 - 2 * ( event.clientY / window.innerHeight );

	console.log("chilren", children.children);

	raycaster.setFromCamera(mouseVector, camera);
	var intersects = raycaster.intersectObjects(children.children);

	if (selectedObj_color !== null){
		//return original color of previous selected object
		children.children[ selectedObj_index ].material.color.setHex( selectedObj_color );
	}

	if (intersects.length != 0){
		obj = intersects[0].object; //nearest intersected obj with idx 0
		console.log("clicked ", obj.index)
	
		if (obj.index !== undefined){ // make sure selected are planes
			selectedObj_color = obj.material.color.getHex();
			obj.material.color.setHex( 0xaaffff );
			selectedObj_index = obj.index;
		}
	}
}

function onMouseUp(event) {
	event.preventDefault();
	isDown = false;
	isDragging = false;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	controls.handleResize();
}


function init(){

	// THREEjs control init 
	controls.rotateSpeed = 2.0;
	controls.zoomSpeed = 5;
	controls.panSpeed = 0.2;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;

	//create floor grid
	var size = 10;
	var divisions = 10;
	var gridXY = new THREE.GridHelper(size, divisions, 0xe68a00, 0xe68a00);//center color, and grid
	gridXY.rotation.x = Math.PI / 2
	gridXY.position.set(0, 0, 0);
	scene.add(gridXY)

	//event listener
	window.addEventListener('resize', onWindowResize, false);
	// window.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('mousedown', onMouseDown, false);
	window.addEventListener('mouseup', onMouseUp, false);

	//setInterval to keep ajax for new pointcloud
	getPlaneCorners_interval = setInterval(getPlaneCorners, 1000);

	// dir light, dunno working anot
	var dirLight = new THREE.DirectionalLight( 0xffffff, 0.125 );
	dirLight.position.set( 0, 0, 1 ).normalize();
	scene.add( dirLight );

	// add axis helper
	var axisHelper = new THREE.AxisHelper(0.1);
	scene.add(axisHelper);
}


function addObjtoScene(planes_obj){
	//polygon
	console.log(planes_obj.length);
	for (var i = 0; i < planes_obj.length; i++){
		children.add( createPolygon(planes_obj[i], i) );
		
		// sidebar click on element
		addSidebarElement(i);

		// add text on plane
		var midIdx = parseInt(planes_obj[i].length/2); 
		var x = ( planes_obj[i][midIdx][0] + planes_obj[i][0][0] ) / 2;
		var y = ( planes_obj[i][midIdx][1] + planes_obj[i][0][1] ) / 2;
		var z = ( planes_obj[i][midIdx][2] + planes_obj[i][0][2] ) / 2;
		addText("Plane"+i, x, y, z);
	}
	console.log(children)
	scene.add(children);
}


function createPolygon(vertices, idx){
	var poly = new THREE.Geometry(); 

	for (var i=0; i < vertices.length; i++  ){
		var corner = new THREE.Vector3( vertices[i][0], vertices[i][1], vertices[i][2]);
		poly.vertices.push(corner);
	}
	for (var x = 0; x < vertices.length-2; x++) {
        poly.faces.push(new THREE.Face3(0, x + 1, x + 2));
	}
	poly.computeFaceNormals();

	var material = new THREE.MeshBasicMaterial( { color: getRandomColor() , side: THREE.FrontSide } );
	var mesh = new THREE.Mesh( poly, material );
	mesh.material.side = THREE.DoubleSide;
	mesh["index"] = idx; // assign index attributes

	return mesh;
}

function animate() {
	requestAnimationFrame( animate );
	controls.update();
	// cube.rotation.x += 0.01;
	// cube.rotation.y += 0.01;
	renderer.render( scene, camera );
};


function getRandomColor() {
    var chars = '0123456789ABCDEF'.split('');
    var hex = '#';
    for (var i = 0; i < 6; i++) {
        hex += chars[Math.floor(Math.random() * 16)];
    }
    return hex;
}

function getPlaneCorners(){
	$.ajax({
		type: 'GET',
		url: '/dataReady',
		success: function (data) {
			//check if data is ready
			if ( data == true ){
				//add corner planes here
				console.log("It's ready!!!!");
				$.ajax({
					type: 'GET',
					url: '/planeDatas',
					success: function (data) {
						console.log(JSON.parse(data.planar_datas_json));
						addObjtoScene(JSON.parse(data.planar_datas_json));
					}
				})
				clearInterval(getPlaneCorners_interval);
			}
		}
	})
}



function addSidebarElement(idx){
	var name = "Plane" + idx;
	$("ol").append("<a href='#" + name+ "' id='" +name+ "' onclick='' >" + name + "</a>");
	$( "#" + name ).on("click touchstart", function() {   //touch by ios and desktop
		console.log("lol", this);
		document.getElementById(name).innerHTML = "YOU CLICKED ME!";
	});
}


function addText(inputText, x, y, z){
	// /////// draw text on canvas /////////

	// create a canvas element
	var canvas1 = document.createElement('canvas');
	var context1 = canvas1.getContext('2d');
	context1.font = "Bold 40px Arial";
	context1.fillStyle = "rgba(255,255,255,0.95)";
	context1.fillText(inputText, 30, 50);

	// canvas contents will be used for a texture
	var texture1 = new THREE.Texture(canvas1) 
	texture1.needsUpdate = true;
		
	var material1 = new THREE.MeshBasicMaterial( {map: texture1, side:THREE.DoubleSide } );
	material1.transparent = true;

	var mesh1 = new THREE.Mesh(
		new THREE.PlaneGeometry(1, 1.2),
		material1
		);
	mesh1.rotation.set(1.5,-1.5,0); //reorientated
	mesh1.position.set(x-0.22, y -0.2, z -0.3); //re orientated + input
	scene.add( mesh1 );
	console.log(mesh1)
}





init()
addText("Origin", 0, 0, 0);
animate();
// addElement()

//reference: https://codepen.io/MAKIO135/pen/rLYaKk