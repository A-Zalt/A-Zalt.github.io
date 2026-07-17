let totalLength = 0
let x = 0
let guidelines = []
let isPlaying = false;
let inter;
let prevDate;
let startPlayDate;
let cameraX = 0;
let prevValue = 0
const audio = new Audio();
const glMap = {}
glMap[0.8] = "orange"
glMap[0.9] = "yellow"
glMap[1] = "green"
const GLOBAL_MARGIN = 10

function render() {
    if (isPlaying) {
        panel.innerHTML = `<div id="playLine" style: "left: ${x + GLOBAL_MARGIN - 1}px"></div>`
    } else {
        panel.innerHTML = ""
    }
    let index = 0
    for (let i of guidelines) {
        if (i[0] >= (cameraX + GLOBAL_MARGIN) / 100 && i[0] < (cameraX + panel.clientWidth - GLOBAL_MARGIN) / 100) {
            panel.innerHTML += `<div data-index="${index}" class="${glMap[i[1]]} guideline" style="left: ${Math.round(i[0] * 100 + GLOBAL_MARGIN - cameraX)}px;"></div>`
        }
        index++
    }
    // let sliderValue = getSlider().value
    // console.log(sliderValue)
}
function getGuidelineString(sep) {
    return guidelines.map(a => a.join(sep)).join(sep)
}
function test() {
    console.log(panel.clientWidth)
}
function reorderGuidelines() {
    guidelines = guidelines.sort((a, b) => {
        if (a[0]) return a[0] - b[0]
        else return a - b[0]
    })
}
function getSliderX() {
    if (guidelines.length <= 0) return 0
    let lastX = Math.max(0, guidelines[guidelines.length - 1][0] * 100 - GLOBAL_MARGIN)
    return lastX * (slider.value / 100)
}
function getCurrentTime() {
    return Number(((Date.now() - startPlayDate) / 1000).toFixed(2))
}

function play() {
    isPlaying = !isPlaying
    slider.disabled = isPlaying
    cameraX = getSliderX()
    if (isPlaying) {
        render()
        playBtn.innerHTML = "Stop"
        inter = setInterval(() => {
            if (!playLine) return
            let date = Date.now()
            let dt = (date - prevDate) / 10
            if (x >= panel.clientWidth / 2) {
                x = panel.clientWidth / 2
                cameraX = cameraX + dt;
                for (let i of panel.getElementsByClassName("guideline")) {
                    let newX = Math.round(Number(i.style.left.split("px")[0]) - dt);
                    if (newX < GLOBAL_MARGIN) {
                        panel.removeChild(i)
                    } else {
                        i.style = `left: ${newX}px;`
                    }
                }
            } else x = x + dt;
            playLine.style = `left: ${x + GLOBAL_MARGIN - 1}`
            prevDate = date
        }, 10)
        startPlayDate = Date.now()
        prevDate = startPlayDate
        audio.fastSeek(cameraX / 100)
        audio.play()
    } else {
        x = 0;
        render()
        clearInterval(inter)
        playBtn.innerHTML = "Play"
        inter = null;
        audio.pause()
    }
}

playBtn.addEventListener("click", play)

function addGuideline(time, type) {
    guidelines.push([time, type])
    if (time >= (cameraX + GLOBAL_MARGIN) / 100 && time < (cameraX + panel.clientWidth - GLOBAL_MARGIN) / 100) {
        panel.innerHTML += `<div data-index="${guidelines[guidelines.length - 1]}" class="${glMap[type]} guideline" style="left: ${Math.round(time * 100 + GLOBAL_MARGIN - cameraX)}px;"></div>`
    }
    reorderGuidelines()
}

document.body.addEventListener("keydown", (evt) => {
    if (evt.repeat) return
    if (evt.key == "Enter") {
        play()
    }
    if (isPlaying) {
        if (evt.key == "8") {
            addGuideline(getCurrentTime(), 0.8)
        } else if (evt.key == "9") {
            addGuideline(getCurrentTime(), 0.9)
        } else if (evt.key == "0") {
            addGuideline(getCurrentTime(), 1)
        }
    }
})

orangeBtn.addEventListener("click", () => {
    if (!isPlaying) return
    addGuideline(getCurrentTime(), 0.8)
})
yellowBtn.addEventListener("click", () => {
    if (!isPlaying) return
    addGuideline(getCurrentTime(), 0.9)
})
greenBtn.addEventListener("click", () => {
    if (!isPlaying) return
    addGuideline(getCurrentTime(), 1)
})

document.body.addEventListener("contextmenu", (evt) => {
    if (evt.target.id == "panel") return false
    if (evt.target.className.match("guideline")) {
        console.log(evt.target.dataset.index)
        guidelines = guidelines.filter((_, i) => i != evt.target.dataset.index)
        panel.removeChild(evt.target)
        return false
    }
    return true
})

slider.addEventListener("input", () => {
    cameraX = getSliderX()
    render()
})

upload.addEventListener("change", (evt) => {
    audio.src = URL.createObjectURL(evt.target.files[0])
})

exportOld.addEventListener("click", () => {
    if (guidelines.length < 1) return alert("There's nothing to copy!")
    navigator.clipboard.writeText(getGuidelineString(";"))
    alert("Copied guideline string to clipboard!")
})
exportNew.addEventListener("click", () => {
    if (guidelines.length < 1) return alert("There's nothing to copy!")
    navigator.clipboard.writeText(getGuidelineString("~"))
    alert("Copied guideline string to clipboard!")
})
