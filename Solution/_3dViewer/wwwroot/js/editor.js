import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/OrbitControls.js';
import { GLTFLoader } from '../lib/GLTFLoader.js';
import { TransformControls } from '../lib/TransformControls.js';
import { GLTFExporter } from '../lib/GLTFExporter.js';
import { RGBELoader } from '../lib/RGBELoader.js';
import { RoughnessMipmapper } from '../lib/RoughnessMipmapper.js';

const APP_STATE = { EDIT: 1, ANNOTATION: 2, WATCH: 3, SAVE: 4 }

/** Основные объекты сцены */
let scene;
let camera;
let renderer;
let orbitControls;
let transformControls;
let loader;
let exporter;
let hdrploader;
let objectLoader;

/** Элементы интерактива */
let cube;
let targetList = [];
let appState = APP_STATE.EDIT;
let transfromFlag = true;
let mouse = new THREE.Vector2();
let helpnotification;
let parentObject;

/** Анимация загрузки */
const loading = $('#loading')

/** Элементы управления */
const editer_group = $('.editor_group')
/* ~поле ввода названия сцены */
const scene_name = $('#scene_name')
/* ~трансформация */
const btn_move = $('#btn_move')
const btn_rotate = $('#btn_rotate')
const btn_scale = $('#btn_scale')
/* ~меню */
const btn_hub = $('#btn_hub')
const btn_save = $('#btn_save')
const btn_models = $('#btn_models')
const btn_annotations = $('#btn_annotations')
const btn_hdri = $('#btn_hdri')

/** Всплывающие окна */
/* ~сохранение сцены */
const save_popup = $('#save_popup')
const save_cancel = $('#save_cancel')
const savename = $('input[name="scene.name"]')
const savedescription = $('textarea[name="scene.description"]')
const savesource = $('input[name="scene.source"]')
const sceneid = $('input[name="scene.id"]')
const form_save = $('#form_save')
/* ~контейнеры моделей и карт окружения */
const models_container = $('#models_container')
const hdri_list = $('.hdri-list')
const hdri = $('.hdri')
/* ~уведомления */
const editor_notification = $('#editor_notification')
/* ~создание аннотаций */
const add_annotation_popup = $('#add_annotation_popup')
const add_ann_cancel = $('#add_ann_cancel')
const form_add_ann = $('#form_add_ann')
const ann_title = $('input[name="ann.title"]')
const ann_description = $('textarea[name="ann.description"]')
const ann_posx = $('input[name="ann.posx"]')
const ann_posy = $('input[name="ann.posy"]')
const ann_posz = $('input[name="ann.posz"]')
const ann_rotx = $('input[name="ann.rotx"]')
const ann_roty = $('input[name="ann.roty"]')
const ann_rotz = $('input[name="ann.rotz"]')
const ann_pivotposx = $('input[name="ann.pivotposx"]')
const ann_pivotposy = $('input[name="ann.pivotposy"]')
const ann_pivotposz = $('input[name="ann.pivotposz"]')
const ann_sceneid = $('input[name="ann.sceneid"]')
/* аннотаций */
let annotation_btn = $('.annotation-btn')
let annotation_ui = $('.annotation_ui')

function Init() {
    scene = new THREE.Scene();
    scene.add(new THREE.GridHelper(10000, 100));

    CreateLoaderAndExporter();
    CreateCamera();
    CreateRenderer();
    CreateControls();
    ListenTransfromButton();

    var pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    $.ajax({
        url: '/Scenes/FileExist',
        traditional: true,
        contentType: 'application/x-www-form-urlencoded',
        data: {id: parseInt($('input[name="scene.Id"]').val())},
        success: function (result) {
            var count = 0;
            if (result.status !== 0) {
                objectLoader.parse(JSON.parse(result.source), function (obj) {
                    scene = obj
                    console.log("------------Start-------------")
                    console.log(scene)
                    console.log("-------------Meshes------------")
                    for (var i = 0; i < scene.children.length; i++) {
                        if (scene.children[i].type == "Mesh") {
                            console.log(scene.children[i])
                            const temp = scene.children[i]
                            targetList.push(temp)
                        }
                        if (scene.children[i].type == "Scene") {
                            var roughnessMipmapper = new RoughnessMipmapper(renderer);
                            console.log(scene.children[i])
                            const temp = scene.children[i]
                            targetList.push(temp)
                            temp.traverse(function (child) {
                                if (child.isMesh) {
                                    roughnessMipmapper.generateMipmaps(child.material);
                                }
                            });
                        }
                    }
                    console.log("------------End-------------")
                    console.log(scene)
                })
            } else {
                CreateLights();
                CreateGeometry();
            }
        }
    })


    $('.model').each(function (index) {

        const el = $(this)
        const filename = el.attr("filename")
        el.on('click', function () {
            loader.load(`../../models/${filename}.glb`, function (gltf) {
                var roughnessMipmapper = new RoughnessMipmapper(renderer);
                //gltf.scene.parent = scene;
                gltf.scene.traverse(function (child) {
                    if (child.isMesh) {
                        roughnessMipmapper.generateMipmaps(child.material);
                    }
                });
                const mesh = gltf.scene;
                mesh.name = filename;
                mesh.scale.set(100, 100, 100);
                mesh.position.y = 100;
                scene.add(mesh);
                targetList.push(mesh);
                transformControls.attach(mesh);
                scene.add(transformControls);
                console.log(scene.children)
            });
        })
    })

    hdrploader = new RGBELoader();
    hdrploader.setDataType(THREE.UnsignedByteType);
    hdrploader.load('../../textures/venice_sunset_1k.hdr', function (texture) {
        var envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.background = envMap;
        scene.environment = envMap;

        texture.dispose();
        pmremGenerator.dispose();

        loading.fadeOut()

        Render();
    });
}

/** Функций вызываемые из Init */
function CreateCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.set(500, 500, 500);
}

function CreateLoaderAndExporter() {
    loader = new GLTFLoader();
    objectLoader = new THREE.ObjectLoader();
    exporter = new GLTFExporter();
}

function CreateRenderer() {
    renderer = new THREE.WebGLRenderer({});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.physicallyCorrectLights = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);
}

function CreateControls() {
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.update();
    orbitControls.addEventListener('change', Render)
    orbitControls.rotateSpeed = 0.5;
    orbitControls.panSpeed = 0.5;
    orbitControls.enableDamping = false;
    orbitControls.screenSpacePanning = true;
    orbitControls.minDistance = 1;
    orbitControls.maxDistance = 3000;
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('change', Render);
    transformControls.addEventListener('dragging-changed', function (event) {
        orbitControls.enabled = !event.value;
    })
}

function CreateLights() {
    const ambientLight = new THREE.HemisphereLight(0xffffff, 0xa6a071, 1);
    scene.add(ambientLight);
}

function ListenTransfromButton() {
    btn_move.on('click', function () {
        if (appState === APP_STATE.EDIT)
            transformControls.setMode("translate");
    })
    btn_rotate.on('click', function () {
        if (appState === APP_STATE.EDIT)
            transformControls.setMode("rotate");
    })
    btn_scale.on('click', function () {
        if (appState === APP_STATE.EDIT)
            transformControls.setMode("scale");
    })
}

function CreateGeometry() {
    const geometry = new THREE.BoxGeometry(100, 100, 100);
    cube = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));
    cube.name = "mesh";
    cube.parent = scene;
    targetList.push(cube);
    if (transformControls.object != undefined) {
        transformControls.detach();
    }
    transformControls.attach(cube);
    scene.add(transformControls);
    scene.add(cube);
}
/** Конец функций вызываемых из Init */

/** Функций обновления каждого кадра */
function Animate() {
    requestAnimationFrame(Animate);
    Update();
    Render();
}

function Update() {
    if (annotation_ui.length > 0) {
        annotation_ui.each(function (index) {
            const vector = new THREE.Vector3(
                parseFloat(annotation_btn.eq(index).attr("xPivotPos").replace(',', '.')),
                parseFloat(annotation_btn.eq(index).attr("yPivotPos").replace(',', '.')),
                parseFloat(annotation_btn.eq(index).attr("zPivotPos").replace(',', '.'))
            );
            vector.project(camera);
            const canvas = renderer.domElement;
            vector.x = Math.round((0.5 + vector.x / 2) * (canvas.width / window.devicePixelRatio));
            vector.y = Math.round((0.5 - vector.y / 2) * (canvas.height / window.devicePixelRatio));
            $(this).css("top", `${vector.y}px`).css("left", `${vector.x}px`).children(".number").html(`${index + 1}`)
        })
    }
}

function Render() {
    renderer.render(scene, camera);
}
/** Конец функций обновления каждого кадра */

/** Функций элементов управления */
/* события для всей страницы */
$(document).on('keyup', function (key) {
    switch (key.keyCode) {
        case 68: // Клавиша "D"
            transformControls.detach();
            break;
        case 27: //Escape
            if (appState === APP_STATE.ANNOTATION) {
                appState = APP_STATE.EDIT;
                helpnotification.addClass('fadeOutLeft')
                add_annotation_popup.fadeOut()
                setTimeout(function () {
                    helpnotification.remove()
                }, 1000)
            }
            break;
        case 46: //Delete
            const selectedObject = transformControls.object;
            transformControls.detach();
            /*selectedObject.material = undefined;
            selectedObject.geometry = undefined;*/
            //selectedObject.dispose()
            const selectedParent = selectedObject.parent;
            console.log(selectedParent)
            selectedParent.remove(selectedObject);
            renderer.renderLists.dispose();
            break;
    }
}).on('dblclick', function () {
    if (appState === APP_STATE.ANNOTATION) {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        const ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, camera);
        const intersects = ray.intersectObjects(targetList, true);
        if (intersects.length > 0) {
            const vector = new THREE.Vector3(intersects[0].point);
            parentObject = intersects[0].object;
            console.log(vector);
            add_annotation_popup.fadeIn()
            ann_posx.attr("value", camera.position.x)
            ann_posy.attr("value", camera.position.y)
            ann_posz.attr("value", camera.position.z)
            ann_rotx.attr("value", camera.rotation.x)
            ann_roty.attr("value", camera.rotation.y)
            ann_rotz.attr("value", camera.rotation.z)
            ann_pivotposx.attr("value", vector.x.x)
            ann_pivotposy.attr("value", vector.x.y)
            ann_pivotposz.attr("value", vector.x.z)
        }
    }
}).on('click', function () {
    if (transfromFlag) {
        if (models_container.css("display") == "block") {
            models_container.fadeOut(100)
        }
        if (hdri_list.css("display") == "block") {
            hdri_list.fadeOut(100)
        }
    }
    if (appState == APP_STATE.EDIT) {
        if (transfromFlag) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
            const ray = new THREE.Raycaster();
            ray.setFromCamera(mouse, camera);
            const intersects = ray.intersectObjects(targetList, true);
            if (intersects.length > 0) {
                if (transformControls.object != undefined) {
                    transformControls.detach();
                }
                transformControls.attach(intersects[0].object);
                scene.add(transformControls);
            }
        }

    }
})
/* изменение размера окна браузера */
$(window).on('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})

editer_group.on('mouseover', function (event) {
    transfromFlag = false
}).on('mouseleave', function (event) {
    transfromFlag = true
})

/* возвращение в hub */
btn_hub.on('click', function () {
    $('body').fadeOut(1000, function () {
        window.location.href = '/Account/Hub'
    })
})
/* сохранение сцены */
btn_save.on('click', function () {
    transformControls.detach()
    savename.val(scene_name.val())
    savesource.val(JSON.stringify(scene.toJSON()))
    save_popup.fadeIn()
})
save_cancel.on('click', function () {
    save_popup.fadeOut()
})
form_save.submit(function (event) {
    loading.fadeIn()
    event.preventDefault()
    var data = {
        Name: savename.val(),
        Description: savedescription.val(),
        Source: savesource.val(),
        Id: sceneid.val()
    }
    console.log(data)
    if (data.Name === "" || data.Description === "") {
        ShowDangerNotification("Не удалось сохранить сцену.<br/>Название и описание должно быть заполнено")
    }
    else {
        $.ajax({
            type: 'POST',
            url: '/Scenes/SaveScene',
            traditional: true,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
            success: function (result) {
                loading.fadeOut()
                $('body').fadeOut(600, function () {
                    window.location.href = result.url
                })
            },
            error: function (xhr, status, error) {
                alert(xhr.responseText)
                alert(status)
                alert(error)
                loading.fadeOut()
            }
        })
    }
})
/* окно с моделями */
btn_models.on('click', function () {
    const display = models_container.css("display")
    if (display == "none") {
        models_container.fadeIn(100)
    }
    else {
        models_container.fadeOut(100)
    }
})
/* создание аннотаций */
btn_annotations.on('click', function () {
    if (appState === APP_STATE.EDIT) {
        appState = APP_STATE.ANNOTATION
        editor_notification.append(`
            <div type="help" class="notification">
                <div class="title">Действия</div>
                <div class="text">Нажмите два раза на место по модели, где хотите закрепить аннотацию<br/>---ИЛИ---<br/>Нажмите Escape чтобы отменить</div>
            </div>
        `)
        helpnotification = $('div[type="help"]')
        helpnotification.addClass('animated').addClass('fadeInLeft')
    }
    else {
        appState = APP_STATE.EDIT
        helpnotification.addClass('fadeOutLeft')
        add_annotation_popup.fadeOut()
        setTimeout(function () {
            helpnotification.remove()
        }, 1000)
    }
})
add_ann_cancel.on('click', function () {
    appState = APP_STATE.EDIT
    helpnotification.addClass('fadeOutLeft')
    add_annotation_popup.fadeOut()
    setTimeout(function () {
        helpnotification.remove()
    }, 1000)
})
form_add_ann.submit(function (event) {
    event.preventDefault()

    var data = {
        title: ann_title.val(),
        description: ann_description.val(),
        posx: ann_posx.val(),
        posy: ann_posy.val(),
        posz: ann_posz.val(),
        rotx: ann_rotx.val(),
        roty: ann_roty.val(),
        rotz: ann_rotz.val(),
        pivotposx: ann_pivotposx.val(),
        pivotposy: ann_pivotposy.val(),
        pivotposz: ann_pivotposz.val(),
        sceneid: ann_sceneid.val()
    }

    if (data.title === "" || data.description === "") {
        ShowDangerNotification("Не удалось добавить аннотацию.<br/>Название и описание должно быть заполнено")
    }
    else {
        loading.fadeIn()
        $.ajax({
            type: 'POST',
            url: '/Scenes/AddAnnotation',
            traditional: true,
            contentType: 'application/x-www-form-urlencoded',
            dataType: 'json',
            data: data,
            success: function (result) {
                console.log(result)
                add_annotation_popup.fadeOut()
                helpnotification.fadeOut()
                $('.annotations-list').append(`
                    <div class="annotation-btn"
                            xPos="${result.positionx}"
                            yPos="${result.positiony}"
                            zPos="${result.positionz}"
                            xRot="${result.roatationx}"
                            yRot="${result.roatationy}"
                            zRot="${result.roatationz}"
                            xPivotPos="${result.pivotposx}"
                            yPivotPos="${result.pivotposy}"
                            zPivotPos="${result.pivotposz}">
                        <div class="ann_title">${result.name}</div>
                        <div class="delete_ann" routeid="${result.id}"><i data-feather="x"></i></div>
                    </div>
                `)
                $('body').prepend(`
                    <div class="annotation_ui">
                        <div class="number">${annotation_ui.length + 1}</div>
                        <div class="content">
                            <p><strong>${result.name}</strong></p>
                            <p>${result.description}</p>
                        </div>
                    </div>
                `)
                appState = APP_STATE.EDIT
                annotation_btn = $('.annotation-btn')
                annotation_ui = $('.annotation_ui')
                console.log(annotation_ui.length)
                loading.fadeOut()
                feather.replace()
            }
        })
    }
})
$('body').on('click', '.annotation_ui', function (event) {
    event.preventDefault()
    const temp_ann = $(this)
    const visible = temp_ann.children(".content").css("display")
    temp_ann.children(".content").css("display", visible == "block" ? "none" : "block")
})
$('#annotations').on('click', '.ann_title', function (event) {
    event.preventDefault()
    const temp = $(this)
    const cameraTlPos = new TimelineMax({ paused: true });
    const cameraTlRot = new TimelineMax({ paused: true });
    const orbitTl = new TimelineMax({ paused: true });
    var xToPos = parseFloat(temp.parent().attr("xPos").replace(',', '.'));
    var yToPos = parseFloat(temp.parent().attr("yPos").replace(',', '.'));
    var zToPos = parseFloat(temp.parent().attr("zPos").replace(',', '.'));
    cameraTlPos.to(camera.position, 1, { x: xToPos, y: yToPos, z: zToPos, ease: Expo.easeOut });
    var xToRot = parseFloat(temp.parent().attr("xRot").replace(',', '.'));
    var yToRot = parseFloat(temp.parent().attr("yRot").replace(',', '.'));
    var zToRot = parseFloat(temp.parent().attr("zRot").replace(',', '.'));
    cameraTlRot.to(camera.rotation, 1, { x: xToRot, y: yToRot, z: zToRot, ease: Expo.easeOut });
    var xPivotPos = parseFloat(temp.parent().attr("xPivotPos").replace(',', '.'));
    var yPivotPos = parseFloat(temp.parent().attr("yPivotPos").replace(',', '.'));
    var zPivotPos = parseFloat(temp.parent().attr("zPivotPos").replace(',', '.'));
    orbitTl.to(orbitControls.target, 1, { x: xPivotPos, y: yPivotPos, z: zPivotPos });
    cameraTlPos.play();
    cameraTlRot.play();
    orbitTl.play();
})
$('#annotations').on('click', '.delete_ann', function (event) {
    event.preventDefault()
    loading.fadeIn()
    const temp = $(this)
    const thisitem = $(`.delete_ann[routeid="${temp.attr("routeid")}"]`)
    const token = $('[name=__RequestVerificationToken]').val();
    const data = { __RequestVerificationToken: token, id: parseInt(temp.attr("routeid")) }
    console.log(temp.attr("routeid"))
    $.ajax({
        async: true,
        type: 'POST',
        url: '/Scenes/DeleteAnnotation',
        traditional: true,
        contentType: 'application/x-www-form-urlencoded',
        data: data,
        success: function (result) {
            annotation_ui.eq($('.delete_ann').index(thisitem)).remove()
            temp.parent().remove()
            annotation_btn = $('.annotation-btn')
            annotation_ui = $('.annotation_ui')
            loading.fadeOut()
        },
        error: function (xhr, status, error) {
            alert(xhr.responseText);  // to see the error message
        }
    })
})
/* карты окружения */
btn_hdri.on('click', function () {
    const display = hdri_list.css("display")
    if (display == "none") {
        hdri_list.fadeIn(100)
    }
    else {
        hdri_list.fadeOut(100)
    }
})
hdri.each(function (index) {
    $(this).on('click', function () {
        var pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const hdrname = $(this).attr('name')
        hdrploader.load(`../../textures/${hdrname}.hdr`, function (texture) {
            var envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.background = envMap;
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
            Render();
        });
    })
})

/** Конец функций элементов управления */

Init();

Animate();



/** Вспомогательные функций */
function ShowDangerNotification(errorText) {
    editor_notification.append(`
                                <div class="notification nt-danger">
                                    <div class="title">Ошибка</div>
                                    <div class="text">${errorText}</div>
                                </div>
                            `)
    const temp = $('.notification').last()
    console.log(temp)

    temp.addClass('animated').addClass('fadeInLeft')

    setTimeout(function () {
        temp.addClass('fadeOut')
        setTimeout(function () {
            temp.animate({ height: 0, padding: 0, margin: 0 }, 800, function () {
                temp.remove()
            })
        }, 800)
    }, 3000);
}