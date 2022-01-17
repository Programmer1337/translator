const changedElems = []
let text
let toLang = 'en'
let requestsPending = 0
let isOn
let stack = []

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
	xhr.setRequestHeader("x-rapidapi-key", "");

	xhr.send(data);
}
const sendReq1 = () => {
	console.log('sending')
	fetch("http://localhost:3000/translate", {
		"method": "POST",
		"headers": {
			'Accept': 'application/json',
			"content-type": "application/json",
			"x-rapidapi-host": "microsoft-translator-text.p.rapidapi.com",
			"x-rapidapi-key": ""
		},
		body: JSON.stringify({temp: "temp"})
	})
		.then(response => {
			console.log(response);
			console.log(response.text());
			console.log(response.json());
			console.log('123')
		})
		.catch(err => {
			console.error(err);
		});
}

function translate(text, elem) {

	const filteredText = text.replace(/\s+/g, ' ').trim().split('').filter(value => (value !== '\n')).join('').split(' ').filter(value => (value !== ' ') && (value !== "\n") && (value !== '')).join(' ')

	if ((/[a-zA-Z]/g.test(filteredText)) || (/[а-яА-Я]/g.test(filteredText))) {
		changedElems.push({
			elem: elem,
			defaultValue: elem.nodeValue
		})
		// sendReq(filteredText, elem)
		// sendReq1(filteredText, elem)
		requestsPending++
	}
	return text
}


function sendRequest() {
	clear(true);
	requestsPending++;
	let requestedElems = []
	let body = {}
	stack = stack.filter(function (value, index) {
		value = value.text
		const filteredText = value.replace(/\s+/g, ' ').trim().split('').filter(value => (value !== '\n')).join('').split(' ').filter(value => (value !== ' ') && (value !== "\n") && (value !== '')).join(' ')
		// console.log('filteredText:', filteredText, ((/[a-zA-Z]/g.test(filteredText)) || (/[а-яА-Я]/g.test(filteredText))))
		return ((/[a-zA-Z]/g.test(filteredText)) || (/[а-яА-Я]/g.test(filteredText)))
	})


	// console.log('имеются пары', stack)

	stack.forEach(function (value, index) {
		changedElems.push({
			elem: value.elem,
			defaultValue: value.text
		})
		requestedElems.push(value.elem)
		body[index] = value.text.trim()
	})

	console.log('sending', stack)
	fetch("http://localhost:3000/translate", {
		"method": "POST",
		"headers": {
			'Accept': 'application/json',
			"content-type": "application/json",
			"x-rapidapi-host": "microsoft-translator-text.p.rapidapi.com",
			"x-rapidapi-key": ""
		},
		body: JSON.stringify(body)
	})
		.then(response => {
			requestsPending--
			if (requestsPending) {
				console.log("returning", requestsPending)
				return
			}
			response.json().then(res => {
				if (requestsPending) {
					console.log("returning", requestsPending)
					return
				}
				console.log(res)
				requestedElems.forEach(function (value, index) {
					if (changedElems.find(function (val) {
						return val.elem === value
					})) {
						value.nodeValue = res[index]
					}
				})
			});
		})
		.catch(err => {
			requestsPending--
			console.error(err);
		});

	stack = []

}


document.addEventListener('selectionchange', clear.bind(undefined,false), false)

function clear(forced = false) {
	// console.log('selection changed, current is ', document.getSelection())
		if (!document.getSelection().getRangeAt(0).collapsed) {
			if (!forced)
			return
		}
	console.log('forced is',forced)
	console.log('clearing')
	synchronizeData()
	console.log("ВОЗВРАЩАЕМ", changedElems.length)
	if (isOn) {
		changedElems.forEach(value => {
			value.elem.nodeValue = value.defaultValue
			// console.log('нормализируем',value, value.elem)
			value.elem.parentElement && value.elem.parentElement.normalize()
		})
		while (changedElems.length)
			changedElems.pop()
		// 	document.getSelection().removeRange(document.getSelection().getRangeAt(0))
	}
}


document.addEventListener("mouseup", () => {
	console.log("начинаем")
	clear(true)
	// text = document.getSelection().toString()
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
				// translate(newElem.nodeValue, newElem)
				stack.push({
					text: newElem.nodeValue,
					elem: newElem
				})
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
		sendRequest()
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

