const changedElems = [];
let toLang = 'en';
let requestsPending = 0;
let isOn;
let stack = [];

function synchronizeData() {
	chrome.storage.sync.get(['lang'], function (result) {
		if (!result.lang) {
			chrome.storage.sync.set({lang: 'en'});
			toLang = 'en';
		} else {
			toLang = result.lang;
		}
	});

	chrome.storage.sync.get(['state'], function (result) {
		if (result.state === 'off') {
			if (isOn) {
				removeListeners();
			}
			isOn = false;
		} else {
			if (!isOn) {
				addListeners();
			}
			isOn = true;
			chrome.storage.sync.set({state: 'on'});
		}
	});
}


function addListeners() {
	document.addEventListener('selectionchange', clear.bind(undefined, false), false);
	document.addEventListener("mouseup", parseSelection, false);
}

function removeListeners() {
	document.removeEventListener('selectionchange', clear.bind(undefined, false), false);
	document.removeEventListener("mouseup", parseSelection, false);
}

function sendRequest() {
	clear(true);
	requestsPending++;
	let requestedElems = [];
	let body = {};
	stack = stack.filter(function (value, index) {
		value = value.text;
		const filteredText = value.replace(/\s+/g, ' ').trim().split('').filter(value => (value !== '\n')).join('').split(' ').filter(value => (value !== ' ') && (value !== "\n") && (value !== '')).join(' ');
		return ((/[a-zA-Z]/g.test(filteredText)) || (/[а-яА-Я]/g.test(filteredText)));
	})


	stack.forEach(function (value, index) {
		changedElems.push({
			elem: value.elem,
			defaultValue: value.text
		})
		requestedElems.push(value.elem);
		body[index] = value.text.trim();
	})

	fetch("http://localhost:3000/translate", {
		"method": "POST",
		"headers": {
			'Accept': 'application/json',
			"content-type": "application/json",
			"to": toLang
		},
		body: JSON.stringify(body)
	})
		.then(response => {
			requestsPending--;
			if (requestsPending) {
				return;
			}
			response.json().then(res => {
				if (requestsPending) {
					return;
				}
				requestedElems.forEach(function (value, index) {
					if (changedElems.find(function (val) {
						return val.elem === value;
					}) && (res[index])) {
						value.nodeValue = res[index];
					}
				})
			});
		})
		.catch(err => {
			requestsPending--;
			console.error(err);
		});

	stack = [];

}


function clear(forced = false) {
	if (!document.getSelection().getRangeAt(0).collapsed) {
		if (!forced)
			return;
	}
	synchronizeData();
	if (isOn) {
		changedElems.forEach(value => {
			value.elem.nodeValue = value.defaultValue;
			value.elem.parentElement && value.elem.parentElement.normalize();
		})
		while (changedElems.length) {
			changedElems.pop();
		}
	}
}

function parseSelection() {
	clear(true);
	const selection = document.getSelection();
	const range = selection.anchorNode ? selection.getRangeAt(0) : null;
	if (range && !range.collapsed && isOn) {
		const newStartNode = document.createElement("b");
		const newEndNode = document.createElement("e");
		const newRange = range.cloneRange();
		newRange.insertNode(newStartNode);
		newRange.setStart(range.endContainer, range.endOffset);
		newRange.insertNode(newEndNode);

		const afterRange = new Range();
		afterRange.setStart(newStartNode, 0);
		afterRange.setEnd(newEndNode, 0);
		let elem = afterRange.startContainer;
		for (let i = 0; i < 1350; i++) {
			if (elem.firstChild) {
				elem = elem.firstChild;
			} else if (elem.nextSibling) {
				elem = elem.nextSibling;
			} else if (elem.parentNode) {
				while (!elem.nextSibling) {
					elem = elem.parentNode;
				}
				elem = elem.nextSibling;
			}

			if (elem.nodeType === 3) {
				const newElem = elem;
				stack.push({
					text: newElem.nodeValue,
					elem: newElem
				})
			}
			if ((elem instanceof Element) && (elem.tagName === 'E'))
				break;
		}

		document.getSelection().removeRange(range);
		const newR = new Range();
		newR.setStart(newStartNode, 0);
		newR.setEnd(newEndNode, 0);
		document.getSelection().addRange(newR);
		newStartNode.remove();
		newEndNode.remove();
		sendRequest();
	}
}


chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		if (request.message === "get_lang")
			sendResponse({lang: toLang});
		if (request.message === "set_lang")
			toLang = request.elem;
		if (request.message === "set_state")
			isOn = request.state;
	});

synchronizeData();