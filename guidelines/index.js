let totalLength = 0
let x = 0
let guidelines = []
let isPlaying = false;
let inter;
let prevDate;
let startPlayDate;
let cameraX = 0;
let prevValue = 0
let startSliderX = 0
const audio = new Audio();
const glMap = {}
glMap[0.7] = "red"
glMap[0.8] = "orange"
glMap[0.9] = "yellow"
glMap[1] = "green"
const GLOBAL_MARGIN = 10
let lastRenderedIndex = 0

function timeWithinBoundaries(coord) {
    return coord >= (cameraX + GLOBAL_MARGIN) / 100 && coord < (cameraX + panel.clientWidth - GLOBAL_MARGIN) / 100
}

function render() {
    if (isPlaying) {
        panel.innerHTML = `<div id="playLine" style: "left: ${x + GLOBAL_MARGIN - 1}px"></div>`
    } else {
        panel.innerHTML = ""
    }
    let index = 0
    lastRenderedIndex = 0
    for (let i of guidelines) {
        if (timeWithinBoundaries(i[0])) {
            panel.innerHTML += `<div data-index="${index}" class="${glMap[i[1]]} guideline" style="left: ${Math.round(i[0] * 100 + GLOBAL_MARGIN - cameraX)}px;"></div>`
            if (lastRenderedIndex < index) lastRenderedIndex = index
        }
        index++
    }
    // let sliderValue = getSlider().value
    // console.log(sliderValue)
}
function getGuidelineString(sep) {
    return guidelines.map(a => a.join(sep)).join(sep)
}
function reorderArr(arr) {
    return arr.sort((a, b) => {
        if (a[0]) return a[0] - b[0]
        else return a - b[0]
    })
}
function reorderGuidelines() {
    let currLastGL = guidelines[lastRenderedIndex]
    guidelines = reorderArr(guidelines)
    lastRenderedIndex = guidelines.findIndex(e => currLastGL[0] == e[0] && currLastGL[1] == e[1])
}
function getSliderX() {
    if (guidelines.length <= 0) return 0
    let lastX = Math.max(0, guidelines[guidelines.length - 1][0] * 100 - GLOBAL_MARGIN)
    return lastX * (slider.value / 100)
}
function getCurrentTime() {
    return Number(((Date.now() - startPlayDate) / 1000 + startSliderX / 100).toFixed(2))
}

function play() {
    isPlaying = !isPlaying
    slider.disabled = isPlaying
    cameraX = getSliderX()
    if (isPlaying) {
        startSliderX = getSliderX()
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
                    if (!timeWithinBoundaries((newX + cameraX) / 100)) {
                        panel.removeChild(i)
                    } else {
                        i.style = `left: ${newX}px;`
                    }
                }
                if (guidelines[lastRenderedIndex + 1] && timeWithinBoundaries(guidelines[lastRenderedIndex + 1][0] + 0.1)) {
                    lastRenderedIndex++
                    addGuidelineVisual(lastRenderedIndex)
                }
            } else x = x + dt;
            playLine.style = `left: ${x + GLOBAL_MARGIN - 1}`
            prevDate = date
        }, 10)
        startPlayDate = Date.now()
        prevDate = startPlayDate
        audio.currentTime = cameraX / 100
        audio.play()
    } else {
        x = 0;
        // slider.value = Number((startSliderX / lastX * 100).toFixed(1))
        render()
        clearInterval(inter)
        playBtn.innerHTML = "Play"
        inter = null;
        audio.pause()
    }
}

playBtn.addEventListener("click", play)

function addGuidelineVisual(index) {
    panel.innerHTML += `<div data-index="${index}" class="${glMap[guidelines[index][1]]} guideline" style="left: ${Math.round(guidelines[index][0] * 100 + GLOBAL_MARGIN - cameraX)}px;"></div>`
}

function addGuideline(time, type) {
    guidelines.push([time, type])
    let rendering = timeWithinBoundaries(time)
    if (rendering) {
        addGuidelineVisual(guidelines.length - 1)
        lastRenderedIndex = guidelines.length - 1
    }
    reorderGuidelines()
    render()
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
    if (evt.target.classList.contains("guideline")) {
        guidelines = guidelines.filter((_, i) => i != evt.target.dataset.index)
        panel.removeChild(evt.target)
        if (lastRenderedIndex < guidelines.length)
            lastRenderedIndex = guidelines.length - 1
        render()
        return false
    }
    return true
})

function switchGuideline(evt) {
    if (evt.target.classList.contains("guideline")) {
        if (evt.target.classList.contains("orange")) {
            evt.target.className = "yellow guideline"
            guidelines[evt.target.dataset.index][1] = 0.9
        } else if (evt.target.classList.contains("yellow")) {
            evt.target.className = "green guideline"
            guidelines[evt.target.dataset.index][1] = 1
        } else if (evt.target.classList.contains("green") || evt.target.classList.contains("red")) {
            evt.target.className = "orange guideline"
            guidelines[evt.target.dataset.index][1] = 0.8
        }
    }
}

document.body.addEventListener("mousedown", switchGuideline)

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
import_.addEventListener("click", () => {
    let val = prompt("Paste guideline string:")
    if (!val) {
        return alert("Guideline string is empty!")
    }
    let split = val.split(/;|~/)
    let newGuidelines = []
    lastRenderedIndex = 0
    for (let i = 0; i < split.length; i += 2) {
        let type = Number(split[i + 1])
        let time = Number(split[i]) || 0
        if (type == 0 || isNaN(type)) type = 0.8
        if (type != 0.8 && type != 0.9 && type != 1) type = 0.7
        newGuidelines.push([time, type])
        if (timeWithinBoundaries(time)) {
            lastRenderedIndex = i / 2
        }
    }
    guidelines = reorderArr(newGuidelines)
    render()
})
