const changedElems = []
let text
let toLang = 'en'


chrome.storage.sync.get(['lang'], function (result) {
    console.log('result is ',JSON.stringify( result))
    if (!result.lang) {
        chrome.storage.sync.set({lang: 'en'})
        toLang = 'en'
    } else {
        toLang = result.lang
    }
});

document.addEventListener('mousedown', () => {
    changedElems.forEach(value => {
        value.elem.nodeValue = value.defaultValue
        value.elem.parentElement.normalize()
    })
    while (changedElems.length)
        changedElems.pop()
    if (!document.getSelection().getRangeAt(0).collapsed)
        document.getSelection().removeRange(document.getSelection().getRangeAt(0))
}, false)


chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === "get_lang")
            sendResponse({lang: toLang});
        if (request.message === "set_lang") {
            console.log('lang changed to', request.elem);
            toLang = request.elem
        }
    });


const sendReq = (text = 'Hello World', elem) => {
    const temp = elem
    const data = JSON.stringify([
        {
            "Text": text
        }
    ]);

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if ((this.readyState === this.DONE) && (changedElems.length)) {
            console.log(this)
            const translatedText = JSON.parse(this.response)[0].translations[0].text
            console.log("Исходный текст:", text, "Полученный:", translatedText)
            console.log("Вставить это в элемент", elem, " вместо ", elem.nodeValue)
            temp.nodeValue = elem.nodeValue.replace(text, translatedText)
        }
    });

    xhr.open("POST", `https://microsoft-translator-text.p.rapidapi.com/translate?api-version=3.0&to=${toLang}&textType=plain&profanityAction=NoAction`);
    xhr.setRequestHeader("content-type", "application/json");
    xhr.setRequestHeader("x-rapidapi-host", "microsoft-translator-text.p.rapidapi.com");
    xhr.setRequestHeader("x-rapidapi-key", "c26b23dd8fmshdd3a251db7ca47fp1b0f2cjsnd350dd6bac9e");

    xhr.send(data);
}


document.addEventListener("mouseup", event => {
    text = document.getSelection().toString()
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)

    if (!range.collapsed) {
        const newStartNode = document.createElement("b");
        const newEndNode = document.createElement("e");
        const newRange = range.cloneRange()
        newRange.insertNode(newStartNode)
        newRange.setStart(range.endContainer, range.endOffset)
        newRange.insertNode(newEndNode)

        const afterRange = new Range()
        afterRange.setStart(newStartNode, 0)
        afterRange.setEnd(newEndNode, 0)
        console.log(afterRange)
        console.log(afterRange.cloneContents())
        let elem = afterRange.startContainer
        for (let i = 0; i < 1350; i++) {
            if (elem.firstChild) {
                elem = elem.firstChild
            } else if (elem.nextSibling) {
                elem = elem.nextSibling
            } else if (elem.parentNode) {
                while (!elem.nextSibling) {
                    elem = elem.parentNode
                }
                elem = elem.nextSibling
            } else {
                console.log('некуда идти')
            }

            if (elem.nodeType === 3) {
                const newElem = elem
                translate(newElem.nodeValue, newElem)
            }
            if ((elem instanceof Element) && (elem.tagName === 'E'))
                break
        }

        document.getSelection().removeRange(range)
        const newR = new Range()
        newR.setStart(newStartNode, 0)
        newR.setEnd(newEndNode, 0)
        document.getSelection().addRange(newR)
        newStartNode.remove()
        newEndNode.remove()
    }

    function translate(text, elem) {

        const filteredText = text.split('').filter(value => (value !== '\n')).join('').split(' ').filter(value => (value !== ' ') && (value !== "\n") && (value !== '')).join(' ')
        if (filteredText.length)
            console.log('перевести надо будет ', filteredText, 'в элементе ', elem, elem.nodeValue.includes(filteredText))
        if ((/[a-zA-Z]/g.test(filteredText)) || (/[а-яА-Я]/g.test(filteredText))) {
            changedElems.push({
                elem: elem,
                defaultValue: elem.nodeValue
            })
            console.log('Changed list:', changedElems)
            sendReq(filteredText, elem)

        }
        return text
    }
})

