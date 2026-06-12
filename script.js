const qrText = document.getElementById('qr-text');
const qrColor = document.getElementById('qr-color');
const qrBg = document.getElementById('qr-bg');
const qrDotsType = document.getElementById('qr-dots-type');
const qrCornersType = document.getElementById('qr-corners-type');
const container = document.getElementById('canvas-container');
const btnDownload = document.getElementById('btn-download');

const qrCode = new QRCodeStyling({
    width: 200,
    height: 200,
    type: "svg",
    data: "https://weblocalstudio.com",
    dotsOptions: { color: "#4f46e5", type: "square" },
    backgroundOptions: { color: "#ffffff" },
    cornersSquareOptions: { type: "square" },
    imageOptions: { crossOrigin: "anonymous", hideBackgroundDots: true }
});

qrCode.append(container);

function updateQR() {
    qrCode.update({
        data: qrText.value || "https://weblocalstudio.com",
        dotsOptions: { color: qrColor.value, type: qrDotsType.value },
        backgroundOptions: { color: qrBg.value },
        cornersSquareOptions: { type: qrCornersType.value },
        cornersDotOptions: { type: qrCornersType.value }
    });
}

qrText.addEventListener('input', updateQR);
qrColor.addEventListener('input', updateQR);
qrBg.addEventListener('input', updateQR);
qrDotsType.addEventListener('change', updateQR);
qrCornersType.addEventListener('change', updateQR);

btnDownload.addEventListener('click', () => {
    qrCode.download({ name: "qr-weblocal-studio", extension: "png" });
});

const tabCam = document.getElementById('tab-cam');
const tabFile = document.getElementById('tab-file');
const camWrapper = document.getElementById('camera-reader-wrapper');
const fileWrapper = document.getElementById('file-reader-wrapper');
const scanResult = document.getElementById('scan-result');
const fileInput = document.getElementById('qr-file-input');
const btnStartCam = document.getElementById('btn-start-cam');
const cameraPlaceholder = document.getElementById('camera-placeholder');
const readerDiv = document.getElementById('reader');

let html5QrCode = null;
let cameraActive = false;
let archivoCargado = false;

const qrSuccessCallback = (decodedText) => {
    scanResult.className = "w-full p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-sm break-all text-indigo-600 font-semibold";
    if(decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
        scanResult.innerHTML = `<a href="${decodedText}" target="_blank" class="underline hover:text-indigo-800">${decodedText} ↗</a>`;
    } else {
        scanResult.textContent = decodedText;
    }
};

function startCamera() {
    cameraPlaceholder.classList.add('hidden');
    readerDiv.classList.remove('hidden');
    
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("reader");
    }

    html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 220, height: 220 } },
        qrSuccessCallback
    ).then(() => cameraActive = true).catch(err => {
        console.log(err);
        stopCamera();
    });
}

function stopCamera() {
    if (html5QrCode && cameraActive) {
        html5QrCode.stop().then(() => {
            cameraActive = false;
            cameraPlaceholder.classList.remove('hidden');
            readerDiv.classList.add('hidden');
        }).catch(err => console.log(err));
    }
}

btnStartCam.addEventListener('click', startCamera);

tabCam.addEventListener('click', () => {
    tabCam.className = "flex-1 text-sm font-medium py-2 rounded-lg bg-white shadow-sm text-slate-800 cursor-pointer";
    tabFile.className = "flex-1 text-sm font-medium py-2 rounded-lg text-slate-600 hover:text-slate-800 cursor-pointer";
    fileWrapper.classList.add('hidden');
    camWrapper.classList.remove('hidden');
});

tabFile.addEventListener('click', () => {
    tabFile.className = "flex-1 text-sm font-medium py-2 rounded-lg bg-white shadow-sm text-slate-800 cursor-pointer";
    tabCam.className = "flex-1 text-sm font-medium py-2 rounded-lg text-slate-600 hover:text-slate-800 cursor-pointer";
    camWrapper.classList.add('hidden');
    fileWrapper.classList.remove('hidden');
    stopCamera();
});

function procesarArchivoQR(file) {
    if (!file) return;

    scanResult.textContent = "Analizando imagen...";
    scanResult.className = "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500 italic";

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);
            
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                qrSuccessCallback(code.data);
            } else {
                scanResult.textContent = "No se detectó ningún código QR en la imagen.";
                scanResult.className = "w-full p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium";
            }
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function resetearSubidaArchivo() {
    archivoCargado = false;
    fileInput.disabled = false;
    fileInput.value = "";
    dropLabel.innerHTML = textoOriginalDrop;
    scanResult.textContent = "Esperando código para escanear...";
    scanResult.className = "w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm break-all text-slate-500 italic";
    fileWrapper.classList.remove('opacity-60', 'pointer-events-none');
}

fileInput.addEventListener('change', e => {
    if (e.target.files.length === 0) return;
    archivoCargado = true;
    fileInput.disabled = true;
    fileWrapper.classList.add('opacity-60');
    dropLabel.innerHTML = `<span class="text-3xl block mb-1">📄</span><span class="text-slate-700 font-medium block text-xs break-all">${e.target.files[0].name}</span><button id="btn-reset-file" class="mt-2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-md transition cursor-pointer pointer-events-auto">Subir otro</button>`;
    procesarArchivoQR(e.target.files[0]);
});

const dropLabel = fileWrapper.querySelector('label');
const textoOriginalDrop = dropLabel.innerHTML;

fileWrapper.addEventListener('click', (e) => {
    if (e.target.id === 'btn-reset-file') {
        e.preventDefault();
        e.stopPropagation();
        resetearSubidaArchivo();
    }
});

['dragenter', 'dragover'].forEach(eventName => {
    fileWrapper.addEventListener(eventName, (e) => {
        e.preventDefault();
        if (archivoCargado) return;
        fileWrapper.classList.replace('border-slate-300', 'border-indigo-500');
        fileWrapper.classList.add('bg-indigo-50/50');
        dropLabel.innerHTML = '<span class="text-4xl block mb-2">📥</span><span class="text-indigo-600 font-bold text-lg">¡Suelta aquí tu imagen!</span>';
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    fileWrapper.addEventListener(eventName, (e) => {
        e.preventDefault();
        if (archivoCargado) return;
        fileWrapper.classList.replace('border-indigo-500', 'border-slate-300');
        fileWrapper.classList.remove('bg-indigo-50/50');
        if (eventName === 'dragleave') {
            dropLabel.innerHTML = textoOriginalDrop;
        }
    }, false);
});

fileWrapper.addEventListener('drop', (e) => {
    if (archivoCargado) return;
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
        archivoCargado = true;
        fileInput.disabled = true;
        fileWrapper.classList.add('opacity-60');
        dropLabel.innerHTML = `<span class="text-3xl block mb-1">📄</span><span class="text-slate-700 font-medium block text-xs break-all">${files[0].name}</span><button id="btn-reset-file" class="mt-2 text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded-md transition cursor-pointer pointer-events-auto">Subir otro</button>`;
        procesarArchivoQR(files[0]);
    } else {
        dropLabel.innerHTML = textoOriginalDrop;
    }
});

const mobileTabGen = document.getElementById('mobile-tab-gen');
const mobileTabScan = document.getElementById('mobile-tab-scan');
const panelGenerator = document.getElementById('panel-generator');
const panelScanner = document.getElementById('panel-scanner');

mobileTabGen.addEventListener('click', () => {
    mobileTabGen.className = "flex-1 py-3 text-center text-sm font-semibold border-b-2 border-indigo-600 text-indigo-600 cursor-pointer";
    mobileTabScan.className = "flex-1 py-3 text-center text-sm font-semibold border-b-2 border-transparent text-slate-500 cursor-pointer";
    panelGenerator.classList.remove('hidden');
    panelScanner.classList.add('hidden');
    stopCamera();
});

mobileTabScan.addEventListener('click', () => {
    mobileTabScan.className = "flex-1 py-3 text-center text-sm font-semibold border-b-2 border-indigo-600 text-indigo-600 cursor-pointer";
    mobileTabGen.className = "flex-1 py-3 text-center text-sm font-semibold border-b-2 border-transparent text-slate-500 cursor-pointer";
    panelScanner.classList.remove('hidden');
    panelGenerator.classList.add('hidden');
});

function handleResize() {
    if (window.innerWidth >= 768) {
        panelGenerator.classList.remove('hidden');
        panelScanner.classList.remove('hidden');
    } else {
        if (mobileTabGen.classList.contains('text-indigo-600')) {
            panelGenerator.classList.remove('hidden');
            panelScanner.classList.add('hidden');
        } else {
            panelScanner.classList.remove('hidden');
            panelGenerator.classList.add('hidden');
        }
    }
}

window.addEventListener('resize', handleResize);
handleResize();