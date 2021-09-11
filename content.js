

document.addEventListener('mousedown',()=>{
    document.getSelection().removeRange(document.getSelection().getRangeAt(0))
},false)

const changedElems=[]

let text

const sendReq = (text = 'Hello World', elem) => {
    const toLang = 'ru'
    const temp=elem
    // const textTo = 'Does anyone have a number of Ivanov Sergey Valerievich? (Probability theory)'
    const data = JSON.stringify([
        {
            "Text":text
            // "Text": "I have an extension where I am storing/retrieving een) the user has selected.When I am storing a selection, I enclose the section in a SPAN tag, and highlight the text in yellow. This causes the DOM structure around the selected text to split up into various text nodes. This causes a problem for me as when I try to restore this selection (without refreshing the page)"
        }
    ]);

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === this.DONE) {
            console.log(this)
            const translatedText = JSON.parse(this.response)[0].translations[0].text
            console.log("Исходный текст:",text,"Полученный:",translatedText)
            console.log("Вставить это в элемент",elem," вместо ",elem.nodeValue)
            temp.nodeValue = elem.nodeValue.replace(text, translatedText)
            document.normalize()
        }
    });

    xhr.open("POST", `https://microsoft-translator-text.p.rapidapi.com/translate?api-version=3.0&to=${toLang}&textType=plain&profanityAction=NoAction`);
    xhr.setRequestHeader("content-type", "application/json");
    xhr.setRequestHeader("x-rapidapi-host", "microsoft-translator-text.p.rapidapi.com");
    xhr.setRequestHeader("x-rapidapi-key", "c26b23dd8fmshdd3a251db7ca47fp1b0f2cjsnd350dd6bac9e");

    xhr.send(data);
}



function getSelectedNode() {
    if (document.selection)
        return document.selection.createRange().parentElement();
    else {
        var selection = window.getSelection();
        if (selection.rangeCount > 0)
            return selection.getRangeAt(0).startContainer.parentNode;
    }
}


document.addEventListener("mouseup", event => {
    text = document.getSelection().toString()
    const selection = document.getSelection()
    const range = selection.getRangeAt(0)
    // console.log(document)

    const elem = getSelectedNode()
    const length = document.getSelection().toString().length


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
                // console.log(elem.nodeValue.split('').filter(value => value !== '\n').filter(value => value !== ' '))
                const newElem = elem
                 translate(newElem.nodeValue, newElem)
                // translate(newElem.nodeValue)
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
        // document.normalize()
    }

    function translate(text, elem) {

        const alphabet = "abcdefghijklmnopqrstuvwxyz"
        // console.log('пытаемся', text)
        const filteredText = text.split('').filter(value => (value !== '\n')).join('').split(' ').filter(value => (value !== ' ') && (value !== "\n") && (value !== '')).join(' ')
        if (filteredText.length)
            console.log('перевести надо будет ', filteredText, 'в элементе ', elem, elem.nodeValue.includes(filteredText))
        if ((/[a-zA-Z]/g.test(filteredText))||(/[а-яА-Я]/g.test(filteredText)))
        sendReq(filteredText, elem)
        return text

        return text.split('').map(value => {
            if ((value !== ' ') && (value !== '\n'))
                return alphabet[Math.floor(Math.random() * alphabet.length)]
            else
                return value
        }).join('')
    }
})


function func(elem) {
    let depth = 0
    let maxDepth = 0
    let bottomElement = null
    // let elem = document.firstElementChild
    let path = "";
    for (let i = 0; i < 10000; i++) {
        if (elem.firstElementChild !== null) {
            elem = elem.firstElementChild
            depth++
            if (depth > maxDepth) {
                maxDepth = depth
                bottomElement = elem
            }
        } else if (elem.nextElementSibling !== null) {
            elem = elem.nextElementSibling
        } else {
            while (elem.nextElementSibling === null) {
                if (elem.parentElement === null) {
                    for (let g = 0; g <= maxDepth; g++) {
                        path = bottomElement.tagName.concat('' + path)
                        bottomElement = bottomElement.parentElement
                    }
                    return 0
                }
                elem = elem.parentElement
                depth--
            }
            elem = elem.nextElementSibling
        }
    }
    console.log(path)

}

function replaceSelectedText(replacementText) {
    var sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(replacementText));
        }
    } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        range.text = replacementText;
    }
}
