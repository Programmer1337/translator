const changedElems = []
let text
let toLang = 'en'
let requestsPending = 0
let isOn

const synchronizeData = () => {
	chrome.storage.sync.get(['lang'], function (result) {
		if (!result.lang) {
			chrome.storage.sync.set({lang: 'en'})
			toLang = 'en'
		} else {
			toLang = result.lang
		}
	});

	chrome.storage.sync.get(['state'], function (result) {
		if (result.state === 'off') {
			isOn = false
		} else {
			isOn = true
			chrome.storage.sync.set({state: 'on'});

		}
	});


}

const sendReq = (text = 'Hello World', elem) => {
	document.body.style.cursor = 'progress'
	const data = JSON.stringify([
		{
			"Text": text
		}
	]);

	const xhr = new XMLHttpRequest();
	xhr.withCredentials = true;

	xhr.addEventListener("readystatechange", function () {
		if (this.readyState === this.DONE) {
			requestsPending--
			if (!requestsPending)
				document.body.style.cursor = 'default'
			if (changedElems.filter(value => value.elem === elem).length) {
				const translatedText = JSON.parse(this.response)[0].translations[0].text
				elem.nodeValue = elem.nodeValue.replace(/\s+/g, ' ').replace(text, translatedText)
			}
		}
	});

	xhr.open("POST", `https://microsoft-translator-text.p.rapidapi.com/translate?api-version=3.0&to=${toLang}&textType=plain&profanityAction=NoAction`);
	xhr.setRequestHeader("content-type", "application/json");
	xhr.setRequestHeader("x-rapidapi-host", "microsoft-translator-text.p.rapidapi.com");
	xhr.setRequestHeader("x-rapidapi-key", "c26b23dd8fmshdd3a251db7ca47fp1b0f2cjsnd350dd6bac9e");

	xhr.send(data);
}

function translate(text, elem) {

	const filteredText = text.replace(/\s+/g, ' ').trim().split('').filter(value => (value !== '\n')).join('').split(' ').filter(value => (value !== ' ') && (value !== "\n") && (value !== '')).join(' ')

	if ((/[a-zA-Z]/g.test(filteredText)) || (/[а-яА-Я]/g.test(filteredText))) {
		changedElems.push({
			elem: elem,
			defaultValue: elem.nodeValue
		})
		sendReq(filteredText, elem)
		requestsPending++
	}
	return text
}


document.addEventListener('mousedown', () => {
	synchronizeData()
	if (isOn) {
		changedElems.forEach(value => {
			value.elem.nodeValue = value.defaultValue
			value.elem.parentElement.normalize()
		})
		while (changedElems.length)
			changedElems.pop()
		if ((document.getSelection().anchorNode) && (!document.getSelection().getRangeAt(0).collapsed))
			document.getSelection().removeRange(document.getSelection().getRangeAt(0))
	}
}, false)

document.addEventListener("mouseup", () => {
	text = document.getSelection().toString()
	const selection = document.getSelection()
	const range = selection.anchorNode ? selection.getRangeAt(0) : null
	if (range && !range.collapsed && isOn) {
		const newStartNode = document.createElement("b");
		const newEndNode = document.createElement("e");
		const newRange = range.cloneRange()
		newRange.insertNode(newStartNode)
		newRange.setStart(range.endContainer, range.endOffset)
		newRange.insertNode(newEndNode)

		const afterRange = new Range()
		afterRange.setStart(newStartNode, 0)
		afterRange.setEnd(newEndNode, 0)
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
}, false)

chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.message === "get_lang")
			sendResponse({lang: toLang});
		if (request.message === "set_lang")
			toLang = request.elem
		if (request.message === "set_state")
			isOn = request.state
	});

