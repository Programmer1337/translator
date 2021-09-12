document.addEventListener('DOMContentLoaded', function () {
    const selector = document.getElementById("selector")
    const langs = ['ru', 'en', 'fr', 'de', 'uk', 'it']
    chrome.storage.sync.get(['lang'], function (result) {
        console.log('result is ', JSON.stringify(result))
        selector.value = result.lang
    });
    for (let i = 0; i < langs.length; i++) {
        let opt = document.createElement('option');
        opt.value = langs[i];
        opt.innerHTML = langs[i];
        selector.appendChild(opt);
    }
    selector.addEventListener('change', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {message: "set_lang", elem: selector.value});
            chrome.storage.sync.set({lang: selector.value});
        })
    }, false)
}, false)